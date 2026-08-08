import './App.css'
import { useEffect, useState } from 'react'
import GameBoard from './components/GameBoard'

function App() {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)')

    const updateOrientation = () => {
      setIsPortrait(mediaQuery.matches)

      if (!mediaQuery.matches && typeof window.screen?.orientation?.lock === 'function') {
        window.screen.orientation.lock('landscape').catch(() => undefined)
      }
    }

    updateOrientation()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateOrientation)
      return () => mediaQuery.removeEventListener('change', updateOrientation)
    }

    mediaQuery.addListener(updateOrientation)
    return () => mediaQuery.removeListener(updateOrientation)
  }, [])

  return (
    <div className="app-shell">
      {isPortrait && (
        <div className="orientation-overlay">
          <div className="orientation-card">
            <h1>Fordítsd el a telefont</h1>
            <p>A játék fekvő nézetben jelenik meg a legjobban, hogy teljes egészében láthasd.</p>
          </div>
        </div>
      )}

      <div className={`game-wrapper ${isPortrait ? 'game-wrapper--hidden' : ''}`}>
        <GameBoard />
      </div>
    </div>
  )
}

export default App
