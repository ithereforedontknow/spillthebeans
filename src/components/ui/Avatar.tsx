import { cn, getInitials } from '@/lib/utils'

const sizes = { xs: 'w-6 h-6 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-sm', xl: 'w-20 h-20 text-lg' }
const colors = ['bg-amber-dim text-amber', 'bg-raised text-body', 'bg-muted text-dim']

interface AvatarProps {
  name?: string | null
  imageUrl?: string | null
  size?: keyof typeof sizes
  className?: string
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const colorClass = colors[(name?.charCodeAt(0) ?? 0) % colors.length]
  if (imageUrl) return <img src={imageUrl} alt={name ?? ''} className={cn('rounded-full object-cover shrink-0', sizes[size], className)} />
  return (
    <div className={cn('rounded-full flex items-center justify-center shrink-0 font-mono font-semibold', sizes[size], colorClass, className)}>
      {getInitials(name)}
    </div>
  )
}
