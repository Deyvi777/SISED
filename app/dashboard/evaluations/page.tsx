'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTeacherEvaluations, toggleEvaluationStatus } from '@/app/actions'

interface Teacher {
  id: string
  name: string
}

interface Evaluation {
  id: string
  title: string
  duration: number
  courses: { courseName: string }[]
  isActive: boolean
}

export default function EvaluationsList() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadData(t: Teacher) {
    const evs = await getTeacherEvaluations(t.id)
    setLoading(true)
    setTeacher(t)
    setEvaluations(evs as unknown as Evaluation[])
    setLoading(false)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setEvaluations(prev => prev.map(ev => ev.id === id ? { ...ev, isActive: !currentStatus } : ev))
    const res = await toggleEvaluationStatus(id, !currentStatus)
    if (!res.success) {
      alert(res.error)
      // Revert if failed
      setEvaluations(prev => prev.map(ev => ev.id === id ? { ...ev, isActive: currentStatus } : ev))
    }
  }

  useEffect(() => {
    async function init() {
      const savedTeacher = localStorage.getItem('teacher')
      if (!savedTeacher) {
        router.push('/login')
      } else {
        const t = JSON.parse(savedTeacher)
        await loadData(t)
      }
    }
    init()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('teacher')
    router.push('/login')
  }

  if (!teacher) return null

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">SISED</div>
        <nav className="nav-menu">
          <Link href="/dashboard" className="nav-item">
            <span>🏠</span> Dashboard
          </Link>
          <Link href="/dashboard/evaluations" className="nav-item active">
            <span>📝</span> Tus Evaluaciones
          </Link>
          <Link href="/dashboard/results" className="nav-item">
            <span>📊</span> Resultados
          </Link>
          <Link href="/dashboard/students" className="nav-item">
            <span>👥</span> Estudiantes
          </Link>
          <Link href="/dashboard/games" className="nav-item">
            <span>🎮</span> Juegos
          </Link>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="nav-item" style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0 }}>Tus Evaluaciones</h1>
            <p style={{ color: 'var(--secondary)' }}>Gestiona y supervisa tus exámenes creados</p>
          </div>
          <Link href="/dashboard/evaluations/new" className="auth-btn" style={{ textDecoration: 'none', padding: '0.6rem 1.2rem' }}>
            + Crear Evaluación
          </Link>
        </header>

        <div className="section-card">
          {loading ? (
            <p>Cargando evaluaciones...</p>
          ) : evaluations.length > 0 ? (
            <table className="student-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Cursos</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontWeight: '600' }}>{ev.title}</td>
                    <td>
                      {ev.courses.map(c => (
                        <span key={c.courseName} className="badge badge-primary" style={{ marginRight: '4px' }}>{c.courseName}</span>
                      ))}
                    </td>
                    <td>{ev.duration} min</td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(ev.id, ev.isActive)}
                        style={{
                          background: ev.isActive ? '#10b981' : '#e2e8f0',
                          border: 'none',
                          borderRadius: '20px',
                          width: '44px',
                          height: '24px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.3s'
                        }}
                        title={ev.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '2px',
                          left: ev.isActive ? '22px' : '2px',
                          width: '20px',
                          height: '20px',
                          background: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s, box-shadow 0.3s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }} />
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/dashboard/evaluations/edit/${ev.id}`} className="course-btn" style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none' }}>
                          Editar
                        </Link>
                        <Link href={`/evaluation/preview/${ev.id}`} className="course-btn" style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none', background: 'var(--accent)', color: 'var(--primary)' }}>
                          Vista Previa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>
              No has creado ninguna evaluación todavía.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
