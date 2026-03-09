import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageSpinner } from '@/components/ui/Spinner'

export function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <PageSpinner />
  if (!user)    return <Navigate to="/login" state={{ from: loc }} replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
