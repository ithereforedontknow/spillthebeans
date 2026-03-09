import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-6 text-center', className)}>
      {Icon && <Icon size={28} className="text-muted mb-4" strokeWidth={1.5} />}
      <h3 className="font-display text-xl text-head mb-2">{title}</h3>
      {description && <p className="text-sm text-dim max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}
