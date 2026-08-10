import './App.css'
import { useEffect, useState } from 'react'
import GameBoard from './components/GameBoard'
import { AudioProvider } from './components/AudioProvider'

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
      <div className="starfield">
        <div className="layer layer-1"></div>
        <div className="layer layer-2"></div>
        <div className="layer layer-3"></div>
        <div className="layer layer-4"></div>
      </div>

      {isPortrait && (
        <div className="orientation-overlay">
          <div className="orientation-card">
            <h1>Fordítsd el a telefont</h1>
            <p>A játék fekvő nézetben jelenik meg a legjobban, hogy teljes egészében láthasd.</p>
          </div>
        </div>
      )}

      <div className={`game-wrapper ${isPortrait ? 'game-wrapper--hidden' : ''}`}>
        <AudioProvider>
          <GameBoard />
        </AudioProvider>
      </div>
    </div>
  )
}

export default App
