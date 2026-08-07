import { useState } from "react";
import { useGame } from "../game/useGame";
import Keyboard from "./Keyboard";
import Puzzle from "./Puzzle";
import ScoreBoard from "./ScoreBoard";
import Wheel from "./Wheel";

function GameBoard() {
  const [solveGuess, setSolveGuess] = useState("");

  const {
    players,
    currentPlayer,
    guessedLetters,
    currentSpinValue,
    gamePhase,
    puzzle,
    category,
    guessLetter,
    attemptSolve,
    handleSpin,
    restartGame,
    lastSpinResult,
  } = useGame();

  function handleSolve() {
    attemptSolve(solveGuess);
    setSolveGuess("");
  }

  return (
    <div className="game-board">
      


      <div className="side-column">
        <Wheel
          onSpinResult={handleSpin}
          disabled={gamePhase !== "spinning"}
          lastResult={lastSpinResult}
        />

      </div>
      <div className="main-column">
        <h1>Wheel of Fortune</h1>
      <p>
        Category: {category}
      </p>
      <Puzzle
        word={puzzle}
        guessedLetters={guessedLetters}
      />
      <br />

      {gamePhase !== "won" && gamePhase !== "waiting" && (
        <Keyboard
          onLetterClick={guessLetter}
          usedLetters={guessedLetters}

          // Disable keyboard until the wheel has been spun
          disabled={
            gamePhase !== "guessing"
          }
        />
      )}
      <br />
      <p>
        Guessed letters:
        {" "}
        {guessedLetters.join(", ")}
      </p>

      <ScoreBoard
        currentPlayer={currentPlayer}
        players={players}
      />
      <br />
      <br />

      <p>
        Current spin value:
        {" "}
        {currentSpinValue}
      </p>

      {gamePhase === "guessing" && (
        <div>
          <h3>Megfejtés</h3>
          <input
            type="text"
            value={solveGuess}
            onChange={event => setSolveGuess(event.target.value)}
            placeholder="Írd be a megfejtést"
          />
          <button onClick={handleSolve} disabled={!solveGuess.trim()}>
            Megfejtés
          </button>
        </div>
      )}

      <p>
        Game phase:
        {" "}
        {gamePhase}
      </p>

      {gamePhase === "won" && (
        <div>
          <h2>Vége a játéknak!</h2>
          <button onClick={restartGame}>Új játék</button>
        </div>
      )}
      </div>
      <div className="side-column">

      </div>
    </div>
  );
}


export default GameBoard;