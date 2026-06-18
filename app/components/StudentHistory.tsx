'use client'

export interface EvalHistoryItem {
  id: string
  evaluationTitle: string
  teacherName: string
  subject: string
  score: number
  totalPossible: number
  completedAt: string
}

export interface GameHistoryItem {
  id: string
  gameId: string
  score: number
  levelReached: number
  attemptsUsed: number
  completedAt: string
}

interface StudentHistoryProps {
  evaluations: EvalHistoryItem[]
  games: GameHistoryItem[]
}

const GAME_NAMES: Record<string, string> = {
  'hardware_classification': '🖥️ Clasificación de Hardware'
}

export default function StudentHistory({ evaluations, games }: StudentHistoryProps) {
  const avgPercent = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, e) => sum + (e.totalPossible > 0 ? (e.score / e.totalPossible) * 100 : 0), 0) / evaluations.length)
    : 0

  const getBarColor = (percent: number) => {
    if (percent >= 60) return '#10b981'
    if (percent >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getBarBg = (percent: number) => {
    if (percent >= 60) return '#d1fae5'
    if (percent >= 40) return '#fef3c7'
    return '#fee2e2'
  }

  return (
    <div>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="history-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', opacity: 0.85 }}>Evaluaciones Completadas</span>
          <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1.1 }}>{evaluations.length}</span>
        </div>
        <div className="history-card" style={{ background: evaluations.length > 0 ? `linear-gradient(135deg, ${getBarColor(avgPercent)}, ${avgPercent >= 60 ? '#059669' : avgPercent >= 40 ? '#d97706' : '#dc2626'})` : '#64748b', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', opacity: 0.85 }}>Promedio General</span>
          <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1.1 }}>{evaluations.length > 0 ? `${avgPercent}%` : 'N/A'}</span>
        </div>
        <div className="history-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', opacity: 0.85 }}>Juegos Realizados</span>
          <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1.1 }}>{games.length}</span>
        </div>
      </div>

      {/* Evaluations History */}
      <div className="section-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📝 Historial de Evaluaciones
        </h2>

        {evaluations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {evaluations.map(ev => {
              const percent = ev.totalPossible > 0 ? Math.round((ev.score / ev.totalPossible) * 100) : 0
              const barColor = getBarColor(percent)
              const barBg = getBarBg(percent)
              const date = new Date(ev.completedAt)

              return (
                <div key={ev.id} style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.05rem' }}>{ev.evaluationTitle}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                        👨‍🏫 {ev.teacherName} • 📚 {ev.subject}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: barColor }}>
                        {ev.score} / {ev.totalPossible}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar" style={{ background: barBg }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        background: barColor
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', color: barColor, marginTop: '4px' }}>
                    {percent}%
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ fontWeight: '600', color: '#6b7280' }}>Aún no has completado ninguna evaluación</p>
            <p style={{ fontSize: '0.85rem' }}>Tus resultados aparecerán aquí después de cada evaluación.</p>
          </div>
        )}
      </div>

      {/* Games History */}
      <div className="section-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎮 Historial de Juegos
        </h2>

        {games.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {games.map(game => {
              const date = new Date(game.completedAt)
              return (
                <div key={game.id} style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.05rem' }}>
                      {GAME_NAMES[game.gameId] || game.gameId}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                      {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #bbf7d0' }}>
                      🎯 {game.score} pts
                    </span>
                    <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #bfdbfe' }}>
                      📊 Nivel {game.levelReached}
                    </span>
                    <span style={{ background: '#faf5ff', color: '#6b21a8', padding: '0.35rem 0.75rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', border: '1px solid #e9d5ff' }}>
                      🔄 {game.attemptsUsed} intentos
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <p style={{ fontWeight: '600', color: '#6b7280' }}>Aún no has jugado ningún juego</p>
            <p style={{ fontSize: '0.85rem' }}>Tus puntajes aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  )
}
