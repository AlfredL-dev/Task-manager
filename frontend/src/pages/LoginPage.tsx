import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) { setError('Email is required.'); return }
    if (!password) { setError('Password is required.'); return }

    setSubmitting(true)
    try {
      const res = await login(email.trim(), password)
      signIn(res.token, res.email)
      navigate('/', { replace: true })
    } catch (err) {
      // Input preserved — user can correct and resubmit
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>

        {error && <p className="form-error" role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              disabled={submitting}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />
          </label>

          <button type="submit" className="btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
