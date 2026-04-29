'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { getTeacherResults, deleteStudentResult, getTeacherEvaluations, getAllGameScores, resetGameScore } from '@/app/actions'

interface Teacher {
  id: string
  name: string
}

interface Evaluation {
  id: string
  title: string
}

interface StudentResult {
  id: string
  studentName: string
  listNumber: number | null
  courseName: string | null
  score: number
  totalPossible: number
  completedAt: Date
  evaluation: {
    id: string
    title: string
  }
}

interface GameScoreResult {
  id: string
  gameId: string
  studentName: string
  listNumber: number | null
  courseName: string
  score: number
  levelReached: number
  attemptsUsed: number
  completedAt: Date
}

const GAMES = [
  { id: 'hardware_classification', title: 'Clasificación de Hardware' }
]

export default function ResultsPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [activeTab, setActiveTab] = useState<'evaluations' | 'games'>('evaluations')
  
  const [results, setResults] = useState<StudentResult[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string>('')
  
  const [gameScores, setGameScores] = useState<GameScoreResult[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')

  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'listNumber' | 'score'>('listNumber')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function loadData(t: Teacher) {
    setLoading(true)
    setTeacher(t)
    try {
      const [evalsRes, resultsRes, gameScoresRes] = await Promise.all([
        getTeacherEvaluations(t.id),
        getTeacherResults(t.id),
        getAllGameScores('hardware_classification')
      ])
      setEvaluations(evalsRes as unknown as Evaluation[])
      setResults(resultsRes as unknown as StudentResult[])
      setGameScores(gameScoresRes as unknown as GameScoreResult[])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
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

  useEffect(() => {
    setSelectedCourse('all')
  }, [selectedEvaluationId, selectedGameId, activeTab])

  // Evaluaciones filters
  const evalResults = selectedEvaluationId === ''
    ? []
    : results.filter(r => r.evaluation.id === selectedEvaluationId)

  // Juegos filters
  const gameResults = selectedGameId === ''
    ? []
    : gameScores.filter(r => r.gameId === selectedGameId)

  const courses = Array.from(new Set(
    (activeTab === 'evaluations' ? evalResults : gameResults)
      .map(r => r.courseName)
      .filter(Boolean) as string[]
  )).sort()

  const filteredResults = selectedCourse === 'all'
    ? evalResults
    : evalResults.filter(r => r.courseName === selectedCourse)

  const filteredGameResults = selectedCourse === 'all'
    ? gameResults
    : gameResults.filter(r => r.courseName === selectedCourse)

  const toggleSort = (field: 'listNumber' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const sortedResults = [...filteredResults].sort((a, b) => {
    const valA = a[sortBy] ?? 0
    const valB = b[sortBy] ?? 0
    
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  const sortedGameResults = [...filteredGameResults].sort((a, b) => {
    let valA: any = a[sortBy]
    let valB: any = b[sortBy]
    
    if (sortBy === 'listNumber') {
      valA = valA ?? 999
      valB = valB ?? 999
    }
    
    if (sortOrder === 'asc') {
      return valA > valB ? 1 : -1
    } else {
      return valA < valB ? 1 : -1
    }
  })

  const handleLogout = () => {
    localStorage.removeItem('teacher')
    router.push('/login')
  }

  const handleDelete = async (id: string, studentName?: string, courseName?: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este resultado? Esta acción no se puede deshacer.')) {
      if (activeTab === 'evaluations') {
        const res = await deleteStudentResult(id)
        if (res.success) {
          setResults(results.filter(r => r.id !== id))
        } else {
          alert(res.error || 'Error al eliminar el resultado.')
        }
      } else {
        if (studentName && courseName) {
          const res = await resetGameScore(selectedGameId, studentName, courseName)
          if (res.success) {
            setGameScores(gameScores.filter(gs => gs.id !== id))
          } else {
            alert(res.error || 'Error al reiniciar la puntuación del juego.')
          }
        }
      }
    }
  }

  const handleExport = () => {
    if (activeTab === 'evaluations') {
      if (filteredResults.length === 0) {
        alert('No hay resultados para exportar.')
        return
      }

      const data = sortedResults.map(r => ({
        'Evaluación': r.evaluation.title,
        'Estudiante': r.studentName,
        'Nro. Lista': r.listNumber || '-',
        'Curso': r.courseName || '-',
        'Puntaje': r.score.toFixed(1),
        'Puntaje Total': r.totalPossible.toFixed(1),
        'Porcentaje': `${((r.score / r.totalPossible) * 100).toFixed(1)}%`,
        'Fecha': new Date(r.completedAt).toLocaleString()
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados_Evaluaciones')
      
      const fileName = selectedCourse === 'all' 
        ? 'Resultados_Evaluaciones_Todos.xlsx'
        : `Resultados_Eval_${selectedCourse}.xlsx`
        
      XLSX.writeFile(workbook, fileName)
    } else {
      if (filteredGameResults.length === 0) {
        alert('No hay resultados para exportar.')
        return
      }

      const data = sortedGameResults.map(r => ({
        'Juego': GAMES.find(g => g.id === selectedGameId)?.title || 'Juego',
        'Nro. Lista': r.listNumber || '-',
        'Estudiante': r.studentName,
        'Curso': r.courseName || '-',
        'Mejor Puntaje': r.score,
        'Nivel Máximo': r.levelReached,
        'Intentos Usados': r.attemptsUsed,
        'Fecha': new Date(r.completedAt).toLocaleString()
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados_Juegos')
      
      const fileName = selectedCourse === 'all' 
        ? 'Resultados_Juegos_Todos.xlsx'
        : `Resultados_Juegos_${selectedCourse}.xlsx`
        
      XLSX.writeFile(workbook, fileName)
    }
  }

  if (!teacher) return <div className="container">Cargando...</div>

  const isAnySelected = activeTab === 'evaluations' ? selectedEvaluationId !== '' : selectedGameId !== ''

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
          <Link href="/dashboard/results" className="nav-item active">
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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Resultados de Estudiantes</h1>
            <p style={{ color: 'var(--secondary)', marginTop: '0.4rem' }}>Monitorea el progreso de tus alumnos por curso</p>
          </div>
          {isAnySelected && (
            <button 
              onClick={handleExport}
              className="course-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.25rem'
              }}
            >
              <span>📊</span> Exportar Excel
            </button>
          )}
        </header>

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => { setActiveTab('evaluations'); setSelectedCourse('all'); }}
            className={`course-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            📝 Evaluaciones
          </button>
          <button
            onClick={() => { setActiveTab('games'); setSelectedCourse('all'); }}
            className={`course-btn ${activeTab === 'games' ? 'active' : ''}`}
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            🎮 Juegos
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos...</div>
        ) : activeTab === 'evaluations' ? (
          /* SECTION EVALUACIONES */
          selectedEvaluationId === '' ? (
            <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
              <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'white' }}>Selecciona una Evaluación</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {evaluations.map(evalu => (
                  <div 
                    key={evalu.id}
                    onClick={() => setSelectedEvaluationId(evalu.id)}
                    style={{
                      padding: '2rem',
                      background: '#1e293b',
                      borderRadius: '16px',
                      border: '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#334155'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem' }}>📝</div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'white', fontWeight: '600' }}>{evalu.title}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                      {results.filter(r => r.evaluation.id === evalu.id).length} resultados
                    </span>
                  </div>
                ))}
              </div>
              {evaluations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <h3>No tienes evaluaciones creadas</h3>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  onClick={() => setSelectedEvaluationId('')}
                  className="course-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155' }}
                >
                  <span>⬅️</span> Cambiar Evaluación
                </button>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>
                  {evaluations.find(e => e.id === selectedEvaluationId)?.title}
                </h2>
              </div>

              {/* Filters */}
              <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>Filtrar por Curso:</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setSelectedCourse('all')}
                      className={`course-btn ${selectedCourse === 'all' ? 'active' : ''}`}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Todos
                    </button>
                    {courses.map(course => (
                      <button
                        key={course}
                        onClick={() => setSelectedCourse(course)}
                        className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section-card">
                {filteredResults.length > 0 ? (
                  <div className="table-responsive">
                    <table className="student-table">
                      <thead>
                        <tr>
                          <th onClick={() => toggleSort('listNumber')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Nro. {sortBy === 'listNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Estudiante</th>
                          <th>Curso</th>
                          <th>Evaluación</th>
                          <th onClick={() => toggleSort('score')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Puntaje {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Fecha</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((res) => (
                          <tr key={res.id}>
                            <td style={{ color: 'var(--secondary)' }}>{res.listNumber || '-'}</td>
                            <td style={{ fontWeight: '600' }}>{res.studentName}</td>
                            <td>
                              <span className="badge badge-primary">
                                {res.courseName || 'N/A'}
                              </span>
                            </td>
                            <td>{res.evaluation.title}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ 
                                  fontWeight: '700', 
                                  color: res.score >= (res.totalPossible / 2) ? '#10b981' : '#ef4444',
                                  fontSize: '1.1rem'
                                }}>
                                  {res.score.toFixed(1)}
                                </span>
                                <span style={{ color: 'var(--secondary)', fontSize: '0.8rem' }}>
                                  / {res.totalPossible}
                                </span>
                              </div>
                            </td>
                            <td style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>
                              {new Date(res.completedAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleDelete(res.id)}
                                className="btn-icon"
                                style={{ 
                                  background: '#fee2e2', 
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📉</div>
                    <h3>No hay resultados</h3>
                  </div>
                )}
              </div>
            </>
          )
        ) : (
          /* SECTION JUEGOS */
          selectedGameId === '' ? (
            <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
              <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'white' }}>Selecciona un Juego</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {GAMES.map(g => (
                  <div 
                    key={g.id}
                    onClick={() => setSelectedGameId(g.id)}
                    style={{
                      padding: '2rem',
                      background: '#1e293b',
                      borderRadius: '16px',
                      border: '1px solid #334155',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#334155'
                      e.currentTarget.style.transform = 'none'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem' }}>🎮</div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'white', fontWeight: '600' }}>{g.title}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>
                      {gameScores.filter(gs => gs.gameId === g.id).length} resultados
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button 
                  onClick={() => setSelectedGameId('')}
                  className="course-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', border: '1px solid #334155' }}
                >
                  <span>⬅️</span> Cambiar Juego
                </button>
                <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'white' }}>
                  {GAMES.find(g => g.id === selectedGameId)?.title}
                </h2>
              </div>

              {/* Filters */}
              <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>Filtrar por Curso:</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => setSelectedCourse('all')}
                      className={`course-btn ${selectedCourse === 'all' ? 'active' : ''}`}
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Todos
                    </button>
                    {courses.map(course => (
                      <button
                        key={course}
                        onClick={() => setSelectedCourse(course)}
                        className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        {course}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section-card">
                {filteredGameResults.length > 0 ? (
                  <div className="table-responsive">
                    <table className="student-table">
                      <thead>
                        <tr>
                          <th onClick={() => toggleSort('listNumber')} style={{ cursor: 'pointer', userSelect: 'none', width: '90px' }}>
                            N° Lista {sortBy === 'listNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Estudiante</th>
                          <th>Curso</th>
                          <th onClick={() => toggleSort('score')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                            Puntaje {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Nivel Máximo</th>
                          <th>Intentos</th>
                          <th>Fecha</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGameResults.map((res) => (
                          <tr key={res.id}>
                            <td style={{ fontWeight: '700', color: 'var(--primary)', textAlign: 'center' }}>
                              {res.listNumber !== null && res.listNumber !== undefined ? res.listNumber : '-'}
                            </td>
                            <td style={{ fontWeight: '600' }}>{res.studentName}</td>
                            <td>
                              <span className="badge badge-primary">
                                {res.courseName || 'N/A'}
                              </span>
                            </td>
                            <td style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {res.score} pts
                            </td>
                            <td>Nivel {res.levelReached}</td>
                            <td style={{ color: 'var(--secondary)' }}>{res.attemptsUsed}</td>
                            <td style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>
                              {new Date(res.completedAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleDelete(res.id, res.studentName, res.courseName)}
                                className="btn-icon"
                                style={{ 
                                  background: '#fee2e2', 
                                  color: '#ef4444',
                                  border: 'none',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📉</div>
                    <h3>No hay puntuaciones registradas</h3>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </main>
    </div>
  )
}
