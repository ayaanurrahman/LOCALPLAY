import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const GAMES = ['chess', 'carrom', 'badminton', 'table tennis', 'cards', 'cricket', 'football']
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced']

interface GameEntry {
    name: string
    skillLevel: string
}

export default function Register() {
    const { login , user} = useAuth()
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    })
    const [games, setGames] = useState<GameEntry[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    // toggle a game on/off
    const toggleGame = (gameName: string) => {
        setGames(prev => {
            const exists = prev.find(g => g.name === gameName)
            if (exists) {
                // remove it
                return prev.filter(g => g.name !== gameName)
            } else {
                // add with default skill level
                return [...prev, { name: gameName, skillLevel: 'beginner' }]
            }
        })
    }

    // update skill level for a selected game
    const updateSkillLevel = (gameName: string, skillLevel: string) => {
        setGames(prev =>
            prev.map(g => g.name === gameName ? { ...g, skillLevel } : g)
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (games.length === 0) {
            setError('Please select at least one game')
            setLoading(false)
            return
        }

        try {
            const res = await api.post('/auth/register', formData)
            login(res.data.user)

            // update profile with selected games right after register
            if (games.length > 0) {
                await api.put('/users/profile', { games })
            }

            navigate('/profile') // go to profile to complete setup
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }
    if (user) return <Navigate to="/profile" replace />


    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">

                {/* header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                    <p className="text-gray-500 text-sm mt-1">Find game partners near you</p>
                </div>

                {/* error */}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="your username"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 chars, uppercase, lowercase, number"
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* game selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Games you play
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {GAMES.map(game => {
                                const selected = games.find(g => g.name === game)
                                return (
                                    <button
                                        key={game}
                                        type="button"
                                        onClick={() => toggleGame(game)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                                            selected
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                        }`}
                                    >
                                        {game}
                                    </button>
                                )
                            })}
                        </div>

                        {/* skill level selectors for selected games */}
                        {games.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {games.map(g => (
                                    <div key={g.name} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-700 capitalize w-24 shrink-0">
                                            {g.name}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {SKILL_LEVELS.map(level => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => updateSkillLevel(g.name, level)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition capitalize ${
                                                        g.skillLevel === level
                                                            ? 'bg-green-100 text-green-700 border-green-400'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition text-sm"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-600 font-medium hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    )
}