import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Coffee,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { authApi } from '../../api/cafes'

export default function Login({ onLogin, expectedRole = 'user' }) {
  const navigate = useNavigate()
  const isAdminLogin = expectedRole === 'admin'

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase()
    const password = String(formData.get('password') || '')

    try {
      const response = await authApi.login({ email, password })
      onLogin(response, expectedRole)
      navigate(isAdminLogin ? '/admin' : '/', {
        replace: true,
      })
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#E8DED5] bg-white p-3.5 text-[#593722] outline-none transition focus:border-[#6F4E3A] focus:ring-2 focus:ring-[#6F4E3A]/10'

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#FBF6F1] px-4 py-10">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-[#E8DED5] bg-white p-8 shadow-sm"
      >

        {/* Logo */}
        <Link
          to="/"
          className="mb-7 flex items-center gap-3"
        >
          <Coffee size={36} className="text-[#6F4E3A]" />

          <div>
            <h2 className="text-2xl font-extrabold text-[#593722]">
              CafeMate.
            </h2>

            <p className="text-xs font-bold tracking-[0.28em] text-[#8B7B70]">
              MANDALAY
            </p>
          </div>
        </Link>

        <h1 className="text-3xl font-black text-[#38291F]">
          {isAdminLogin ? 'Admin Sign In' : 'Welcome Back'}
        </h1>

        <p className="mt-2 text-sm text-[#8B7B70]">
          {isAdminLogin
            ? 'Sign in with your administrator account.'
            : 'Sign in to your CafeMate account.'}
        </p>

        {isAdminLogin && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
            <ShieldCheck
              size={23}
              className="mx-auto text-blue-700"
            />
            <p className="mt-1 text-sm font-bold text-blue-800">
              Admin
            </p>
          </div>
        )}

        {/* Email */}
        <label
          htmlFor="email"
          className="mt-6 block text-sm font-bold text-[#593722]"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={`mt-2 ${inputClass}`}
          placeholder="you@example.com"
        />

        {/* Password */}
        <label
          htmlFor="password"
          className="mt-4 block text-sm font-bold text-[#593722]"
        >
          Password
        </label>

        <div className="relative mt-2">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            className={`${inputClass} pr-12`}
            placeholder="Enter your password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? 'Hide password' : 'Show password'
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7B70]"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {/* Login */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-[#6F4E3A] p-3.5 font-bold text-white transition hover:bg-[#593722] disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Log In'}
        </button>

        <p className="mt-5 text-center text-sm text-[#705D50]">
          {isAdminLogin ? (
            <>
              Looking for user sign in?{' '}
              <Link
                to="/login"
                className="font-bold text-[#6F4E3A] hover:underline"
              >
                User login
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-[#6F4E3A] hover:underline"
              >
                Register
              </Link>
            </>
          )}
        </p>

      </form>
    </main>
  )
}