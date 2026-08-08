import { useEffect, useState } from "react";
import { useGame } from "../game/useGame";
import Keyboard from "./Keyboard";
import Puzzle from "./Puzzle";
import ScoreBoard from "./ScoreBoard";
import Wheel from "./Wheel";

function GameBoard() {
  const [solveGuess, setSolveGuess] = useState("");
  const [computerSpinRequest, setComputerSpinRequest] = useState<number | null>(null);

  const {
    players,
    currentPlayer,
    currentPlayerIndex,
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

  const difficultyLevels = [
    "Analfabéta",
    "Pancser",
    "Kontár",
    "Amatőr",
    "Kezdő",
    "Haladó",
    "Rutinos",
    "No csak",
    "Profi",
    "Zseni",
    "Genius",
    "Einstein",
    "Mint én",
  ];

  function handleSolve() {
    attemptSolve(solveGuess);
    setSolveGuess("");
  }

  useEffect(() => {
    if (currentPlayer.computer && gamePhase === "spinning") {
      setComputerSpinRequest(previous => (previous ?? 0) + 1);
    }
  }, [currentPlayer.computer, currentPlayer.difficulty, currentPlayerIndex, gamePhase]);

  return (
    <div className="game-board">
      
      <div className="side-column left-column">
        <Wheel
          onSpinResult={handleSpin}
          disabled={gamePhase !== "spinning" || currentPlayer.computer}
          lastResult={lastSpinResult}
          autoSpinTrigger={computerSpinRequest}
        />

      </div>
      <div className="main-column">
        <div className="main-column-left">
          <h1>Wheel of Fortune</h1>  
          <div className="puzzle-positioner">
            <div className="puzzle-positioner-helper">
              <p className="puzzle-category">
                Category: {category}
              </p>
              <Puzzle
                word={puzzle}
                guessedLetters={guessedLetters}
              />   
            </div>
          </div>       
        </div>
        <div className="main-column-right">
          <ScoreBoard
            currentPlayer={currentPlayer}
            players={players}
          />          
        </div>

        <div className="keyboard-letters">
          {gamePhase !== "won" && gamePhase !== "waiting" && (
            <Keyboard
              onLetterClick={guessLetter}
              usedLetters={guessedLetters}

              // Disable keyboard until the wheel has been spun or if the computer is playing
              disabled={
                gamePhase !== "guessing" || currentPlayer.computer
              }
            />
          )}
        </div>

        <div className="bottom-info">
          <p>
            Current spin value:
            {" "}
            {currentSpinValue}
          </p>

          {gamePhase === "guessing" && (
            <div className="solve-guess">
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
      </div>

      <div className="side-column right-column difficulty-sidebar">
        
        {[...difficultyLevels].reverse().map((label, reversedIndex) => {
          const level = difficultyLevels.length - reversedIndex;
          return (
            <div
              key={label}
              className={`side-column-item level-${level} ${currentPlayer.difficulty === level ? "selected" : ""}`}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default GameBoard;