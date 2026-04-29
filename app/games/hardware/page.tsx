import { Suspense } from 'react'
import GameContent from './GameContent'

export default function HardwareGamePage() {
  return (
    <Suspense fallback={<div className="container" style={{ color: 'white', textAlign: 'center', padding: '4rem' }}>Cargando juego...</div>}>
      <GameContent />
    </Suspense>
  )
}
