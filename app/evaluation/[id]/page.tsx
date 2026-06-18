'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getEvaluationById, submitStudentEvaluation } from '../../actions'
import Link from 'next/link'

function EvaluationContent() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentName = searchParams.get('student')
  const courseName = searchParams.get('course')
  const listNumberRaw = searchParams.get('listNumber')
  const listNumber = (listNumberRaw && listNumberRaw !== '') ? parseInt(listNumberRaw) : undefined

  const [evaluation, setEvaluation] = useState<{title: string, duration: number, isActive?: boolean, shuffleQuestions?: boolean, questions: {id: string, type: string, points: number, content: string, options: string | null, shuffledOptions?: string[]}[]} | null>(null)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmFinish, setShowConfirmFinish] = useState(false)
  const [result, setResult] = useState<{success: boolean, error?: string, score: number, totalPossible: number, showScoreAtEnd: boolean, showCorrectAnswers: boolean, feedback: {isCorrect: boolean, content: string, studentAnswer: string, correctAnswer: string}[]} | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar datos del examen
  useEffect(() => {
    async function load() {
      const data = await getEvaluationById(id as string)
      if (data) {
        if (!data.isActive) {
          alert('Esta evaluación no se encuentra activa en este momento.')
          router.push('/')
          return
        }

        let qs = data.questions.map(q => {
          let shuffledOptions: string[] | undefined = undefined;
          if (q.type === 'MULTIPLE_CHOICE' && q.options) {
            shuffledOptions = q.options.split(',').map(o => o.trim()).sort(() => Math.random() - 0.5)
          }
          return { ...q, shuffledOptions }
        })
        if (data.shuffleQuestions) {
          qs = qs.sort(() => Math.random() - 0.5)
        }
        setEvaluation({ ...data, questions: qs })
        setTimeLeft(data.duration * 60) // Convertir a segundos
      } else {
        alert('Evaluación no encontrada')
        router.push('/')
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }))

    const res = await submitStudentEvaluation(
      id as string, 
      studentName || 'Estudiante Anónimo', 
      answersArray,
      courseName || undefined,
      (listNumber !== undefined && !isNaN(listNumber)) ? listNumber : undefined
    )
    
    if (res.success && res.score !== undefined) {
      setResult(res as {success: boolean, score: number, totalPossible: number, showScoreAtEnd: boolean, showCorrectAnswers: boolean, feedback: {isCorrect: boolean, content: string, studentAnswer: string, correctAnswer: string}[]})
    } else {
      alert('Error al enviar: ' + res.error)
    }
    setIsSubmitting(false)
    setShowConfirmFinish(false)
  }

  // Lógica del cronómetro
  useEffect(() => {
    if (loading || !evaluation || result) return

    if (timeLeft <= 0) {
      setTimeout(() => handleSubmit(), 0) // Finalizar automáticamente si el tiempo se agota
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, evaluation, result])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }


  if (loading || !evaluation) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="empty-state">Preparando tu evaluación...</div>
      </div>
    )
  }

  // Pantalla de resultados
  if (result) {
    return (
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="section-card" style={{ maxWidth: '700px', margin: '2rem auto', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎯</div>
          <h1 className="title-gradient" style={{ marginBottom: '1rem' }}>Evaluación Finalizada</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Gracias, <strong style={{ color: 'white' }}>{studentName}</strong>. Tus respuestas han sido registradas.
          </p>

          {result.showScoreAtEnd && (
            <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '24px', border: '1px solid #334155', marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Tu Calificación</div>
              <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--primary)' }}>
                {Math.round(result.score)}
                <span style={{ fontSize: '1.5rem', color: '#334155', marginLeft: '0.5rem' }}>/ {Math.round(result.totalPossible)}</span>
              </div>
            </div>
          )}

          {result.showCorrectAnswers && (
            <div style={{ textAlign: 'left', marginTop: '3rem' }}>
              <h3 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📖</span> Revisión de Respuestas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.feedback.map((f, idx: number) => (
                  <div key={idx} style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '16px', border: '1px solid', borderColor: f.isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontWeight: '600', color: 'white', marginBottom: '1rem' }}>{idx + 1}. {f.content}</div>
                    <div style={{ fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Tu respuesta:</div>
                        <div style={{ color: f.isCorrect ? '#4ade80' : '#f87171', fontWeight: '600' }}>{f.studentAnswer || '(En blanco)'}</div>
                      </div>
                      {!f.isCorrect && (
                        <div>
                          <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Respuesta correcta:</div>
                          <div style={{ color: '#4ade80', fontWeight: '600' }}>{f.correctAnswer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/" className="auth-btn" style={{ marginTop: '2rem', display: 'inline-block', textDecoration: 'none' }}>
            Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {/* Header fijo con tiempo */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e293b', padding: '0.3rem 0'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', margin: 0, fontWeight: '700' }}>{evaluation.title}</h2>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Estudiante: {studentName}</div>
          </div>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            padding: '0.3rem 0.75rem', borderRadius: '10px',
            border: '1px solid', borderColor: timeLeft < 60 ? '#f87171' : 'var(--primary)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{timeLeft < 60 ? '⚠️' : '⏱️'}</span>
            <span style={{ 
              fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: '700',
              color: timeLeft < 60 ? '#f87171' : 'white'
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1rem 6rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {evaluation.questions.map((q: {id: string, type: string, points: number, content: string, options: string | null, shuffledOptions?: string[]}, idx: number) => (
            <section key={q.id} className="section-card" style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <span style={{ 
                  background: 'var(--primary)', color: 'white', 
                  padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' 
                }}>
                  Pregunta {idx + 1}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{q.points} {q.points === 1 ? 'punto' : 'puntos'}</span>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', lineHeight: '1.6', marginBottom: '2rem', fontWeight: '500' }}>
                {q.content}
              </h3>

              {q.type === 'MULTIPLE_CHOICE' && q.shuffledOptions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {q.shuffledOptions.map((opt: string, i: number) => (
                    <label 
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1.25rem', borderRadius: '14px', cursor: 'pointer',
                        background: answers[q.id] === opt ? 'rgba(99, 102, 241, 0.1)' : '#1e293b',
                        border: '1px solid', 
                        borderColor: answers[q.id] === opt ? 'var(--primary)' : '#334155',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={q.id} 
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleAnswerChange(q.id, opt)}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                      />
                      <span style={{ color: answers[q.id] === opt ? 'white' : '#94a3b8' }}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'FILL_IN_BLANKS' && (
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              )}
            </section>
          ))}

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={() => setShowConfirmFinish(true)}
              className="auth-btn"
              style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
            >
              Finalizar Evaluación
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación al Terminar */}
      {showConfirmFinish && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(8px)'
        }}>
          <div className="section-card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>🚀</div>
            <h2 style={{ color: 'white', marginBottom: '1rem' }}>¿Terminaste?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
              ¿Estás seguro de que quieres finalizar tu evaluación ahora? No podrás volver a cambiar tus respuestas.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                onClick={() => setShowConfirmFinish(false)}
                className="auth-btn" 
                style={{ background: '#334155' }}
              >
                Seguir respondiendo
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="auth-btn"
              >
                {isSubmitting ? 'Enviando...' : 'Sí, finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        label:hover {
          background: rgba(99, 102, 241, 0.05) !important;
          border-color: #475569 !important;
        }
      `}</style>
    </div>
  )
}

export default function TakeEvaluation() {
  return (
    <Suspense fallback={<div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="empty-state">Preparando tu evaluación...</div>
    </div>}>
      <EvaluationContent />
    </Suspense>
  )
}
