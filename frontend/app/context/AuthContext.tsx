import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/axios'


// type definitions
interface Game {
    name: string
    skillLevel: string
}
// defining user interface 
interface User {
    id: string
    username: string
    email: string
    role: 'user' | 'admin'
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

// defining the interface of auth context (how does the context looks lookupService, it only has 4 values with their types)
interface AuthContextType {
    user: User | null
    loading: boolean
    login: (userData: User) => void
    logout: () => Promise<void>
}

// creating the auth context 
const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // this use effect calls /api/auth/me and stores the response data into user state 
    useEffect(() => {
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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

//  this hook lets us use authcontext variables easily 
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
} 