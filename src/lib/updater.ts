// Atualização automática.
// - macOS: o atualizador do Tauri baixa e instala a versão nova em segundo plano
//   (verificando a assinatura); depois basta reiniciar.
// - Android: o sistema não deixa um app de fora da Play Store se atualizar sozinho;
//   avisamos e baixamos o APK novo, e a pessoa confirma a instalação.
// - iPhone/iPad: quem instalou pelo AltStore recebe a versão nova por lá (fonte
//   altstore.json da release); aqui só avisamos e abrimos a página da release.

import { isTauri } from '@tauri-apps/api/core'

const REPO = 'marloon-dev/MacReader'

export type UpdateState =
  | { kind: 'reiniciar'; version: string }
  | { kind: 'baixar-apk'; version: string; url: string }
  | { kind: 'ver-release'; version: string; url: string }

const isAndroid = () => /Android/i.test(navigator.userAgent)
// O iPad se apresenta como Mac; a tela de toque denuncia.
const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

/** Compara versões SemVer simples (1.2.3). */
export function isNewer(candidate: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split(/[.-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0)
  const [a, b] = [parse(candidate), parse(current)]
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}

async function checkDesktop(): Promise<UpdateState | null> {
  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  if (!update) return null
  await update.downloadAndInstall()
  return { kind: 'reiniciar', version: update.version }
}

type Release = { tag_name: string; html_url: string; assets: { name: string; browser_download_url: string }[] }

/** Última release publicada, se for mais nova que a versão instalada. */
async function newerRelease(): Promise<Release | null> {
  const { getVersion } = await import('@tauri-apps/api/app')
  const current = await getVersion()
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) return null
  const release = (await response.json()) as Release
  return isNewer(release.tag_name, current) ? release : null
}

async function checkAndroid(): Promise<UpdateState | null> {
  const release = await newerRelease()
  const apk = release?.assets.find((asset) => /^macreader-android-.*\.apk$/.test(asset.name))
  if (!release || !apk) return null
  return { kind: 'baixar-apk', version: release.tag_name.replace(/^v/, ''), url: apk.browser_download_url }
}

async function checkIOS(): Promise<UpdateState | null> {
  const release = await newerRelease()
  if (!release) return null
  return { kind: 'ver-release', version: release.tag_name.replace(/^v/, ''), url: release.html_url }
}

/** Procura uma versão nova. Fora do app instalado (no navegador), não faz nada. */
export async function checkForUpdate(): Promise<UpdateState | null> {
  if (!isTauri()) return null
  try {
    if (isAndroid()) return await checkAndroid()
    if (isIOS()) return await checkIOS()
    return await checkDesktop()
  } catch (error) {
    // Sem internet ou GitHub fora do ar: tenta de novo na próxima abertura.
    console.warn('Não foi possível procurar atualizações', error)
    return null
  }
}

export async function restartApp(): Promise<void> {
  const { relaunch } = await import('@tauri-apps/plugin-process')
  await relaunch()
}

export async function openDownload(url: string): Promise<void> {
  const { openUrl } = await import('@tauri-apps/plugin-opener')
  await openUrl(url)
}
