import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Permission, Role, User } from '../domain'
import { ROLE_HOME, ROLE_PERMISSIONS } from '../domain'
import { authService } from '../services/api'

const LOCAL_KEY = 'shb-rag-auth'; const SESSION_KEY = 'shb-rag-session'
type SessionUser = Omit<User, 'password'>
interface AuthValue { user: SessionUser | null; login: (username: string, password: string, remember: boolean) => Promise<SessionUser>; logout: () => void; changePassword: (current: string, next: string) => Promise<void>; can: (permission: Permission) => boolean; home: string }
const AuthContext = createContext<AuthValue | null>(null)

function readSession(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || sessionStorage.getItem(SESSION_KEY) || 'null') as SessionUser | null } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession)
  const value = useMemo<AuthValue>(() => ({
    user,
    async login(username, password, remember) { const result = await authService.login(username, password); authService.persist(result, remember); const next = result.user; localStorage.removeItem(LOCAL_KEY); sessionStorage.removeItem(SESSION_KEY); (remember ? localStorage : sessionStorage).setItem(remember ? LOCAL_KEY : SESSION_KEY, JSON.stringify(next)); setUser(next); return next },
    logout() { void authService.logout(); localStorage.removeItem(LOCAL_KEY); sessionStorage.removeItem(SESSION_KEY); setUser(null) },
    async changePassword(current, next) {
      await authService.changePassword(current, next)
      setUser(previous => {
        if (!previous) return previous
        const updated = { ...previous, mustChangePassword: false }
        const storage = localStorage.getItem(LOCAL_KEY) ? localStorage : sessionStorage
        storage.setItem(storage === localStorage ? LOCAL_KEY : SESSION_KEY, JSON.stringify(updated))
        return updated
      })
    },
    can(permission) { return !!user && ROLE_PERMISSIONS[user.role].includes(permission) },
    home: user ? ROLE_HOME[user.role] : '/login',
  }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value }
export function isRole(value: string): value is Role { return ['customer', 'bank_employee', 'knowledge_manager', 'system_admin'].includes(value) }
