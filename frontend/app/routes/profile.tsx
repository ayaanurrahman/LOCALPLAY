import { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const GAMES = ['chess', 'carrom', 'badminton', 'table tennis', 'cards', 'cricket', 'football']
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced']
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night']
const LOCATIONS = ['home', 'society clubhouse', 'local ground']

interface GameEntry {
    name: string
    skillLevel: string
}

export default function Profile() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    )
}

function ProfileContent() {
    const { user, login } = useAuth()

    const [games, setGames] = useState<GameEntry[]>([])
    const [days, setDays] = useState<string[]>([])
    const [timeSlot, setTimeSlot] = useState('')
    const [preferredLocation, setPreferredLocation] = useState('')
    const [bio, setBio] = useState('')
    const [address, setAddress] = useState('')
    const [coordinates, setCoordinates] = useState<number[]>([])
    const [locating, setLocating] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [resendMsg, setResendMsg] = useState('')

    const handleResendVerification = async () => {
        setResendLoading(true)
        setResendMsg('')
        try {
            const res = await api.post('/auth/resend-verify')
            setResendMsg(res.data.message)
        } catch (err: any) {
            setResendMsg(err.response?.data?.message || 'Failed to resend. Try again.')
        } finally {
            setResendLoading(false)
        }
    }

    // fetch fresh profile from API on mount so we always have latest data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile')
                const freshUser = res.data.user
                login(freshUser) // sync context with latest DB data
                setGames(freshUser.games || [])
                setDays(freshUser.availability?.days || [])
                setTimeSlot(freshUser.availability?.timeSlot || '')
                setPreferredLocation(freshUser.preferredLocation || '')
                setBio(freshUser.bio || '')
                setAddress(freshUser.location?.address || '')
                setCoordinates(freshUser.location?.coordinates || [])
            } catch {
                // fallback to context data if API call fails
                if (user) {
                    setGames(user.games || [])
                    setDays(user.availability?.days || [])
                    setTimeSlot(user.availability?.timeSlot || '')
                    setPreferredLocation(user.preferredLocation || '')
                    setBio(user.bio || '')
                    setAddress(user.location?.address || '')
                    setCoordinates(user.location?.coordinates || [])
                }
            }
        }
        fetchProfile()
    }, []) // empty deps — runs once on mount, always gets fresh data

    // --- game selection ---
    const toggleGame = (gameName: string) => {
        setGames(prev => {
            const exists = prev.find(g => g.name === gameName)
            if (exists) return prev.filter(g => g.name !== gameName)
            return [...prev, { name: gameName, skillLevel: 'beginner' }]
        })
    }

    const updateSkillLevel = (gameName: string, skillLevel: string) => {
        setGames(prev =>
            prev.map(g => g.name === gameName ? { ...g, skillLevel } : g)
        )
    }

    // --- day selection ---
    const toggleDay = (day: string) => {
        setDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    // --- location via browser geolocation + Nominatim reverse geocode ---
    const detectLocation = () => {
        setLocating(true)
        setError('')

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords
                setCoordinates([longitude, latitude]) // lng first — MongoDB convention

                try {
                    // reverse geocode to get human readable address
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    )
                    const data = await res.json()
                    setAddress(data.display_name || `${latitude}, ${longitude}`)
                } catch {
                    setAddress(`${latitude}, ${longitude}`)
                } finally {
                    setLocating(false)
                }
            },
            () => {
                setError('Could not detect location. Please allow location access.')
                setLocating(false)
            }
        )
    }

    // --- save profile ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (games.length === 0) {
            setError('Please select at least one game')
            setLoading(false)
            return
        }

        try {
            const payload: any = {
                games,
                availability: { days, timeSlot },
                preferredLocation,
                bio
            }

            // only include location if coordinates are set
            if (coordinates.length === 2) {
                payload.location = {
                    type: 'Point',
                    coordinates,
                    address
                }
            }

            const res = await api.put('/users/profile', payload)

            // update context so navbar and other components reflect changes
            login(res.data.user)
            setSuccess('Profile updated successfully')

        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
            {/* header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Complete your profile to find the best partners near you
                </p>
            </div>

            {/* unverified email banner */}
            {user && !user.isVerified && (
                <div className="mb-5 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">Your email is not verified</p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                            Verify your email to send play requests to other players.
                        </p>
                        {resendMsg && <p className="text-xs text-yellow-900 mt-1 font-medium">{resendMsg}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        className="text-xs font-medium px-3 py-1.5 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50 whitespace-nowrap"
                    >
                        {resendLoading ? 'Sending...' : 'Resend email'}
                    </button>
                </div>
            )}

            {/* user info card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-gray-900">{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    {(user as any)?.avgRating > 0 && (
                        <p className="text-xs text-yellow-600 font-medium mt-0.5">
                            {'⭐'.repeat(Math.round((user as any).avgRating))} {(user as any).avgRating.toFixed(1)} · {(user as any).matchesPlayed} match{(user as any).matchesPlayed !== 1 ? 'es' : ''}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            user?.role === 'admin'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}>
                            {user?.role}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            user?.isVerified
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-yellow-50 text-yellow-700'
                        }`}>
                            {user?.isVerified ? '✓ verified' : 'unverified'}
                        </span>
                    </div>
                </div>
            </div>

            {/* success / error */}
            {success && (
                <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* games */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">Games you play</h2>
                    <div className="flex flex-wrap gap-2 mb-3">
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

                    {/* skill levels for selected games */}
                    {games.length > 0 && (
                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                            {games.map(g => (
                                <div key={g.name} className="flex flex-wrap items-center gap-2">
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

                {/* availability */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">Availability</h2>

                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                        Days
                    </p>
                    <div className="flex flex-wrap gap-2 mb-5">
                        {DAYS.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                                    days.includes(day)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                }`}
                            >
                                {day.slice(0, 3)}
                            </button>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                        Time slot
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {TIME_SLOTS.map(slot => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => setTimeSlot(slot)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                                    timeSlot === slot
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                }`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                </div>

                {/* preferred location */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-gray-900 mb-4">Preferred playing location</h2>
                    <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map(loc => (
                            <button
                                key={loc}
                                type="button"
                                onClick={() => setPreferredLocation(loc)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                                    preferredLocation === loc
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                }`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                </div>

                {/* location */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-gray-900 mb-1">Your location</h2>
                    <p className="text-xs text-gray-500 mb-4">
                        Used to find nearby players — never shown publicly in exact form
                    </p>

                    <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locating}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition disabled:opacity-50"
                    >
                        {locating ? 'Detecting...' : '📍 Detect my location'}
                    </button>

                    {address && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                            {address}
                        </p>
                    )}
                </div>

                {/* bio */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <h2 className="font-semibold text-gray-900 mb-1">Bio</h2>
                    <p className="text-xs text-gray-500 mb-3">
                        Tell others a bit about yourself (max 200 characters)
                    </p>
                    <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder="e.g. Chess enthusiast from Dwarka, looking for weekend games..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                        {bio.length}/200
                    </p>
                </div>

                {/* submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition"
                >
                    {loading ? 'Saving...' : 'Save Profile'}
                </button>

            </form>
        </div>
    )
}