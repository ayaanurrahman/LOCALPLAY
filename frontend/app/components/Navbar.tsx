import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
        setMenuOpen(false)
    }

    return (
        <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <Link to="/" className="text-xl font-bold text-green-600">
                    LOCALPLAY
                </Link>

                {/* Desktop nav */}
                <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
                    {user ? (
                        <>
                            <Link to="/search" className="hover:text-green-600 transition">
                                Find Players
                            </Link>
                            <Link to="/requests" className="hover:text-green-600 transition">
                                Requests
                            </Link>
                            <Link to="/profile" className="hover:text-green-600 transition">
                                Profile
                            </Link>
                            {user.role === 'admin' && (
                                <Link to="/admin" className="hover:text-red-600 transition">
                                    Admin
                                </Link>
                            )}
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
                <button
                    className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
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

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="sm:hidden mt-3 border-t border-gray-100 pt-3 flex flex-col gap-1 text-sm font-medium text-gray-600">
                    {user ? (
                        <>
                            <Link
                                to="/search"
                                onClick={() => setMenuOpen(false)}
                                className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition"
                            >
                                Find Players
                            </Link>
                            <Link
                                to="/requests"
                                onClick={() => setMenuOpen(false)}
                                className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition"
                            >
                                Requests
                            </Link>
                            <Link
                                to="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition"
                            >
                                Profile
                            </Link>
                            {user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    onClick={() => setMenuOpen(false)}
                                    className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-red-600 transition"
                                >
                                    Admin
                                </Link>
                            )}
                            <div className="px-4 pt-2 pb-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                onClick={() => setMenuOpen(false)}
                                className="px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-green-600 transition"
                            >
                                Login
                            </Link>
                            <div className="px-4 pt-2 pb-1">
                                <Link
                                    to="/register"
                                    onClick={() => setMenuOpen(false)}
                                    className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                                >
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
