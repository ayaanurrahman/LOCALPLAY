import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth()

    // if loading show this. Loading happens when /api/auth/me or /login or /register is called  
    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-lg">Loading...</p>
        </div>
    )

    // if user logged in return the pages for user that were restricted before login to the user, if not navigate them back to /login 
    return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default ProtectedRoute