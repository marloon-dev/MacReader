import { useEffect, useState } from 'react'
import { checkForUpdate, openDownload, restartApp, type UpdateState } from '../lib/updater'
import { Icon } from './Icon'

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true
    checkForUpdate().then((state) => {
      if (active) setUpdate(state)
    })
    return () => {
      active = false
    }
  }, [])

  if (!update || dismissed) return null

  return (
    <div className="update-banner" role="status">
      {update.kind === 'reiniciar' ? (
        <>
          <span>A versão {update.version} do MacReader foi instalada. Reinicie para usar.</span>
          <button className="button button-primary" onClick={restartApp}>
            Reiniciar agora
          </button>
        </>
      ) : (
        <>
          <span>A versão {update.version} do MacReader está disponível.</span>
          <button className="button button-primary" onClick={() => openDownload(update.url)}>
            Baixar e instalar
          </button>
        </>
      )}
      <button className="icon-button" onClick={() => setDismissed(true)} aria-label="Depois">
        <Icon name="fechar" size={18} />
      </button>
    </div>
  )
}
