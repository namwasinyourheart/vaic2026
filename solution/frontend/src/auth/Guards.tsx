import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Permission, Role } from '../domain'
import { ROLE_HOME } from '../domain'
import { useAuth } from './AuthContext'

export function RouteGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth(); const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />
  return children
}

export function PermissionGuard({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  return useAuth().can(permission) ? children : fallback
}

export function HomeRedirect() { const { user } = useAuth(); return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace /> }
