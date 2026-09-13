import { useEffect, useState } from 'react'

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform: string }
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

export default function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('boki2-install-hint-dismissed') === '1')

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const handler = (raw: Event) => {
      raw.preventDefault()
      setEvent(raw as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!event || dismissed) return null

  const install = async () => {
    await event.prompt()
    const result = await event.userChoice
    if (result.outcome === 'accepted') setEvent(null)
  }

  const close = () => {
    localStorage.setItem('boki2-install-hint-dismissed', '1')
    setDismissed(true)
  }

  return <aside className="install-prompt" aria-label="アプリとして追加">
    <div>
      <span>スマホ学習を速くする</span>
      <strong>ホーム画面に「工業簿記Lab」を追加できます</strong>
      <small>ブラウザのタブを探さず、アプリのように直接起動できます。</small>
    </div>
    <div className="install-actions">
      <button onClick={install}>ホーム画面に追加</button>
      <button className="install-close" onClick={close}>今はしない</button>
    </div>
  </aside>
}
