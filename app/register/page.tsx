'use client'

import { useState } from 'react'
import { registerTeacher } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await registerTeacher(formData)

    if (result.success) {
      router.push('/login?registered=true')
    } else {
      setError(result.error || 'Ocurrió un error al registrar.')
      setLoading(false)
    }
  }

  return (
    <div className="container auth-container">
      <div className="auth-card">
        <h2>Registro de Docente</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre Completo <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              required
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico <span style={{ color: '#ef4444' }}>*</span></label>
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
            <label htmlFor="subject">Materia <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--secondary)' }}>(Opcional)</span></label>
            <input
              type="text"
              id="subject"
              name="subject"
              className="form-control"
              placeholder="Ej. Matemáticas"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña <span style={{ color: '#ef4444' }}>*</span></label>
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
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <Link href="/login" className="auth-link">
          ¿Ya tienes cuenta? Inicia sesión aquí
        </Link>
      </div>
    </div>
  )
}
