'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCourses, getGameConfigs, saveAllGameConfigs, getAllGameScores, resetGameScore } from '@/app/actions'


interface Teacher {
  id: string
  name: string
}

interface GameConfigItem {
  id?: string
  courseName: string
  maxAttempts: number
  isActive: boolean
  maxPoints: number
}

interface ScoreItem {
  id: string
  studentName: string
  courseName: string
  score: number
  levelReached: number
  attemptsUsed: number
  completedAt: Date
}

export default function GamesConfigPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [courses, setCourses] = useState<string[]>([])
  const [configs, setConfigs] = useState<Record<string, GameConfigItem>>({})

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const router = useRouter()

  const gameId = 'hardware_classification'


  useEffect(() => {
    const savedTeacher = localStorage.getItem('teacher')
    if (!savedTeacher) {
      router.push('/login')
      return
    }
    setTeacher(JSON.parse(savedTeacher))

    async function loadData() {
      const [allCourses, savedConfigs] = await Promise.all([
        getCourses(),
        getGameConfigs(gameId)
      ])

      setCourses(allCourses)

      // Map configs by course
      const configMap: Record<string, GameConfigItem> = {}
      allCourses.forEach(c => {
        const found = savedConfigs.find(sc => sc.courseName === c)
        configMap[c] = found ? {
          id: found.id,
          courseName: found.courseName,
          maxAttempts: found.maxAttempts,
          isActive: found.isActive,
          maxPoints: (found as any).maxPoints || 45
        } : {
          courseName: c,
          maxAttempts: 3,
          isActive: false,
          maxPoints: 45
        }
      })
      setConfigs(configMap)
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleToggleActive = (courseName: string) => {
    setConfigs(prev => ({
      ...prev,
      [courseName]: {
        ...prev[courseName],
        isActive: !prev[courseName].isActive
      }
    }))
  }

  const handleAttemptsChange = (courseName: string, attempts: number) => {
    setConfigs(prev => ({
      ...prev,
      [courseName]: {
        ...prev[courseName],
        maxAttempts: attempts
      }
    }))
  }

  const handleMaxPointsChange = (courseName: string, points: number) => {
    setConfigs(prev => ({
      ...prev,
      [courseName]: {
        ...prev[courseName],
        maxPoints: points
      }
    }))
  }

  const handleSaveAllConfigs = async () => {
    setSaving('all')
    const configList = Object.values(configs)
    const res = await saveAllGameConfigs(gameId, configList)
    if (res.success) {
      alert('Configuraciones guardadas correctamente para todos los cursos.')
    } else {
      alert('Error: ' + res.error)
    }
    setSaving(null)
  }




  const handleLogout = () => {
    localStorage.removeItem('teacher')
    router.push('/login')
  }

  if (loading) return <div className="container">Cargando...</div>

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
          SISED
        </div>
        
        <nav className="nav-menu">
          <Link href="/dashboard" className="nav-item">
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
          <Link href="/dashboard/games" className="nav-item active">
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
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Gamificación: Panel de Juegos</h1>
          <p style={{ color: 'var(--secondary)', margin: '0.5rem 0 0 0' }}>
            Gestiona la disponibilidad y reglas para juegos educativos.
          </p>
        </header>

        {!selectedGameId ? (
          <div className="section-card" style={{ padding: '2rem' }}>
            <h2 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Selecciona un Juego</h2>
            
            <div 
              onClick={() => setSelectedGameId('hardware_classification')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ fontSize: '3.5rem' }}>🖥️</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem' }}>Clasificación de Hardware</h3>
                <p style={{ margin: '0.4rem 0 0 0', color: 'var(--secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Los estudiantes ordenan elementos en Entrada, Salida, Mixtos, Procesamiento y Almacenamiento.
                </p>
              </div>
              <span style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>⚙️ Configurar</span>
            </div>
          </div>
        ) : (
          <>
            <button 
              onClick={() => setSelectedGameId(null)}
              className="course-btn" 
              style={{ marginBottom: '2rem', background: '#1e293b', color: 'white', border: '1px solid #334155', padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '12px', fontWeight: '600' }}


            >
              ⬅️ Volver a la Lista de Juegos
            </button>

            {/* Game Info */}
            <div className="section-card" style={{ marginBottom: '2.5rem', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem' }}>🖥️</div>
              <div>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>Clasificación de Hardware</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--secondary)', fontSize: '0.9rem' }}>
                  Los estudiantes deberán arrastrar componentes físicos a sus categorías correspondientes (Entrada, Salida, Entrada/Salida, Procesamiento, Almacenamiento).
                </p>
              </div>
            </div>

            {/* Course Availability Matrix */}
            <div className="section-card" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>Disponibilidad por Curso</h2>
                <button
                  type="button"
                  onClick={handleSaveAllConfigs}
                  disabled={saving === 'all'}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    opacity: saving === 'all' ? 0.6 : 1
                  }}
                >
                  {saving === 'all' ? 'Guardando...' : '💾 Guardar Todo'}
                </button>
              </div>
              
              <div className="table-responsive">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Curso</th>
                      <th>Estado (Habilitado)</th>
                      <th>Intentos Permitidos</th>
                      <th>Puntaje Máximo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => {
                      const conf = configs[course]
                      if (!conf) return null;
                      return (
                        <tr key={course}>
                          <td style={{ fontWeight: 'bold', color: 'white' }}>{course}</td>
                          <td>
                            {/* Custom Switch Toggle */}
                            <div 
                              onClick={() => handleToggleActive(course)}
                              style={{
                                width: '52px',
                                height: '26px',
                                background: conf.isActive ? '#10b981' : '#4b5563',
                                borderRadius: '15px',
                                padding: '3px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: conf.isActive ? 'flex-end' : 'flex-start',
                                transition: 'all 0.3s ease-in-out'
                              }}
                            >
                              <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'white',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                transition: 'all 0.3s ease-in-out'
                              }} />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={conf.maxAttempts}
                              onChange={(e) => handleAttemptsChange(course, parseInt(e.target.value) || 1)}
                              style={{
                                width: '80px',
                                background: 'white',
                                border: '1px solid var(--card-border)',
                                borderRadius: '8px',
                                padding: '0.4rem',
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}
                              disabled={!conf.isActive}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              value={conf.maxPoints}
                              onChange={(e) => handleMaxPointsChange(course, parseInt(e.target.value) || 45)}
                              style={{
                                width: '80px',
                                background: 'white',
                                border: '1px solid var(--card-border)',
                                borderRadius: '8px',
                                padding: '0.4rem',
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}
                              disabled={!conf.isActive}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleSaveAllConfigs}
                  disabled={saving === 'all'}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    opacity: saving === 'all' ? 0.6 : 1
                  }}
                >
                  {saving === 'all' ? 'Guardando...' : '💾 Guardar Todo'}
                </button>
              </div>
            </div>


          </>
        )}
      </main>
    </div>
  )
}
