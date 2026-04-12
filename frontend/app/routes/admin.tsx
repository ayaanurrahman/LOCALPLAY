import { useState, useEffect } from 'react'
import AdminRoute from '../components/AdminRoute'
import api from '../api/axios'

interface Stats {
    users: { total: number; active: number; banned: number }
    requests: {
        total: number; pending: number; accepted: number
        declined: number; cancelled: number; successRate: string
    }
    popularGames: { _id: string; count: number }[]
}

interface User {
    _id: string
    username: string
    email: string
    role: string
    isBanned: boolean
    createdAt: string
    games: { name: string; skillLevel: string }[]
}

export default function Admin() {
    return (
        <AdminRoute>
            <AdminContent />
        </AdminRoute>
    )
}

function AdminContent() {
    const [tab, setTab] = useState<'stats' | 'users' | 'requests'>('stats')
    const [stats, setStats] = useState<Stats | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [statusFilter, setStatusFilter] = useState('')
    const [usersPage, setUsersPage] = useState(1)
    const [usersTotalPages, setUsersTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchStats = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/stats')
            setStats(res.data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load stats')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async (page = usersPage) => {
        setLoading(true)
        try {
            const res = await api.get('/admin/users', { params: { page } })
            setUsers(res.data.users)
            setUsersTotalPages(res.data.totalPages)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (statusFilter) params.status = statusFilter
            const res = await api.get('/admin/requests', { params })
            setRequests(res.data.requests)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setError('')
        setSuccess('')
        setUsersPage(1)
        if (tab === 'stats') fetchStats()
        if (tab === 'users') fetchUsers(1)
        if (tab === 'requests') fetchRequests()
    }, [tab])

    useEffect(() => {
        if (tab === 'requests') fetchRequests()
    }, [statusFilter])

    useEffect(() => {
        if (tab === 'users') fetchUsers(usersPage)
    }, [usersPage])

    const handleBan = async (userId: string, isBanned: boolean) => {
        try {
            await api.put(`/admin/users/${userId}/ban`)
            setSuccess(`User ${isBanned ? 'unbanned' : 'banned'} successfully`)
            fetchUsers()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update user')
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('Permanently delete this user and all their data?')) return
        try {
            await api.delete(`/admin/users/${userId}`)
            setSuccess('User deleted successfully')
            fetchUsers()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user')
        }
    }

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' })

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm mt-1">Manage users, requests and platform activity</p>
            </div>

            {/* tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit max-w-full overflow-x-auto">
                {(['stats', 'users', 'requests'] as const).map(t => (
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
            {success && (
                <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                    {success}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : (
                <>
                    {/* stats tab */}
                    {tab === 'stats' && stats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { label: 'Total users', value: stats.users.total },
                                    { label: 'Active users', value: stats.users.active },
                                    { label: 'Banned users', value: stats.users.banned },
                                ].map(m => (
                                    <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{m.label}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{m.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                {[
                                    { label: 'Total requests', value: stats.requests.total },
                                    { label: 'Accepted', value: stats.requests.accepted },
                                    { label: 'Success rate', value: stats.requests.successRate },
                                ].map(m => (
                                    <div key={m.label} className="bg-white border border-gray-200 rounded-2xl p-5">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{m.label}</p>
                                        <p className="text-3xl font-bold text-green-600 mt-1">{m.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white border border-gray-200 rounded-2xl p-5">
                                <h2 className="font-semibold text-gray-900 mb-4">Popular games</h2>
                                <div className="space-y-3">
                                    {stats.popularGames.map((g, i) => (
                                        <div key={g._id} className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400 w-5">{i + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700 capitalize">{g._id}</span>
                                                    <span className="text-sm text-gray-500">{g.count} players</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${(g.count / stats.popularGames[0].count) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* users tab — list + pagination wrapped together */}
                    {tab === 'users' && (
                        <div>
                            <div className="space-y-3">
                                {users.map(u => (
                                    <div
                                        key={u._id}
                                        className={`bg-white border rounded-2xl p-5 ${u.isBanned ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900">{u.username}</p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                            u.role === 'admin'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                        {u.isBanned && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                                                                banned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{u.email}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        Joined {formatTime(u.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            {u.role !== 'admin' && (
                                                <div className="flex gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleBan(u._id, u.isBanned)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition border ${
                                                            u.isBanned
                                                                ? 'border-green-300 text-green-700 hover:bg-green-50'
                                                                : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                                                        }`}
                                                    >
                                                        {u.isBanned ? 'Unban' : 'Ban'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u._id)}
                                                        className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-200 text-red-700 hover:bg-red-50 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {u.games.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {u.games.map(g => (
                                                    <span
                                                        key={g.name}
                                                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize"
                                                    >
                                                        {g.name} · {g.skillLevel}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* pagination — inside the users tab block */}
                            {usersTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-3 mt-6">
                                    <button
                                        onClick={() => setUsersPage(p => p - 1)}
                                        disabled={usersPage === 1 || loading}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        Page {usersPage} of {usersTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setUsersPage(p => p + 1)}
                                        disabled={usersPage === usersTotalPages || loading}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* requests tab */}
                    {tab === 'requests' && (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['', 'pending', 'accepted', 'declined', 'cancelled'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                                            statusFilter === s
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                        }`}
                                    >
                                        {s || 'all'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {requests.map(req => (
                                    <div key={req._id} className="bg-white border border-gray-200 rounded-2xl p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap sm:flex-nowrap">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-semibold">{req.sender.username}</span>
                                                {' → '}
                                                <span className="font-semibold">{req.receiver.username}</span>
                                            </p>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                                                req.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                                : req.status === 'accepted' ? 'bg-green-100 text-green-700'
                                                : req.status === 'declined' ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                                🎮 {req.game}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                                📍 {req.location}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                🕐 {new Date(req.proposedTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                            {req.flagged && (
                                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                                    ⚑ Flagged
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}