'use client'

import { useState } from 'react'

export interface EvalRankingItem {
  studentName: string
  listNumber: number | null
  averagePercent: number
  evaluationsCompleted: number
}

export interface GameRankingItem {
  studentName: string
  listNumber: number | null
  score: number
  levelReached: number
  attemptsUsed: number
  gameId: string
}

interface CourseRankingProps {
  evalRanking: EvalRankingItem[]
  gameRanking: GameRankingItem[]
  currentStudentName: string
  courseName: string
}

const MEDALS = ['🥇', '🥈', '🥉']

const GAME_NAMES: Record<string, string> = {
  'hardware_classification': 'Clasificación de Hardware'
}

export default function CourseRanking({ evalRanking, gameRanking, currentStudentName, courseName }: CourseRankingProps) {
  const [activeTab, setActiveTab] = useState<'evaluations' | 'games'>('evaluations')

  const getMedalOrPosition = (index: number) => {
    if (index < 3) return MEDALS[index]
    return `${index + 1}`
  }

  const getRowStyle = (studentName: string, index: number): React.CSSProperties => {
    const isCurrentStudent = studentName === currentStudentName
    const isTop3 = index < 3

    return {
      background: isCurrentStudent
        ? 'rgba(59, 130, 246, 0.08)'
        : isTop3
          ? 'rgba(250, 204, 21, 0.04)'
          : 'white',
      border: isCurrentStudent
        ? '2px solid var(--primary)'
        : '1px solid var(--card-border)',
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
      boxShadow: isTop3 ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.03)'
    }
  }

  const getBarColor = (percent: number) => {
    if (percent >= 60) return '#10b981'
    if (percent >= 40) return '#f59e0b'
    return '#ef4444'
  }

  // Find current student position
  const currentEvalRank = evalRanking.findIndex(r => r.studentName === currentStudentName)
  const currentGameRank = gameRanking.findIndex(r => r.studentName === currentStudentName)

  return (
    <div>
      {/* Current Student Position Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="history-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', opacity: 0.85 }}>Tu Posición (Evaluaciones)</span>
          <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1.1 }}>
            {currentEvalRank >= 0 ? `#${currentEvalRank + 1}` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>de {evalRanking.length} estudiantes</span>
        </div>
        <div className="history-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700', opacity: 0.85 }}>Tu Posición (Juegos)</span>
          <span style={{ fontSize: '2.5rem', fontWeight: '900', lineHeight: 1.1 }}>
            {currentGameRank >= 0 ? `#${currentGameRank + 1}` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>de {gameRanking.length} jugadores</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="student-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`student-tab ${activeTab === 'evaluations' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluations')}
        >
          📝 Evaluaciones
        </button>
        <button
          className={`student-tab ${activeTab === 'games' ? 'active' : ''}`}
          onClick={() => setActiveTab('games')}
        >
          🎮 Juegos
        </button>
      </div>

      {/* Evaluation Ranking */}
      {activeTab === 'evaluations' && (
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Ranking de Evaluaciones — {courseName}
          </h2>

          {evalRanking.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {evalRanking.map((entry, index) => (
                <div key={entry.studentName} style={getRowStyle(entry.studentName, index)}
                  className="ranking-row"
                >
                  {/* Position */}
                  <div className={index < 3 ? 'ranking-medal' : ''} style={{
                    minWidth: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: index < 3 ? '1.5rem' : '1rem',
                    fontWeight: '800',
                    color: index < 3 ? 'inherit' : '#6b7280',
                    background: index >= 3 ? '#f1f5f9' : 'transparent',
                    borderRadius: '12px'
                  }}>
                    {getMedalOrPosition(index)}
                  </div>

                  {/* Student Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: entry.studentName === currentStudentName ? '800' : '600',
                      color: '#111827',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {entry.studentName}
                      {entry.studentName === currentStudentName && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>TÚ</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {entry.listNumber ? `Nro. ${entry.listNumber}` : ''} • {entry.evaluationsCompleted} evaluaciones
                    </div>
                  </div>

                  {/* Score + Progress */}
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontWeight: '800', color: getBarColor(entry.averagePercent), fontSize: '1.1rem', textAlign: 'right' }}>
                      {entry.averagePercent}%
                    </div>
                    <div className="progress-bar" style={{ background: '#f1f5f9', height: '6px', marginTop: '4px' }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(entry.averagePercent, 100)}%`,
                        background: getBarColor(entry.averagePercent),
                        height: '6px'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p style={{ fontWeight: '600', color: '#6b7280' }}>Aún no hay resultados de evaluaciones en este curso</p>
            </div>
          )}
        </div>
      )}

      {/* Game Ranking */}
      {activeTab === 'games' && (
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Ranking de Juegos — {courseName}
          </h2>

          {gameRanking.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gameRanking.map((entry, index) => (
                <div key={`${entry.studentName}-${entry.gameId}`} style={getRowStyle(entry.studentName, index)}
                  className="ranking-row"
                >
                  {/* Position */}
                  <div className={index < 3 ? 'ranking-medal' : ''} style={{
                    minWidth: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: index < 3 ? '1.5rem' : '1rem',
                    fontWeight: '800',
                    color: index < 3 ? 'inherit' : '#6b7280',
                    background: index >= 3 ? '#f1f5f9' : 'transparent',
                    borderRadius: '12px'
                  }}>
                    {getMedalOrPosition(index)}
                  </div>

                  {/* Student Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: entry.studentName === currentStudentName ? '800' : '600',
                      color: '#111827',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {entry.studentName}
                      {entry.studentName === currentStudentName && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>TÚ</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {entry.listNumber ? `Nro. ${entry.listNumber}` : ''} • {GAME_NAMES[entry.gameId] || entry.gameId} • Nivel {entry.levelReached}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', color: '#10b981', fontSize: '1.2rem' }}>
                      {entry.score} pts
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                      {entry.attemptsUsed} intentos
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
              <p style={{ fontWeight: '600', color: '#6b7280' }}>Aún no hay puntajes de juegos en este curso</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
