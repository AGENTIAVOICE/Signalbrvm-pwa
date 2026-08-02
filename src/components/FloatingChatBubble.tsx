import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Sparkles, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sendChatMessage, type ChatMessage } from '../lib/api'

interface DisplayMessage extends ChatMessage {
  isError?: boolean
}

export default function FloatingChatBubble() {
  const { isPro } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  if (!isPro) return null

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const next: ChatMessage[] = [...messages.map(({ role, content }) => ({ role, content })), { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await sendChatMessage(next)
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }])
    } catch (err) {
      // On affiche le vrai message renvoyé par le backend (ex: clé Anthropic
      // manquante, erreur réseau...) plutôt que de le masquer — indispensable
      // pour comprendre pourquoi ça ne marche pas.
      console.error('Erreur assistant BRVM:', err)
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setMessages((m) => [...m, { role: 'assistant', content: message, isError: true }])
    }
    setLoading(false)
  }

  return (
    <>
      {open && (
        <div
          className="fixed z-50 flex flex-col"
          style={{
            bottom: 92,
            right: 16,
            left: 16,
            maxWidth: 380,
            marginLeft: 'auto',
            height: 460,
            backgroundColor: '#111118',
            border: '1px solid #2A2A3A',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #2A2A3A' }}>
            <Sparkles size={16} color="#F5C842" />
            <span className="text-white font-bold text-sm flex-1">Assistant BRVM</span>
            <button onClick={() => setOpen(false)} className="text-textSub">
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
            {messages.length === 0 && (
              <p className="text-textMuted text-xs text-center mt-6">
                Posez-moi une question sur la BRVM ou l'investissement 📈
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className="rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%] flex items-start gap-1.5"
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.isError ? '#200A0A' : m.role === 'user' ? '#F5C842' : '#1A1A24',
                  border: m.isError ? '1px solid #7F1D1D' : 'none',
                  color: m.isError ? '#EF4444' : m.role === 'user' ? '#0A0A0F' : '#FFFFFF',
                }}
              >
                {m.isError && <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />}
                <span>{m.content}</span>
              </div>
            ))}
            {loading && (
              <div className="rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: '#1A1A24', color: '#8A8A9A', alignSelf: 'flex-start' }}>
                …
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: '1px solid #2A2A3A' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Votre question…"
              className="flex-1 rounded-full px-4 py-2 text-white text-xs outline-none placeholder:text-textMuted"
              style={{ backgroundColor: '#1A1A24', border: '1px solid #2A2A3A' }}
            />
            <button
              onClick={send}
              className="flex items-center justify-center rounded-full"
              style={{ width: 34, height: 34, backgroundColor: '#F5C842' }}
            >
              <Send size={15} color="#0A0A0F" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed z-40 flex items-center justify-center rounded-full shadow-lg"
        style={{ bottom: 92, right: 16, width: 52, height: 52, backgroundColor: '#F5C842' }}
        aria-label="Assistant BRVM"
      >
        {open ? <X size={22} color="#0A0A0F" /> : <MessageCircle size={22} color="#0A0A0F" />}
      </button>
    </>
  )
}
