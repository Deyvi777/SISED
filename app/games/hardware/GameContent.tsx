'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveGameScore, getGameConfigs } from '@/app/actions'

interface HardwareItem {
  id: string
  name: string
  category: string
  icon: string
}

const CATEGORIES = [
  { id: 'entrada', name: 'Dispositivos de Entrada', color: '#3b82f6', icon: '⌨️' },
  { id: 'salida', name: 'Dispositivos de Salida', color: '#ef4444', icon: '🖥️' },
  { id: 'mixto', name: 'Dispositivos de Entrada/Salida', color: '#8b5cf6', icon: '🎧' },
  { id: 'procesamiento', name: 'Dispositivos de Procesamiento', color: '#10b981', icon: '🧠' },
  { id: 'almacenamiento', name: 'Dispositivos de Almacenamiento', color: '#f59e0b', icon: '💾' },
]

const LEVELS = [
  {
    level: 1,
    title: 'Nivel 1: Componentes Básicos',
    items: [
      { id: '1-1', name: 'Teclado', category: 'entrada', icon: '/games/hardware/teclado.svg' },
      { id: '1-2', name: 'Monitor', category: 'salida', icon: '/games/hardware/monitor.svg' },
      { id: '1-3', name: 'Microprocesador (CPU)', category: 'procesamiento', icon: '/games/hardware/cpu.svg' },
      { id: '1-4', name: 'Disco Duro', category: 'almacenamiento', icon: '/games/hardware/hdd.svg' },
      { id: '1-5', name: 'Impresora Multifuncional', category: 'mixto', icon: '/games/hardware/impresora.svg' },
    ]
  },
  {
    level: 2,
    title: 'Nivel 2: Componentes Comunes',
    items: [
      { id: '2-1', name: 'Mouse (Ratón)', category: 'entrada', icon: '/games/hardware/mouse.svg' },
      { id: '2-2', name: 'Parlantes', category: 'salida', icon: '/games/hardware/parlantes.svg' },
      { id: '2-3', name: 'Memoria RAM', category: 'procesamiento', icon: '/games/hardware/ram.svg' },
      { id: '2-4', name: 'Memoria USB', category: 'almacenamiento', icon: '/games/hardware/usb.svg' },
      { id: '2-5', name: 'Pantalla Táctil', category: 'mixto', icon: '/games/hardware/touchscreen.svg' },
    ]
  },
  {
    level: 3,
    title: 'Nivel 3: Componentes Avanzados',
    items: [
      { id: '3-1', name: 'Escáner', category: 'entrada', icon: '/games/hardware/escaner.svg' },
      { id: '3-2', name: 'Proyector', category: 'salida', icon: '/games/hardware/proyector.svg' },
      { id: '3-3', name: 'Tarjeta Gráfica (GPU)', category: 'procesamiento', icon: '/games/hardware/gpu.svg' },
      { id: '3-4', name: 'Tarjeta SD', category: 'almacenamiento', icon: '/games/hardware/sd.svg' },
      { id: '3-5', name: 'Módem Router', category: 'mixto', icon: '/games/hardware/modem.svg' },
    ]
  }
]

