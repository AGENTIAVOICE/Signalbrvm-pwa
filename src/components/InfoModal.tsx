import { X } from 'lucide-react'

export function InfoModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl" style={{ backgroundColor: '#111118', border: '1px solid #2A2A3A' }}>
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ backgroundColor: '#111118', borderBottom: '1px solid #1E1E2A' }}
        >
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-textSub">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
