import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { fetchProfile, upsertProfile } from '@/lib/supabase/queries'
import type { DbProfile, ProfileFormData } from '@/types'

// Stored outside React so logout() can navigate from any page
let _nav: ((to: string) => void) | null = null
export function registerNavigate(fn: (to: string) => void) { _nav = fn }

export const PROFILE_KEY = (uid: string) => ['profile', uid] as const

interface Ctx {
  user: User | null
  session: Session | null
  profile: DbProfile | null
  loading: boolean
  isAdmin: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (d: Partial<ProfileFormData>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null)
  const [session,     setSession]     = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const qc = useQueryClient()

  // TanStack Query owns the profile fetch — automatic caching + background refetch
  const {
    data: profile = null,
    isLoading: profileLoading,
  } = useQuery({
    queryKey: user ? PROFILE_KEY(user.id) : ['profile', 'none'],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (!s?.user) {
        // Clear cached profile when logged out
        qc.removeQueries({ queryKey: ['profile'] })
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Sync Google avatar on every sign-in so it stays fresh
        const meta = s.user.user_metadata ?? {}
        const latestAvatar = meta.avatar_url ?? meta.picture ?? null
        if (latestAvatar) {
          upsertProfile(s.user.id, { avatar_url: latestAvatar }).catch(() => {})
        }
      }
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [qc])

  const loginWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    }).then(() => {})

  const logout = async () => {
    // Clear local state immediately so UI responds at once
    setUser(null)
    setSession(null)
    setAuthLoading(false)
    qc.removeQueries({ queryKey: ['profile'] })
    // Sign out from Supabase (fire-and-forget)
    supabase.auth.signOut().catch(() => {})
    if (_nav) _nav('/')
    else window.location.replace('/')
  }

  const updateProfile = async (d: Partial<ProfileFormData>) => {
    if (!user) throw new Error('Not signed in')
    const updated = await upsertProfile(user.id, d)
    // Push updated data directly into the query cache
    qc.setQueryData(PROFILE_KEY(user.id), updated)
  }

  const refreshProfile = async () => {
    if (user) await qc.invalidateQueries({ queryKey: PROFILE_KEY(user.id) })
  }

  // loading = true only while we don't yet know if there's a session,
  //           or while we're fetching the profile for a known user
  const loading = authLoading || (!!user && profileLoading)

  return (
    <AuthCtx.Provider value={{
      user, session, profile,
      loading,
      isAdmin: profile?.is_admin ?? false,
      loginWithGoogle, logout, updateProfile, refreshProfile,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth must be inside AuthProvider')
  return c
}
