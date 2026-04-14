import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/axios'

interface Game {
    name: string
    skillLevel: string
}

interface User {
    id: string
    username: string
    email: string
    role: 'user' | 'admin'
    isVerified: boolean
    games?: Game[]
    bio?: string
    availability?: {
        days: string[]
        timeSlot: string
    }
    preferredLocation?: string
    location?: {
        type: string
        coordinates: number[]
        address: string
    }
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (userData: User) => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me')
            setUser(res.data)
        } catch {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    const login = (userData: User) => setUser(userData)

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } finally {
            setUser(null)
        }
    }

    // call this after email verification to sync isVerified state
    const refreshUser = async () => {
        await fetchUser()
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
