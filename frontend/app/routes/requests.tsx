import { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

type Status = 'pending' | 'accepted' | 'declined' | 'cancelled'

interface PlayRequest {
    _id: string
    game: string
    location: string
    proposedTime: string
    status: Status
    message?: string
    sender: { _id: string; username: string; email: string }
    receiver: { _id: string; username: string; email: string }
    createdAt: string
}

const STATUS_STYLES: Record<Status, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500'
}

export default function Requests() {
    return (
        <ProtectedRoute>
            <RequestsContent />
        </ProtectedRoute>
    )
}

function RequestsContent() {
    // ALL hooks must be here at the top, inside the component
    const { user } = useAuth()
    const [tab, setTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming')
    const [data, setData] = useState<PlayRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [ratingModal, setRatingModal] = useState<PlayRequest | null>(null)
    const [stars, setStars] = useState(0)
    const [comment, setComment] = useState('')
    const [ratingLoading, setRatingLoading] = useState(false)
    const [ratingError, setRatingError] = useState('')
    const [ratedMatches, setRatedMatches] = useState<string[]>([])

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            const endpoint =
                tab === 'incoming' ? '/requests/incoming'
                : tab === 'outgoing' ? '/requests/outgoing'
                : '/requests/history'

            const res = await api.get(endpoint)
            setData(tab === 'history' ? res.data.history : res.data.requests)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [tab])

    const handleRespond = async (id: string, status: 'accepted' | 'declined') => {
        try {
            await api.put(`/requests/${id}/respond`, { status })
            fetchData()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to respond')
        }
    }

    const handleCancel = async (id: string) => {
        try {
            await api.put(`/requests/${id}/cancel`)
            fetchData()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel')
        }
    }

    const handleRate = async () => {
        if (!ratingModal || stars === 0) {
            setRatingError('Please select a star rating')
            return
        }
        setRatingLoading(true)
        setRatingError('')
        try {
            await api.post('/ratings', {
                playRequestId: ratingModal._id,
                stars,
                comment
            })
            setRatedMatches(prev => [...prev, ratingModal._id])
            setRatingModal(null)
            setStars(0)
            setComment('')
        } catch (err: any) {
            setRatingError(err.response?.data?.message || 'Failed to submit rating')
        } finally {
            setRatingLoading(false)
        }
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Play Requests</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your incoming and outgoing requests</p>
            </div>

            {/* tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit max-w-full overflow-x-auto">
                {(['incoming', 'outgoing', 'history'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                            tab === t
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg">No {tab} requests</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.map(req => (
                        <div
                            key={req._id}
                            className="bg-white border border-gray-200 rounded-2xl p-5"
                        >
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                    {tab === 'incoming' ? (
                                        <p className="text-sm text-gray-500">
                                            From{' '}
                                            <span className="font-semibold text-gray-900">
                                                {req.sender.username}
                                            </span>
                                        </p>
                                    ) : tab === 'outgoing' ? (
                                        <p className="text-sm text-gray-500">
                                            To{' '}
                                            <span className="font-semibold text-gray-900">
                                                {req.receiver.username}
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            <span className="font-semibold text-gray-900">
                                                {req.sender.username}
                                            </span>
                                            {' vs '}
                                            <span className="font-semibold text-gray-900">
                                                {req.receiver.username}
                                            </span>
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatTime(req.createdAt)}
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_STYLES[req.status]}`}>
                                    {req.status}
                                </span>
                            </div>

                            {/* details */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                                    🎮 {req.game}
                                </span>
                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                                    📍 {req.location}
                                </span>
                                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    🕐 {formatTime(req.proposedTime)}
                                </span>
                            </div>

                            {req.message && (
                                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg mb-3">
                                    "{req.message}"
                                </p>
                            )}

                            {/* actions */}
                            {tab === 'incoming' && req.status === 'pending' && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <button
                                        onClick={() => handleRespond(req._id, 'accepted')}
                                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition font-medium"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRespond(req._id, 'declined')}
                                        className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm rounded-lg transition font-medium border border-red-200"
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}

                            {tab === 'outgoing' && req.status === 'pending' && (
                                <button
                                    onClick={() => handleCancel(req._id)}
                                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition font-medium mt-2"
                                >
                                    Cancel Request
                                </button>
                            )}

                            {tab === 'history' && !ratedMatches.includes(req._id) &&
                                new Date(req.proposedTime) < new Date() && (
                                <button
                                    onClick={() => { setRatingModal(req); setRatingError('') }}
                                    className="mt-2 px-4 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm rounded-lg transition font-medium border border-yellow-200"
                                >
                                    ⭐ Rate this match
                                </button>
                            )}
                            {tab === 'history' && ratedMatches.includes(req._id) && (
                                <p className="mt-2 text-xs text-green-600 font-medium">✓ Rated</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* rating modal */}
            {ratingModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Rate your match</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            How was your {ratingModal.game} match?
                        </p>

                        <div className="flex gap-2 mb-4">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStars(s)}
                                    className={`text-3xl transition ${s <= stars ? 'opacity-100' : 'opacity-30'}`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Optional comment..."
                            rows={3}
                            maxLength={300}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                        />

                        {ratingError && (
                            <p className="text-red-600 text-sm mb-3">{ratingError}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleRate}
                                disabled={ratingLoading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                            </button>
                            <button
                                onClick={() => { setRatingModal(null); setStars(0); setComment('') }}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}