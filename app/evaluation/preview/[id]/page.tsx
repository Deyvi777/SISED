'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEvaluationById } from '@/app/actions'

export default function PreviewEvaluation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [evaluation, setEvaluation] = useState<{title: string, duration: number, questions: {id: string, content: string, type: string, options?: string | null, correctAnswer: string}[]} | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const ev = await getEvaluationById(id)
      if (ev) {
        setEvaluation(ev)
      } else {
        alert('Evaluación no encontrada')
        router.push('/dashboard')
      }
      setLoading(false)
    }
    loadData()
  }, [id, router])

  if (loading || !evaluation) return <div className="container">Cargando vista previa...</div>

  return (
    <div className="container">
      <header className="glass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>VISTA PREVIA</span>
          <h1 style={{ margin: 0 }}>{evaluation.title}</h1>
          <p style={{ color: 'var(--secondary)' }}>Duración: {evaluation.duration} minutos | {evaluation.questions.length} preguntas</p>
        </div>
        <Link href="/dashboard" className="course-btn" style={{ textDecoration: 'none' }}>
          Volver al Dashboard
        </Link>
      </header>

      <main style={{ marginTop: '2rem' }}>
        <div className="section-card">
          <div className="student-list-title" style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '1rem', marginBottom: '2rem' }}>
            Simulación de Examen
          </div>

          {evaluation.questions.map((q: {id: string, content: string, type: string, options?: string | null, correctAnswer: string}, index: number) => (
            <div key={q.id} style={{ marginBottom: '2.5rem', padding: '2rem', background: 'white', border: '1px solid var(--card-border)', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--primary)', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0, fontSize: '1.1rem' }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#111827', marginBottom: '0.4rem', lineHeight: '1.4' }}>{q.content}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--accent)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>
                    {q.type === 'MULTIPLE_CHOICE' ? 'Selección Múltiple' : q.type === 'FILL_IN_BLANKS' ? 'Complementación' : 'Pregunta Abierta'}
                  </div>
                </div>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div style={{ display: 'grid', gap: '0.75rem', marginLeft: '3.25rem' }}>
                  {q.options.split(',').map((opt: string, i: number) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', color: '#374151', fontWeight: '500' }}>
                      <input type="radio" name={`q-${q.id}`} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      {opt.trim()}
                    </label>
                  ))}
                </div>
              )}

              {(q.type === 'FILL_IN_BLANKS' || q.type === 'TEXT') && (
                <div style={{ marginLeft: '3.25rem' }}>
                  <textarea 
                    className="form-control" 
                    placeholder="Escribe tu respuesta aquí..." 
                    rows={q.type === 'TEXT' ? 3 : 1}
                    style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}
                  ></textarea>
                </div>
              )}

              <div style={{ marginTop: '1.5rem', marginLeft: '3.25rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                  <span>✅</span> Respuesta Correcta:
                </div>
                <span style={{ fontWeight: '500' }}>{q.correctAnswer}</span>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="auth-btn" style={{ maxWidth: '300px' }} onClick={() => alert('Esto es solo una vista previa')}>
              Finalizar Intento (Vista Previa)
            </button>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.8rem' }}>
        SISED Preview Mode
      </footer>
    </div>
  )
}
