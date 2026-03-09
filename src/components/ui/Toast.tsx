import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Toast { id: string; msg: string; type: 'ok' | 'err' }
interface ToastCtx { toast: (msg: string, type?: 'ok' | 'err') => void }

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3800)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div key={t.id} className={cn(
            'flex items-start gap-3 px-4 py-3 rounded border animate-fade-up pointer-events-auto',
            t.type === 'ok' ? 'bg-card border-border text-body' : 'bg-red-950 border-red-800 text-red-200'
          )}>
            {t.type === 'ok'
              ? <CheckCircle size={15} className="text-amber mt-0.5 shrink-0" />
              : <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            }
            <p className="text-sm flex-1 font-sans">{t.msg}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-dim hover:text-body">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be inside ToastProvider')
  return c.toast
}
