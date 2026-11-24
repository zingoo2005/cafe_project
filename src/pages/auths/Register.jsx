import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coffee, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api/cafes'

const currentYear = new Date().getFullYear()

export default function Register({ onRegister }) {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const displayName = formData.name.trim()
    const email = formData.email.trim().toLowerCase()

    const { password, confirmPassword } = formData

    if (
      !displayName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError('Please complete all fields.')
      return
    }

    if (displayName.length > 80) {
      setError('Display Name must be 80 characters or fewer.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.register({
        name: displayName,
        email,
        password,
        password_confirmation: confirmPassword,
      })
      onRegister?.(response)
      navigate('/profile', {
        replace: true,
      })
    } catch (err) {
      setError(err.message || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full min-w-0 rounded-xl border border-[#E8DED5] bg-white px-4 py-3.5 text-base text-[#593722] outline-none transition placeholder:text-[#A18D7E] focus:border-[#6F4E3A] focus:ring-2 focus:ring-[#6F4E3A]/10'

  const labelClass =
    'mb-2 block text-sm font-bold text-[#593722]'

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[#FBF6F1] px-4 py-8 sm:px-6 sm:py-10">

      <div className="w-full max-w-[620px]">

        {/* Logo */}
        <Link
          to="/"
          className="mb-7 flex items-center justify-center gap-3"
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

        <section className="rounded-2xl border border-[#E8DED5] bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8 md:p-10">

          <h1 className="text-3xl font-black text-[#38291F] sm:text-4xl">
            Create Account
          </h1>

          <p className="mt-3 text-base leading-6 text-[#8B7B70]">
            Join CafeMate and discover your next favourite café.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            {/* Display Name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Display Name
              </label>

              <input
                id="name"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your display name"
                maxLength={80}
                className={inputClass}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                maxLength={254}
                className={inputClass}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  minLength={8}
                  className={`${inputClass} pr-12`}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7B70]"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter your password again"
                  className={`${inputClass} pr-12`}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7B70]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6F4E3A] px-5 py-4 font-bold text-white transition hover:bg-[#593722] disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-[#705D50] sm:text-base">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#6F4E3A] hover:underline"
            >
              Log In
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-[#8B7B70]">
            New accounts are regular users. Administrator access is assigned by an existing administrator.
          </p>

        </section>

        <p className="mt-5 text-center text-xs text-[#A18D7E]">
          © {currentYear} CafeMate Mandalay
        </p>

      </div>
    </main>
  )
}