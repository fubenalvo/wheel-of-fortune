import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import GameBoard from './components/GameBoard'

function App() {
  //const [count, setCount] = useState(0)

  return (
    <GameBoard />
    /*
<div>
      <h1>Wheel of Fortune</h1>
      <img src={heroImg} className="base" width="170" height="179" alt="" />
              <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
    </div>
    */
   
  )
}

export default App