export default function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const studentName = searchParams.get('student') || ''
  const courseName = searchParams.get('course') || ''

  const [currentLevel, setCurrentLevel] = useState(1)
  const [itemsToDrag, setItemsToDrag] = useState<HardwareItem[]>([])
  const [classifiedItems, setClassifiedItems] = useState<Record<string, HardwareItem[]>>({
    entrada: [],
    salida: [],
    mixto: [],
    procesamiento: [],
    almacenamiento: [],
  })
  
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  const [maxConfiguredPoints, setMaxConfiguredPoints] = useState(45)

  useEffect(() => {
    if (!studentName || !courseName) {
      router.push('/')
      return
    }

    async function fetchConfig() {
      const configs = await getGameConfigs('hardware_classification')
      const currentConfig = configs.find(c => c.courseName === courseName)
      if (currentConfig && (currentConfig as any).maxPoints) {
        setMaxConfiguredPoints((currentConfig as any).maxPoints)
      }
    }
    fetchConfig()
    loadLevel(1)
  }, [studentName, courseName, router])

  const loadLevel = (lvlIndex: number) => {
    const lvl = LEVELS.find(l => l.level === lvlIndex)
    if (lvl) {
      const shuffled = [...lvl.items].sort(() => Math.random() - 0.5)
      setItemsToDrag(shuffled)
      setClassifiedItems({
        entrada: [],
        salida: [],
        mixto: [],
        procesamiento: [],
        almacenamiento: [],
      })
      setFeedback(null)
    } else {
      finishGame()
    }
  }

  const finishGame = async (finalErrors?: number) => {
    setGameFinished(true)
    const errorsCount = typeof finalErrors === 'number' ? finalErrors : errors
    const calculatedScore = Math.max(0, maxConfiguredPoints - (errorsCount * (maxConfiguredPoints / 15)))
    const scaledScore = Math.round(calculatedScore)
    await saveGameScore('hardware_classification', studentName, courseName, scaledScore, LEVELS.length)
  }

  const handleDragStart = (e: React.DragEvent, item: HardwareItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item))
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault()
    const itemData = e.dataTransfer.getData('text/plain')
    if (!itemData) return

    const item: HardwareItem = JSON.parse(itemData)

    if (item.category === targetCategory) {
      const newScore = score + 10
      setScore(newScore)
      setFeedback({ text: `¡Correcto! El ${item.name} pertenece a esta categoría.`, type: 'success' })
      
      setClassifiedItems(prev => ({
        ...prev,
        [targetCategory]: [...prev[targetCategory], item]
      }))
      setItemsToDrag(prev => prev.filter(i => i.id !== item.id))

      if (itemsToDrag.length === 1) {
        if (currentLevel < LEVELS.length) {
          setFeedback({ text: '¡Nivel Completado! Avanzando...', type: 'success' })
          setTimeout(() => {
            const nextLvl = currentLevel + 1
            setCurrentLevel(nextLvl)
            loadLevel(nextLvl)
          }, 2000)
        } else {
          setFeedback({ text: '¡Felicidades! Has completado todos los niveles.', type: 'success' })
          setTimeout(() => {
            setCurrentLevel(LEVELS.length + 1)
            finishGame(errors)
          }, 2000)
        }
      }
    } else {
      const newScore = Math.max(0, score - 5)
      setScore(newScore)
      setErrors(prev => prev + 1)
      setFeedback({ text: `Incorrecto. El ${item.name} no pertenece a esa categoría.`, type: 'error' })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  if (gameFinished) {
    return (
      <div className="container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="section-card" style={{ padding: '3rem', background: 'white' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏆</div>
          <h1 style={{ color: '#111827', margin: '0 0 1rem 0' }}>¡Juego Terminado!</h1>
          <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '2rem' }}>
            Buen trabajo, <strong style={{ color: 'var(--primary)' }}>{studentName}</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Puntaje Final</span>
              <span style={{ fontSize: '2.5rem', color: '#15803d', fontWeight: '900' }}>{Math.max(0, Math.round(maxConfiguredPoints - (errors * (maxConfiguredPoints / 15))))} / {maxConfiguredPoints} pts</span>
            </div>
            <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>Nivel Máximo</span>
              <span style={{ fontSize: '2.5rem', color: '#1d4ed8', fontWeight: '900' }}>Nivel {LEVELS.length}</span>
            </div>
          </div>

          <Link href="/" className="auth-btn" style={{ textDecoration: 'none', display: 'inline-block', width: '100%', padding: '1rem', borderRadius: '12px' }}>
            Regresar al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '2rem auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            ⬅️ Volver
          </Link>
          <h1 style={{ color: 'white', margin: '0.5rem 0 0 0', fontSize: '2rem' }}>Hardware: Clasificación</h1>
          <p style={{ color: 'var(--secondary)', margin: '0.25rem 0 0 0' }}>
            Jugador: <strong>{studentName}</strong> | Curso: <strong>{courseName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', textTransform: 'uppercase' }}>PUNTOS</span>
            <span style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>{Math.max(0, Math.round(maxConfiguredPoints - (errors * (maxConfiguredPoints / 15))))} / {maxConfiguredPoints}</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', textTransform: 'uppercase' }}>ERRORES</span>
            <span style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 'bold' }}>{errors}</span>
          </div>
        </div>
      </header>

      <div className="section-card" style={{ marginBottom: '2rem', padding: '1rem 1.5rem', background: 'linear-gradient(90deg, var(--primary), #8b5cf6)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
        {LEVELS.find(l => l.level === currentLevel)?.title || `Nivel ${currentLevel}`}
      </div>

      {feedback && (
        <div style={{
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          fontWeight: '600',
          textAlign: 'center',
          background: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          border: `1px solid ${feedback.type === 'success' ? '#34d399' : '#f87171'}`
        }}>
          {feedback.text}
        </div>
      )}

      <div className="section-card" style={{ marginBottom: '3rem', padding: '2rem', background: '#f8fafc', border: '2px dashed #cbd5e1' }}>
        <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center' }}>
          👇 ARRASTRA ESTOS COMPONENTES A SU CAJA CORRECTA 👇
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {itemsToDrag.map(item => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                padding: '1.25rem',
                borderRadius: '16px',
                cursor: 'grab',
                width: '140px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <img src={item.icon} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {CATEGORIES.map(cat => (
          <div
            key={cat.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, cat.id)}
            style={{
              background: 'white',
              borderRadius: '20px',
              border: `3px solid ${cat.color}`,
              padding: '1.5rem',
              minHeight: '250px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: `2px solid ${cat.color}22`, paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#1e293b', margin: 0, fontWeight: '700' }}>{cat.name}</h3>
            </div>


            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {classifiedItems[cat.id].map(item => (
                <div 
                  key={item.id} 
                  style={{ 
                    background: `${cat.color}11`, 
                    color: '#1e293b', 
                    padding: '0.5rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    border: `1px solid ${cat.color}33`
                  }}
                >
                  <img src={item.icon} alt="" style={{ width: '20px', height: '20px' }} />
                  <span>{item.name}</span>
                </div>
              ))}
              {classifiedItems[cat.id].length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.85rem', border: '2px dashed #f1f5f9', borderRadius: '12px' }}>
                  Suelta aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
