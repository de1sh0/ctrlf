import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('paisa_token')
  const user  = localStorage.getItem('paisa_user')

  if (!token && !user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}