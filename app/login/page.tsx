'use client'

import { useState, Suspense } from 'react'
import { loginTeacher } from '../actions'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(searchParams.get('registered') ? 'Registro exitoso. Ahora puedes iniciar sesión.' : null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const result = await loginTeacher(formData)

    if (result.success) {
      localStorage.setItem('teacher', JSON.stringify(result.teacher))
      router.push('/dashboard')
    } else {
      setError(result.error || 'Credenciales incorrectas.')
      setLoading(false)
    }
  }

  return (
    <div className="container auth-container">
      <div className="auth-card">
        <h2>Login Docente</h2>
        
        {success && <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(34, 197, 94, 0.2)', fontSize: '0.875rem' }}>{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              required
              placeholder="docente@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <Link href="/register" className="auth-link">
          ¿No tienes cuenta? Regístrate aquí
        </Link>
        <Link href="/" className="auth-link" style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default function Login() {
  return (
    <Suspense fallback={<div className="container">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
