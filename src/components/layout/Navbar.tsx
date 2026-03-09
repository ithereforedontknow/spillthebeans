import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, User, Settings, LogOut, ShieldCheck, Map, Stamp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth()
  const [open, setOpen]   = useState(false)
  const [drop, setDrop]   = useState(false)

  const nav = [
    { to: '/spots', label: 'Browse' },
    { to: '/map',   label: 'Map', icon: Map },
    { to: '/passport', label: 'Passport', icon: Stamp },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-6 h-6 bg-amber rounded-sm flex items-center justify-center">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <rect x="3" y="2" width="6" height="12" rx="1" fill="#0c0b09"/>
              <rect x="10" y="5" width="3" height="1.5" rx="0.5" fill="#0c0b09"/>
              <path d="M10 6.5 Q13 7 13 9 Q13 10.5 11 10.5 L10 10.5" fill="none" stroke="#0c0b09" strokeWidth="1.2"/>
            </svg>
          </div>
          <span className="font-display text-base font-semibold text-head tracking-tight group-hover:text-amber transition-colors">
            NomadCafe
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors',
              isActive ? 'text-head bg-raised' : 'text-dim hover:text-body hover:bg-raised'
            )}>
              {Icon && <Icon size={13} />}{label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link to="/review/new" className="btn-primary btn-sm">+ Review</Link>
              <div className="relative">
                <button onClick={() => setDrop(p => !p)} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-card transition-colors">
                  <Avatar name={profile?.username ?? user.email} size="sm" imageUrl={profile?.avatar_url} />
                  <span className="text-sm text-body max-w-[100px] truncate">{profile?.username ?? 'Account'}</span>
                </button>
                {drop && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDrop(false)} />
                    <div className="absolute right-0 top-11 z-50 w-48 bg-card border border-border rounded-lg py-1 shadow-2xl animate-fade-in">
                      <DropItem to="/profile"  icon={User}       onClick={() => setDrop(false)}>Profile</DropItem>
                      <DropItem to="/passport" icon={Stamp}      onClick={() => setDrop(false)}>Passport</DropItem>
                      <DropItem to="/settings" icon={Settings}   onClick={() => setDrop(false)}>Settings</DropItem>
                      {isAdmin && <DropItem to="/admin" icon={ShieldCheck} onClick={() => setDrop(false)}>Admin</DropItem>}
                      <div className="divider my-1" />
                      <button onClick={() => { setDrop(false); logout() }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-950 transition-colors">
                        <LogOut size={14} />Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn-primary btn-sm">Sign in</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(p => !p)} className="md:hidden p-2 text-dim hover:text-body">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-raised animate-slide-down">
          <div className="px-4 py-3 space-y-0.5">
            {nav.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => cn('flex items-center px-3 py-2.5 rounded text-sm', isActive ? 'text-head bg-card' : 'text-dim')}>
                {label}
              </NavLink>
            ))}
            <div className="divider my-2" />
            {user ? (
              <>
                <NavLink to="/review/new" onClick={() => setOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-amber">+ Write Review</NavLink>
<NavLink to="/profile"   onClick={() => setOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-dim">Profile</NavLink>
                <NavLink to="/passport"  onClick={() => setOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-dim">Passport</NavLink>
                <NavLink to="/settings"  onClick={() => setOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-dim">Settings</NavLink>
                {isAdmin && <NavLink to="/admin" onClick={() => setOpen(false)} className="flex items-center px-3 py-2.5 text-sm text-dim">Admin</NavLink>}
                <button onClick={() => { setOpen(false); logout() }} className="w-full text-left px-3 py-2.5 text-sm text-red-400">Sign out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm text-amber">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function DropItem({ to, icon: Icon, onClick, children }: { to: string; icon: any; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-body hover:bg-raised hover:text-head transition-colors">
      <Icon size={14} className="text-dim" />{children}
    </Link>
  )
}
