import { useGame } from "../game/useGame";
import Keyboard from "./Keyboard";
import Puzzle from "./Puzzle";
import ScoreBoard from "./ScoreBoard";
import Wheel from "./Wheel";

function GameBoard() {

  const {
    players,
    currentPlayer,
    guessedLetters,
    currentSpinValue,
    gamePhase,
    puzzle,
    category,
    guessLetter,
    handleSpin,
    restartGame,
  } = useGame();

  return (
    <div>
      <h1>Wheel of Fortune</h1>
      <p>
        Category: {category}
      </p>
      <Puzzle
        word={puzzle}
        guessedLetters={guessedLetters}
      />
      <br />

      {gamePhase !== "won" && (
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
      <Wheel
        onSpinResult={handleSpin}
      />
      <p>
        Current spin value:
        {" "}
        {currentSpinValue}
      </p>


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
  );
}


export default GameBoard;