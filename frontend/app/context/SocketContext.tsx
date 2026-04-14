import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import api from '../api/axios'
import { useAuth } from './AuthContext'

interface Notification {
    _id: string
    type: string
    message: string
    isRead: boolean
    createdAt: string
    relatedRequest?: string
}

interface SocketContextType {
    notifications: Notification[]
    unreadCount: number
    markAllRead: () => void
    markOneRead: (id: string) => void
    clearNotifications: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAuth()
    const socketRef = useRef<Socket | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (loading) return // wait for auth to finish
        if (!user) {
            // user logged out — disconnect socket and clear state
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
            }
            setNotifications([])
            setUnreadCount(0)
            return
        }

        // connect to backend socket server
        const socket = io('https://localplay-backend.onrender.com', {
            withCredentials: true
        })
        socketRef.current = socket

        // join the user's personal room so backend can target them
        socket.on('connect', () => {
            const userId = (user as any)._id || user.id
            socket.emit('join', userId)
            console.log('Joining room with userId:', userId)  // add this to confirm
        })
                // listen for incoming notifications
        socket.on('notification', (notif: Notification) => {
            setNotifications(prev => [notif, ...prev])
            setUnreadCount(prev => prev + 1)
        })

        // fetch existing notifications from DB on connect
        api.get('/notifications').then(res => {
            setNotifications(res.data.notifications)
            setUnreadCount(res.data.unreadCount)
        }).catch(() => {})

        return () => {
            socket.disconnect()
        }
    }, [(user as any)?._id || user?.id, loading])

        const markAllRead = () => {
            api.put('/notifications/read-all').catch(() => {})
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        }

        const markOneRead = (id: string) => {
            api.put(`/notifications/${id}/read`).catch(() => {})
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        }

    const clearNotifications = () => {
        setNotifications([])
        setUnreadCount(0)
    }

    return (
        <SocketContext.Provider value={{ notifications, unreadCount, markAllRead, markOneRead, clearNotifications }}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSocket must be used within SocketProvider')
    return context
}
