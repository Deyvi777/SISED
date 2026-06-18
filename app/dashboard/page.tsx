'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTeacherStats } from '@/app/actions'

interface Teacher {
  id: string
  name: string
  email: string
}

interface Stats {
  evaluationsCount: number
  completedEvals: number
  activeCourses: number
}

export default function Dashboard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [stats, setStats] = useState<Stats>({ evaluationsCount: 0, completedEvals: 0, activeCourses: 0 })
  const router = useRouter()

  async function loadData(t: Teacher) {
    const s = await getTeacherStats(t.id)
    setTeacher(t)
    setStats(s)
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

  if (!teacher) return <div className="container">Cargando...</div>

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
          SISED
        </div>
        
        <nav className="nav-menu">
          <Link href="/dashboard" className="nav-item active">
            <span>🏠</span> Dashboard
          </Link>
          <Link href="/dashboard/evaluations" className="nav-item">
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

      {/* Main Content */}
      <main className="dashboard-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#111827', fontWeight: '800' }}>Hola, {teacher.name.split(' ')[0]} 👋</h1>
            <p style={{ color: '#4b5563', margin: '0.4rem 0 0 0', fontSize: '1rem' }}>Aquí tienes un resumen de tu actividad docente.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '0.5rem 1rem', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#111827' }}>{teacher.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>Docente Titular</div>
            </div>
            <div style={{ width: '45px', height: '45px', background: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--primary)', fontSize: '1.2rem' }}>
              {teacher.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Evaluaciones Creadas</span>
            <div className="stat-value">{stats.evaluationsCount}</div>
            <div className="badge badge-primary">Total histórico</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Cursos Activos</span>
            <div className="stat-value">{stats.activeCourses}</div>
            <div className="badge badge-primary">Con evaluaciones</div>
          </div>
          <div className="stat-card">
            <span className="stat-label">Exámenes Realizados</span>
            <div className="stat-value">{stats.completedEvals}</div>
            <div className="badge badge-success">Estudiantes evaluados</div>
          </div>
        </div>

        {/* Action Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="section-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#ffffffff', fontWeight: '700' }}>Acciones Rápidas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link href="/dashboard/evaluations/new" className="auth-btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '0.95rem' }}>
                Nueva Evaluación
              </Link>
              <Link href="/dashboard/evaluations" className="course-btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '0.95rem' }}>
                Gestionar Evaluaciones
              </Link>
              <Link href="/dashboard/students" className="course-btn" style={{ textDecoration: 'none', textAlign: 'center', fontSize: '0.95rem', border: '1px solid var(--card-border)' }}>
                Ver Listas de Estudiantes
              </Link>
            </div>
          </div>

          <div className="section-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#ffffff', fontWeight: '700' }}>Resumen de Actividad</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#4b5563', fontWeight: '500' }}>
                ✅ Sistema listo para aplicar exámenes.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
