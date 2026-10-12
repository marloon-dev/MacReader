<p align="center">
  <img src="assets/icon-1024.png" alt="Ícone do MacReader" width="112">
</p>

<h1 align="center">MacReader</h1>

<p align="center">Leitor de livros digitais para macOS, Android, iPhone e iPad.</p>

---

## O que ele faz

- **Estante** com capas, progresso de leitura e atalho para continuar de onde você parou.
- **Lê EPUB, PDF, MOBI, AZW3, FB2 e CBZ.**
- **Temas de leitura** papel, sépia e noite. O automático segue o tema claro ou escuro do sistema.
- **Ajustes de texto:** fonte (Literata, Atkinson ou a do livro), tamanho, espaço entre linhas, margens,
  leitura por páginas ou por rolagem e alinhamento.
- **Sumário, marcadores e destaques** em quatro cores, com notas.
- **Tudo fica no seu aparelho:** os livros e as anotações não vão para nenhum servidor.
- **Atualização automática:**
  - no macOS, a versão nova é baixada e instalada sozinha, e basta reiniciar o app;
  - no Android, o app avisa e baixa a versão nova, e você confirma a instalação;
  - no iPhone, as versões novas chegam pela fonte do MacReader no AltStore.

## Instalação

Baixe o instalador da sua plataforma na [última versão](https://github.com/marloon-dev/MacReader/releases/latest):

| Plataforma | Arquivo |
| --- | --- |
| macOS 11 ou mais novo (Intel e Apple Silicon) | `macreader-macos-universal-….dmg` |
| Android 8.0 ou mais novo | `macreader-android-….apk` |
| iPhone e iPad com iOS 15 ou mais novo | `macreader-ios-….ipa`, instalado pelo AltStore ou Sideloadly |

O passo a passo de cada plataforma está em **[docs/INSTALACAO.md](docs/INSTALACAO.md)**, que também
acompanha cada release.

## Desenvolvimento

Requer Node.js 20 ou mais novo.

```sh
npm install
npm run dev        # abre no navegador, em http://localhost:5173
npm run build      # gera a versão de produção em dist/
npm run lint
```

Para rodar como app nativo, você também precisa do [Rust](https://www.rust-lang.org/tools/install).
Para o Android, instale o Android Studio com o NDK, e para o iOS, o Xcode. Veja os
[pré-requisitos do Tauri](https://tauri.app/start/prerequisites/).

```sh
npm run tauri dev               # macOS
npm run tauri android dev       # Android (depois de "npm run tauri android init")
npm run tauri ios dev           # iPhone (depois de "npm run tauri ios init"; precisa do Xcode)
```

### Como publicar uma versão

1. Atualize `version` no `package.json` e escreva as novidades no `CHANGELOG.md`.
2. Faça o commit, crie a tag e envie:

   ```sh
   git tag -a v0.2.0 -m "MacReader v0.2.0"
   git push origin main --tags
   ```

3. O workflow **Release** compila macOS, Android e iPhone (pelo workflow **Build**, que também roda em
   todo PR), assina e publica a release com as instruções de instalação. Os apps instalados encontram
   a versão nova sozinhos.

O workflow precisa destes secrets no repositório: `TAURI_SIGNING_PRIVATE_KEY`,
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `ANDROID_KEYSTORE_BASE64` e `ANDROID_KEYSTORE_PASSWORD`.

## Como o projeto está organizado

| Pasta | Conteúdo |
| --- | --- |
| `src/components` | Telas: estante, leitor, painéis e aviso de atualização |
| `src/lib` | Banco local (IndexedDB), importação, preferências, estilos de leitura e atualizador |
| `public/foliate-js` | Motor de leitura de EPUB e PDF (biblioteca de terceiros, sem alterações) |
| `src-tauri` | App nativo (Tauri 2): configuração, ícones e permissões |
| `.github/workflows` | Build em todo PR e release automática |
| `docs` | Guia de instalação |

## Licença

O MacReader é software livre sob a [licença MIT](LICENSE). Você pode usar, modificar e
distribuir o código, inclusive em outros projetos, desde que mantenha o aviso de copyright.

## Bibliotecas de terceiros

Veja [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
