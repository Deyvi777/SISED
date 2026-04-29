'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvaluation, getCourses } from '@/app/actions'

interface Question {
  type: 'MULTIPLE_CHOICE' | 'FILL_IN_BLANKS' | 'TEXT'
  content: string
  options?: string
  correctAnswer: string
  points: number
}

export default function NewEvaluation() {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(30)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [availableCourses, setAvailableCourses] = useState<string[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false)
  const [showScoreAtEnd, setShowScoreAtEnd] = useState(true)
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [teacher, setTeacher] = useState<{ id: string } | null>(null)
  const router = useRouter()

  async function loadCourses(t: { id: string }) {
    const courses = await getCourses()
    setTeacher(t)
    setAvailableCourses(courses)
  }

  useEffect(() => {
    async function init() {
      const savedTeacher = localStorage.getItem('teacher')
      if (!savedTeacher) {
        router.push('/login')
      } else {
        await loadCourses(JSON.parse(savedTeacher))
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const addQuestion = () => {
    setQuestions([...questions, { 
      type: 'MULTIPLE_CHOICE', 
      content: '', 
      correctAnswer: '',
      points: 1
    }])
  }

  const removeQuestion = (index: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) {
      const newQuestions = [...questions]
      newQuestions.splice(index, 1)
      setQuestions(newQuestions)
    }
  }

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const newQuestions = [...questions]
    let finalValue = value
    if (field === 'points') finalValue = typeof value === 'string' ? parseFloat(value) || 0 : value
    newQuestions[index] = { ...newQuestions[index], [field]: finalValue } as Question
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    if (selectedCourses.length === 0) {
      alert('Selecciona al menos un curso')
      return
    }
    if (questions.length === 0) {
      alert('Añade al menos una pregunta')
      return
    }

    setLoading(true)
    const result = await createEvaluation({
      title,
      duration,
      teacherId: teacher.id,
      courses: selectedCourses,
      allowMultipleAttempts,
      showScoreAtEnd,
      showCorrectAnswers,
      shuffleQuestions,
      questions
    })

    if (result.success) {
      router.push('/dashboard')
    } else {
      alert('Error al crear la evaluación')
      setLoading(false)
    }
  }

  const toggleCourse = (course: string) => {
    setSelectedCourses(prev => 
      prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]
    )
  }

  if (!teacher) return null

  return (
    <div className="dashboard-layout">
      {/* Reutilizamos el Sidebar si es necesario, o un layout simplificado */}
      <aside className="sidebar">
        <div className="sidebar-logo">SISED</div>
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
          <Link href="/dashboard/games" className="nav-item">
            <span>🎮</span> Juegos
          </Link>
        </nav>
      </aside>

      <main className="dashboard-content">
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
            <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Dashboard</Link> / Nueva Evaluación
          </div>
          <h1 style={{ margin: 0 }}>Crear Evaluación</h1>
          <p style={{ color: 'var(--secondary)' }}>Configura los detalles y preguntas de tu evaluación</p>
        </header>

        <form onSubmit={handleSubmit} className="section-card">
        <div className="form-group">
          <label>Título de la Evaluación</label>
          <input 
            type="text" 
            className="form-control" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Duración (minutos)</label>
          <input 
            type="number" 
            className="form-control" 
            value={duration} 
            onChange={e => setDuration(parseInt(e.target.value))} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Cursos Disponibles (Selecciona varios)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {availableCourses.map(course => (
              <button
                key={course}
                type="button"
                className={`course-btn ${selectedCourses.includes(course) ? 'active' : ''}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => toggleCourse(course)}
              >
                {course}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <input 
              type="checkbox" 
              id="multipleAttempts"
              checked={allowMultipleAttempts} 
              onChange={e => setAllowMultipleAttempts(e.target.checked)}
            />
            <label htmlFor="multipleAttempts" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>Permitir repetir</label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <input 
              type="checkbox" 
              id="showScoreAtEnd"
              checked={showScoreAtEnd} 
              onChange={e => setShowScoreAtEnd(e.target.checked)}
            />
            <label htmlFor="showScoreAtEnd" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>Mostrar nota final</label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <input 
              type="checkbox" 
              id="showCorrectAnswers"
              checked={showCorrectAnswers} 
              onChange={e => setShowCorrectAnswers(e.target.checked)}
            />
            <label htmlFor="showCorrectAnswers" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>Mostrar resp. correctas</label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <input 
              type="checkbox" 
              id="shuffleQuestions"
              checked={shuffleQuestions} 
              onChange={e => setShuffleQuestions(e.target.checked)}
            />
            <label htmlFor="shuffleQuestions" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', color: '#111827' }}>Aleatorizar preguntas</label>
          </div>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: 'var(--card-border)' }} />

        <div className="student-list-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            Preguntas
            <button type="button" onClick={addQuestion} className="course-btn" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white' }}>
              + Añadir Pregunta
            </button>
          </div>
          <div className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
            Puntaje Total: {questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)} pts
          </div>
        </div>

        {questions.map((q, index) => (
          <div key={index} style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--accent)', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Pregunta #{index + 1}</span>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🗑️ Eliminar
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Tipo</label>
                <select 
                  className="form-control" 
                  value={q.type} 
                  onChange={e => updateQuestion(index, 'type', e.target.value as Question['type'])}
                >
                  <option value="MULTIPLE_CHOICE">Selección Múltiple</option>
                  <option value="FILL_IN_BLANKS">Complementación</option>
                  <option value="TEXT">Pregunta Abierta</option>
                </select>
              </div>
              <div style={{ width: '100px' }}>
                <label>Puntos</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="form-control" 
                  value={isNaN(q.points) ? '' : q.points} 
                  onChange={e => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    updateQuestion(index, 'points', val)
                  }}
                  required 
                />
              </div>
              <div style={{ flex: 3 }}>
                <label>Enunciado de la pregunta</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={q.content} 
                  onChange={e => updateQuestion(index, 'content', e.target.value)} 
                  required 
                />
              </div>
            </div>

            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="form-group">
                <label>Opciones (Separadas por comas)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Opción A, Opción B, Opción C" 
                  value={q.options || ''} 
                  onChange={e => updateQuestion(index, 'options', e.target.value)} 
                />
              </div>
            )}

            <div className="form-group">
              <label>Respuesta Correcta</label>
              <input 
                type="text" 
                className="form-control" 
                value={q.correctAnswer} 
                onChange={e => updateQuestion(index, 'correctAnswer', e.target.value)} 
                required 
              />
            </div>
          </div>
        ))}

        {questions.length > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button type="button" onClick={addQuestion} className="course-btn" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', background: '#f3f4f6', border: '1px dashed #d1d5db', color: '#4b5563', fontWeight: '600', width: '100%' }}>
              + Añadir otra pregunta
            </button>
          </div>
        )}

        <button type="submit" className="auth-btn" disabled={loading} style={{ marginTop: '0rem' }}>
          {loading ? 'Guardando...' : 'Crear Evaluación'}
        </button>
      </form>
      </main>
    </div>
  )
}
