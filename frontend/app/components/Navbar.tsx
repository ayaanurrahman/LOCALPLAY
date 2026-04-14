import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const Navbar = () => {
    const { user, logout } = useAuth()
    const { notifications, unreadCount, markAllRead, markOneRead } = useSocket()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [bellOpen, setBellOpen] = useState(false)
    const bellRef = useRef<HTMLDivElement>(null)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
        setMenuOpen(false)
    }

    const handleBellOpen = () => {
        setBellOpen(prev => !prev)
        if (!bellOpen && unreadCount > 0) {
            markAllRead()
        }
    }

    const typeIcon: Record<string, string> = {
        request_received: '🎮',
        request_accepted: '✅',
        request_declined: '❌',
        request_cancelled: '↩️'
    }

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        return `${Math.floor(hrs / 24)}d ago`
    }

    const BellIcon = () => (
        <div ref={bellRef} className="relative">
            <button
                onClick={handleBellOpen}
                className="relative p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* dropdown */}
            {bellOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Notifications</span>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    onClick={() => markOneRead(n._id)}
                                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${
                                        !n.isRead ? 'bg-green-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className="text-base mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-gray-100 display flex items-center justify-between">
                            <Link
                                to="/requests"
                                onClick={() => setBellOpen(false)}
                                className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                                View all requests →
                            </Link>
                            <div>
                                <button
                                    onClick={() => setBellOpen(false)}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    return (
        <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-green-600">
                    LOCALPLAY
                </Link>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-5 text-sm font-medium text-gray-600">
                    {user ? (
                        <>
                            <Link to="/search" className="hover:text-green-600 transition">
                                Find Players
                            </Link>
                            <Link to="/requests" className="hover:text-green-600 transition">
                                Requests
                            </Link>
                            <Link to="/profile" className="hover:text-green-600 transition flex items-center gap-1">
                                Profile
                                {!user.isVerified && (
                                    <span className="w-2 h-2 rounded-full bg-yellow-400" title="Email not verified" />
                                )}
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="hover:text-red-600 transition">
                                    Admin
                                </Link>
                            )}
                            <BellIcon />
                            <button
                                onClick={handleLogout}
                                className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-green-600 transition">
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <div className="sm:hidden flex items-center gap-2">
                    {user && <BellIcon />}
                    <button
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        onClick={() => setMenuOpen(prev => !prev)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="sm:hidden mt-3 border-t border-gray-100 pt-3 flex flex-col gap-1 text-sm font-medium text-gray-600">
                    {user ? (
                        <>
                            <Link to="/search" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition">
                                Find Players
                            </Link>
                            <Link to="/requests" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition">
                                Requests
                            </Link>
                            <Link to="/profile" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition">
                                Profile
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-red-600 transition">
                                    Admin
                                </Link>
                            )}
                            <div className="px-4 pt-2 pb-1">
                                <button onClick={handleLogout} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition">
                                Login
                            </Link>
                            <div className="px-4 pt-2 pb-1">
                                <Link to="/register" onClick={() => setMenuOpen(false)} className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                                    Register
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}

export default Navbar
