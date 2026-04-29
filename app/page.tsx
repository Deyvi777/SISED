'use client'

import { useState, useEffect } from 'react'
import { getStudentsByCourse, getCourses, getEvaluationsByCourse, validateStudentPassword, getGameConfigs, getGameScoreForStudent } from './actions'
import Link from 'next/link'

interface StudentData {
  listNumber: number | null
  fullName: string
}

interface Evaluation {
  id: string
  title: string
  duration: number
  teacher: { name: string, subject: string | null }
  results?: { studentName: string, score: number }[]
  totalPossible?: number
  allowMultipleAttempts?: boolean
}

export default function Home() {
  const [courses, setCourses] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null)
  
  // Auth state
  const [studentToAuth, setStudentToAuth] = useState<StudentData | null>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const [availableEvaluations, setAvailableEvaluations] = useState<Evaluation[]>([])
  const [showConfirm, setShowConfirm] = useState<{ id: string, title: string } | null>(null);

  const [gameConfig, setGameConfig] = useState<{ maxAttempts: number, isActive: boolean } | null>(null)
  const [gameScore, setGameScore] = useState<{ score: number, levelReached: number, attemptsUsed: number } | null>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        const data = await getCourses()
        setCourses(data)
        if (data.length === 0) {
          console.warn('No se encontraron cursos en la base de datos.')
        }

        // Recuperar sesión persistida del estudiante
        const savedSession = localStorage.getItem('studentSession')
        if (savedSession) {
          const session = JSON.parse(savedSession)
          setSelectedCourse(session.course)
          setSelectedStudent(session.student)
          
          const evals = await getEvaluationsByCourse(session.course)
          setAvailableEvaluations(evals as unknown as Evaluation[])

          const configs = await getGameConfigs('hardware_classification')
          const courseConfig = configs.find(c => c.courseName === session.course)
          if (courseConfig) {
            setGameConfig({ maxAttempts: courseConfig.maxAttempts, isActive: courseConfig.isActive })
          } else {
            setGameConfig(null)
          }

          const scoreData = await getGameScoreForStudent('hardware_classification', session.student.fullName, session.course)
          if (scoreData) {
            setGameScore({ 
              score: scoreData.score, 
              levelReached: scoreData.levelReached, 
              attemptsUsed: scoreData.attemptsUsed 
            })
          } else {
            setGameScore(null)
          }
        }
      } catch (err) {
        console.error('Error al cargar cursos:', err)
        setError('Error al conectar con el servidor. Verifica tu conexión.')
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  const handleCourseSelect = async (course: string) => {
    try {
      setSelectedCourse(course)
      setLoading(true)
      setError(null)
      const data = await getStudentsByCourse(course)
      if (Array.isArray(data)) {
        setStudents(data as unknown as StudentData[])
      } else {
        throw new Error('Formato de datos de estudiantes inválido')
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err)
      setError('Error al obtener la lista de estudiantes.')
    } finally {
      setLoading(false)
      setSelectedStudent(null)
      setStudentToAuth(null)
    }
  }

  const handleStudentClick = (student: StudentData) => {
    if (!selectedCourse) return
    if (selectedStudent?.fullName === student.fullName) {
      return 
    }
    setStudentToAuth(student)
    setPasswordInput('')
    setAuthError(null)
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentToAuth || !selectedCourse) return
    
    setIsAuthenticating(true)
    setAuthError(null)
    
    try {
      const res = await validateStudentPassword(studentToAuth.fullName, selectedCourse, passwordInput)
      if (res.success) {
        setStudentToAuth(null)
        setSelectedStudent(studentToAuth)
        setError(null)

        // Guardar sesión persistida
        localStorage.setItem('studentSession', JSON.stringify({
          student: studentToAuth,
          course: selectedCourse
        }))

        const evals = await getEvaluationsByCourse(selectedCourse)
        setAvailableEvaluations(evals as unknown as Evaluation[])

        // Fetch Game config & score
        const configs = await getGameConfigs('hardware_classification')
        const courseConfig = configs.find(c => c.courseName === selectedCourse)
        if (courseConfig) {
          setGameConfig({ maxAttempts: courseConfig.maxAttempts, isActive: courseConfig.isActive })
        } else {
          setGameConfig(null)
        }

        const scoreData = await getGameScoreForStudent('hardware_classification', studentToAuth.fullName, selectedCourse)
        if (scoreData) {
          setGameScore({ 
            score: scoreData.score, 
            levelReached: scoreData.levelReached, 
            attemptsUsed: scoreData.attemptsUsed 
          })
        } else {
          setGameScore(null)
        }
      } else {
        setAuthError(res.error || 'Contraseña incorrecta.')
      }
    } catch (err) {
      setAuthError('Error al validar la contraseña.')
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = () => {
    setSelectedStudent(null)
    setAvailableEvaluations([])
    localStorage.removeItem('studentSession')
  }

  // Group evaluations by subject
  const evaluationsBySubject = availableEvaluations.reduce((acc, ev) => {
    const subject = ev.teacher?.subject || 'General'
    if (!acc[subject]) acc[subject] = []
    acc[subject].push(ev)
    return acc
  }, {} as Record<string, Evaluation[]>)

  // Student Dashboard View
  if (selectedStudent) {
    return (
      <div className="container">
        {showConfirm && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(8px)'
          }}>
            <div className="glass-header" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2.5rem', background: 'white' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>⏱️</div>
              <h2 style={{ color: '#111827', marginBottom: '1rem' }}>¿Estás listo?</h2>
              <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Vas a iniciar la evaluación:<br/>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{showConfirm.title}</strong>
                <br/><br/>
                El cronómetro comenzará inmediatamente. Asegúrate de tener una buena conexión.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  onClick={() => setShowConfirm(null)}
                  className="course-btn" 
                  style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}
                >
                  Cancelar
                </button>
                <Link 
                  href={`/evaluation/${showConfirm.id}?student=${encodeURIComponent(selectedStudent?.fullName || '')}&course=${encodeURIComponent(selectedCourse || '')}&listNumber=${selectedStudent?.listNumber || ''}`}
                  className="auth-btn"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
                >
                  ¡Comenzar!
                </Link>
              </div>
            </div>
          </div>
        )}

        <header className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem' }}>Panel del Estudiante</h1>
            <p style={{ color: 'var(--secondary)', marginTop: '0.4rem' }}>
              Bienvenido/a, <strong style={{ color: 'var(--primary)' }}>{selectedStudent.fullName}</strong> | Curso: <span style={{ color: 'var(--primary)' }}>{selectedCourse}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="course-btn" 
            style={{ 
              background: '#dc2626', 
              color: 'white', 
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </header>

        <main style={{ marginTop: '2rem' }}>


          {Object.entries(evaluationsBySubject).length > 0 ? (
            Object.entries(evaluationsBySubject).map(([subject, evals]) => (
              <div key={subject} className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                  📚 {subject}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {evals.map(ev => {
                    const studentResult = ev.results?.find((r: { studentName: string }) => r.studentName === selectedStudent.fullName);
                    const hasTaken = !!studentResult;
                    const canTake = ev.allowMultipleAttempts || !hasTaken;
                    const totalPoints = ev.totalPossible || 0;

                    return (
                      <div key={ev.id} style={{ padding: '1.5rem', background: 'white', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', opacity: canTake ? 1 : 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.1rem' }}>{ev.title}</div>
                            {hasTaken && <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Completado</span>}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>👨‍🏫 Docente: {ev.teacher.name}</span>
                            <span>⏱️ Duración: {ev.duration} min</span>
                            {hasTaken && studentResult && (
                              <div style={{ marginTop: '0.5rem', background: '#f0fdf4', padding: '0.5rem', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold' }}>
                                🎯 Nota obtenida: {studentResult.score} / {totalPoints}
                              </div>
                            )}
                          </div>
                        </div>
                        {canTake ? (
                          <button 
                            onClick={() => setShowConfirm({ id: ev.id, title: ev.title })}
                            className="auth-btn" 
                            style={{ width: '100%', border: 'none', cursor: 'pointer', display: 'block', textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem', padding: '0.75rem', borderRadius: '12px' }}
                          >
                            Iniciar Evaluación
                          </button>
                        ) : (
                          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#dc2626', fontWeight: '600', padding: '0.75rem', background: '#fef2f2', borderRadius: '12px' }}>
                            Límite de intentos alcanzado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)' }}>
              No hay evaluaciones disponibles para tu curso actualmente.
            </div>
          )}

          {/* Gamificación */}
          {gameConfig && gameConfig.isActive && (
            <div className="section-card" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🎮</span> Juegos Educativos
              </h2>
              
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#111827', fontSize: '1.1rem' }}>🖥️ Clasificación de Hardware</h3>
                  <p style={{ margin: '0.25rem 0 0.5rem 0', color: '#6b7280', fontSize: '0.85rem' }}>
                    Agrupa los componentes físicos de una computadora en sus categorías correctas.
                  </p>
                  
                  {gameScore ? (
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#374151' }}>
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        🎯 Mejor Puntaje: {gameScore.score} pts
                      </span>
                      <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        📊 Nivel Máx: {gameScore.levelReached}
                      </span>
                      <span style={{ background: '#fef2f2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 'bold' }}>
                        🔄 Intentos: {gameScore.attemptsUsed} / {gameConfig.maxAttempts}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                      🆕 ¡No jugado aún! (Intentos disponibles: {gameConfig.maxAttempts})
                    </span>
                  )}
                </div>

                <div>
                  {(!gameScore || gameScore.attemptsUsed < gameConfig.maxAttempts) ? (
                    <Link 
                      href={`/games/hardware?student=${encodeURIComponent(selectedStudent?.fullName || '')}&course=${encodeURIComponent(selectedCourse || '')}`}
                      className="auth-btn"
                      style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600' }}
                    >
                      Jugar Ahora
                    </Link>
                  ) : (
                    <span style={{ color: '#dc2626', background: '#fef2f2', padding: '0.75rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', border: '1px solid #fee2e2' }}>
                      Límite de intentos alcanzado
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.8rem' }}>
          &copy; {new Date().getFullYear()} Sistema de Gestión Escolar
        </footer>
      </div>
    )
  }

  // Original course/student selection view
  return (
    <div className="container">
      {/* Auth Modal */}
      {studentToAuth && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-header" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2.5rem', background: 'white' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🔐</div>
            <h2 style={{ color: '#111827', marginBottom: '1rem' }}>Ingreso de Estudiante</h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Hola, <strong style={{ color: 'var(--primary)' }}>{studentToAuth.fullName}</strong>.<br/>
              Ingresa tu contraseña (fecha de nacimiento).
            </p>
            <form onSubmit={handleAuthSubmit}>
              <input
                type="text"
                placeholder="DD-MM-YYYY"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ 
                  width: '100%', 
                  marginBottom: '1rem', 
                  textAlign: 'center', 
                  letterSpacing: '2px', 
                  fontSize: '1.1rem',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #d1d5db',
                  outline: 'none'
                }}
                autoFocus
              />
              {authError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem', background: '#fee2e2', padding: '0.5rem', borderRadius: '8px' }}>
                  {authError}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setStudentToAuth(null)}
                  className="course-btn" 
                  style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', padding: '0.75rem' }}
                  disabled={isAuthenticating}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="auth-btn"
                  style={{ border: 'none', cursor: 'pointer', padding: '0.75rem' }}
                  disabled={isAuthenticating || !passwordInput}
                >
                  {isAuthenticating ? 'Validando...' : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="glass-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Sistema de Evaluación</h1>
            <p style={{ color: 'var(--secondary)' }}>Selecciona un curso para ver la lista de estudiantes</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/login" className="course-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}>
              Login Docente
            </Link>
          </div>
        </div>
      </header>

      <main>
        {error && (
          <div style={{ 
            background: '#fee2e2', color: '#dc2626', padding: '1rem', 
            borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <div className="course-grid">
          {courses.map((course) => (
            <button
              key={course}
              className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
              onClick={() => handleCourseSelect(course)}
            >
              {course}
            </button>
          ))}
        </div>

        {selectedCourse ? (
          <div className="student-list-container">
            <div className="student-list-title">
              <span>Curso:</span>
              <span style={{ color: 'var(--primary)' }}>{selectedCourse}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: 'normal' }}>
                {students.length} Estudiantes
              </span>
            </div>

            {loading ? (
              <div className="empty-state">Cargando estudiantes...</div>
            ) : students.length > 0 ? (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Nombre Completo</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr 
                      key={index} 
                      onClick={() => handleStudentClick(student)}
                      style={{ cursor: 'pointer' }}
                      className=""
                    >
                      <td className="list-number">
                        {student.listNumber || '-'}
                      </td>
                      <td className="full-name">
                        {student.fullName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No hay estudiantes registrados en este curso.</div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)' }}>
            Selecciona un curso de arriba para comenzar
          </div>
        )}
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.8rem' }}>
        &copy; {new Date().getFullYear()} Sistema de Gestión Escolar
      </footer>

      <style jsx>{`
        .active-row td {
          background: var(--accent) !important;
          color: var(--primary) !important;
          font-weight: 700;
        }
      `}</style>
    </div>
  )
}
