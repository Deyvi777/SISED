'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCourses, getStudentsDetailedByCourse } from '@/app/actions'

interface Teacher {
  id: string
  name: string
}

interface Student {
  id: string
  fullName: string
  studentId: string
  ci: string | null
  gender: string | null
  course: string | null
  birthDate: Date | null
  listNumber: number | null
}

export default function StudentsPage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [courses, setCourses] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedTeacher = localStorage.getItem('teacher')
    if (!savedTeacher) {
      router.push('/login')
      return
    }
    
    setTeacher(JSON.parse(savedTeacher))

    async function loadCourses() {
      const availableCourses = await getCourses()
      setCourses(availableCourses)
      setLoading(false)
    }

    loadCourses()
  }, [router])

  useEffect(() => {
    async function loadStudents() {
      if (!selectedCourse) return
      setLoadingStudents(true)
      const data = await getStudentsDetailedByCourse(selectedCourse)
      setStudents(data as unknown as Student[])
      setLoadingStudents(false)
    }
    loadStudents()
  }, [selectedCourse])

  const handleLogout = () => {
    localStorage.removeItem('teacher')
    router.push('/login')
  }

  const formatBirthDate = (date: Date | null) => {
    if (!date) return 'N/A'
    const bd = new Date(date)
    const dd = String(bd.getUTCDate()).padStart(2, '0')
    const mm = String(bd.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = bd.getUTCFullYear()
    return `${dd}-${mm}-${yyyy}`
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
          <Link href="/dashboard/students" className="nav-item active">
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
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>Directorio de Estudiantes</h1>
          <p style={{ color: 'var(--secondary)', margin: '0.5rem 0 0 0' }}>
            Visualiza la información completa de tus alumnos organizada por curso.
          </p>
        </header>

        {/* Course Selector */}
        <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1.1rem' }}>Selecciona un Curso:</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {courses.map(course => (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`course-btn ${selectedCourse === course ? 'active' : ''}`}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.95rem' }}
                >
                  {course}
                </button>
              ))}
              {courses.length === 0 && (
                <span style={{ color: 'var(--secondary)' }}>No se encontraron cursos registrados.</span>
              )}
            </div>
          </div>
        </div>

        {/* Students Table */}
        {selectedCourse ? (
          <div className="section-card">
            <h2 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Estudiantes de {selectedCourse}</span>
              <span className="badge badge-primary">{students.length} Registrados</span>
            </h2>

            {loadingStudents ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>Cargando datos de los estudiantes...</p>
            ) : students.length > 0 ? (
              <div className="table-responsive">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Nro.</th>
                      <th>Nombre Completo</th>
                      <th>Contraseña (Nacimiento)</th>
                      <th>ID / Código</th>
                      <th>C.I.</th>
                      <th>Género</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>
                          {student.listNumber || '-'}
                        </td>
                        <td style={{ color: 'white', fontWeight: '600' }}>
                          {student.fullName}
                        </td>
                        <td style={{ fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--primary)' }}>
                          {formatBirthDate(student.birthDate)}
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {student.studentId}
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {student.ci || '-'}
                        </td>
                        <td>
                          {student.gender ? (
                            <span className="badge" style={{ 
                              background: student.gender.toLowerCase().startsWith('m') ? '#dbeafe' : '#fce7f3', 
                              color: student.gender.toLowerCase().startsWith('m') ? '#1e40af' : '#9d174d' 
                            }}>
                              {student.gender}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>No hay estudiantes registrados en este curso.</p>
            )}
          </div>
        ) : (
          <div className="section-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👥</span>
            Por favor, selecciona un curso en la parte superior para visualizar la información de los estudiantes.
          </div>
        )}
      </main>
    </div>
  )
}
