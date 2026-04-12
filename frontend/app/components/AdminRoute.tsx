import { Navigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

const AdminRoute = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth()

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-lg">Loading...</p>
        </div>
    )

    return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />
}

export default AdminRoute