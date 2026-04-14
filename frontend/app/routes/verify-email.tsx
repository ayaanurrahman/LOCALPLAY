import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
    const [searchParams] = useSearchParams()
    const { refreshUser } = useAuth()
    const token = searchParams.get('token')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('No verification token found in the link.')
            return
        }

        api.get(`/auth/verify/${token}`)
            .then((res) => {
                setStatus('success')
                setMessage(res.data.message)
                refreshUser() // sync isVerified in context
            })
            .catch((err) => {
                setStatus('error')
                setMessage(err.response?.data?.message || 'Verification failed.')
            })
    }, [token])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <div className="text-4xl mb-4">⏳</div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h1>
                        <p className="text-gray-500 text-sm">Just a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-4xl mb-4">✅</div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Email verified!</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <Link
                            to="/search"
                            className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            Find players
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-4xl mb-4">❌</div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <Link
                            to="/profile"
                            className="inline-block border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Resend from profile
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
