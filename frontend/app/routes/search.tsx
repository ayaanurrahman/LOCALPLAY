import { useState } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const GAMES = ['chess', 'carrom', 'badminton', 'table tennis', 'cards', 'cricket', 'football']
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced']
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night']

interface Player {
    _id: string
    username: string
    email: string
    bio?: string
    games: { name: string; skillLevel: string }[]
    availability?: { days: string[]; timeSlot: string }
    preferredLocation?: string
    location?: { address: string; coordinates: number[] }
}

export default function Search() {
    return (
        <ProtectedRoute>
            <SearchContent />
        </ProtectedRoute>
    )
}

function SearchContent() {
    const { user } = useAuth()

    const [filters, setFilters] = useState({
        game: '',
        skillLevel: '',
        day: '',
        timeSlot: '',
        maxDistance: 5000
    })
    const [players, setPlayers] = useState<Player[]>([])
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [requestSent, setRequestSent] = useState<string[]>([]) // track sent requests by playerId
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // send play request inline from search results
    const [requestModal, setRequestModal] = useState<Player | null>(null)
    const [requestForm, setRequestForm] = useState({
        location: '',
        proposedTime: '',
        message: ''
    })
    const [requestLoading, setRequestLoading] = useState(false)
    const [requestError, setRequestError] = useState('')

    const handleSearch = async (overridePage?: number) => {
        const coords = user?.location?.coordinates
        if (!coords || coords.length < 2) {
            setError('Please set your location in your profile first')
            return
        }

        setLoading(true)
        setError('')

        try {
            const params: any = {
                lat: coords[1],
                lng: coords[0],
                maxDistance: filters.maxDistance,
                page: overridePage ?? page
            }
            if (filters.game) params.game = filters.game
            if (filters.skillLevel) params.skillLevel = filters.skillLevel
            if (filters.day) params.day = filters.day
            if (filters.timeSlot) params.timeSlot = filters.timeSlot

            const res = await api.get('/users/search', { params })
            setPlayers(res.data.players)
            setTotalPages(res.data.totalPages)
            setSearched(true)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Search failed')
        } finally {
            setLoading(false)
        }
    }

    const handleSendRequest = async () => {
        if (!requestModal) return
        if (!requestForm.location || !requestForm.proposedTime) {
            setRequestError('Location and proposed time are required')
            return
        }

        setRequestLoading(true)
        setRequestError('')

        try {
            await api.post('/requests/send', {
                receiverId: requestModal._id,
                game: filters.game || requestModal.games[0]?.name,
                location: requestForm.location,
                proposedTime: requestForm.proposedTime,
                message: requestForm.message
            })
            setRequestSent(prev => [...prev, requestModal._id])
            setRequestModal(null)
            setRequestForm({ location: '', proposedTime: '', message: '' })
        } catch (err: any) {
            setRequestError(err.response?.data?.message || 'Failed to send request')
        } finally {
            setRequestLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Find Players</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Search for game partners near you
                </p>
            </div>

            {/* filters */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Game
                        </label>
                        <select
                            value={filters.game}
                            onChange={e => setFilters(prev => ({ ...prev, game: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Any game</option>
                            {GAMES.map(g => (
                                <option key={g} value={g} className="capitalize">{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Skill level
                        </label>
                        <select
                            value={filters.skillLevel}
                            onChange={e => setFilters(prev => ({ ...prev, skillLevel: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Any level</option>
                            {SKILL_LEVELS.map(l => (
                                <option key={l} value={l} className="capitalize">{l}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Day
                        </label>
                        <select
                            value={filters.day}
                            onChange={e => setFilters(prev => ({ ...prev, day: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Any day</option>
                            {DAYS.map(d => (
                                <option key={d} value={d} className="capitalize">{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Time slot
                        </label>
                        <select
                            value={filters.timeSlot}
                            onChange={e => setFilters(prev => ({ ...prev, timeSlot: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Any time</option>
                            {TIME_SLOTS.map(t => (
                                <option key={t} value={t} className="capitalize">{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Max distance: {filters.maxDistance / 1000}km
                    </label>
                    <input
                        type="range"
                        min={1000}
                        max={50000}
                        step={1000}
                        value={filters.maxDistance}
                        onChange={e => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 
                   hover:accent-green-700 transition-all
                   [&::-webkit-slider-thumb]:w-5 
                   [&::-webkit-slider-thumb]:h-5 
                   [&::-webkit-slider-thumb]:appearance-none 
                   [&::-webkit-slider-thumb]:bg-white 
                   [&::-webkit-slider-thumb]:border-2 
                   [&::-webkit-slider-thumb]:border-green-600 
                   [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:shadow-md
                   [&::-webkit-slider-thumb]:transition-transform
                   [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>1km</span>
                        <span>50km</span>
                    </div>
                </div>

                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    onClick={() => { setPage(1); handleSearch(1) }}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg transition text-sm"
                >
                    {loading ? 'Searching...' : 'Search Players'}
                </button>
            </div>

            {/* results */}
            {searched && (
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        {players.length} player{players.length !== 1 ? 's' : ''} found
                    </p>

                    {players.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-lg">No players found nearby</p>
                            <p className="text-sm mt-1">Try increasing the distance or changing filters</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {players.map(player => (
                                <div
                                    key={player._id}
                                    className="bg-white border border-gray-200 rounded-2xl p-5"
                                >
                                    <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {player.username}
                                                </p>
                                                {(player as any).avgRating > 0 && (
                                                    <span className="text-xs text-yellow-600">
                                                        ⭐ {(player as any).avgRating.toFixed(1)}
                                                    </span>
                                                )}
                                                {player.location?.address && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        📍 {player.location.address.split(',').slice(0, 2).join(',')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {requestSent.includes(player._id) ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                                                Request sent
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setRequestModal(player)}
                                                className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition font-medium"
                                            >
                                                Send Request
                                            </button>
                                        )}
                                    </div>

                                    {player.bio && (
                                        <p className="text-sm text-gray-600 mt-3">{player.bio}</p>
                                    )}

                                    {/* games */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {player.games.map(g => (
                                            <span
                                                key={g.name}
                                                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize"
                                            >
                                                {g.name} · {g.skillLevel}
                                            </span>
                                        ))}
                                    </div>

                                    {/* availability */}
                                    {player.availability && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {player.availability.days.map(d => (
                                                <span
                                                    key={d}
                                                    className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full capitalize"
                                                >
                                                    {d.slice(0, 3)}
                                                </span>
                                            ))}
                                            {player.availability.timeSlot && (
                                                <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full capitalize">
                                                    {player.availability.timeSlot}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button
                                onClick={() => { const p = page - 1; setPage(p); handleSearch(p) }}
                                disabled={page === 1 || loading}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => { const p = page + 1; setPage(p); handleSearch(p) }}
                                disabled={page === totalPages || loading}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* send request modal */}
            {requestModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl my-auto">
                        <h2 className="font-bold text-gray-900 text-lg mb-1">
                            Send Play Request
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            To <span className="font-medium text-gray-700">{requestModal.username}</span>
                        </p>

                        {requestError && (
                            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                                {requestError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <select
                                    value={requestForm.location}
                                    onChange={e => setRequestForm(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="">Select location</option>
                                    {['home', 'society clubhouse', 'local ground'].map(l => (
                                        <option key={l} value={l} className="capitalize">{l}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proposed time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={requestForm.proposedTime}
                                    onChange={e => setRequestForm(prev => ({ ...prev, proposedTime: e.target.value }))}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message <span className="text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    value={requestForm.message}
                                    onChange={e => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                                    rows={2}
                                    maxLength={300}
                                    placeholder="Up for a game this evening?"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button
                                onClick={() => {
                                    setRequestModal(null)
                                    setRequestError('')
                                    setRequestForm({ location: '', proposedTime: '', message: '' })
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendRequest}
                                disabled={requestLoading}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition"
                            >
                                {requestLoading ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}