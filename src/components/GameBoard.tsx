import Keyboard from "./Keyboard";
import Puzzle from "./Puzzle";
import ScoreBoard from "./ScoreBoard";
import Wheel from "./Wheel";
import { useState } from "react";

function GameBoard() {

  const [score, setScore] = useState(0);
  const [puzzle, setPuzzle] = useState("MAGYAR JATEKFEJLESZTES");
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wheelValue, setWheelValue] = useState(0);
  const [currentSpinValue, setCurrentSpinValue] = useState(0);

  function guessLetter(letter: string)
  {
    if (guessedLetters.includes(letter))
    {
      return;
    }

    setGuessedLetters([
      ...guessedLetters,
      letter
    ]);
  }

  function handleSpin(value: number)
  {
    //setWheelValue(value);
    setCurrentSpinValue(value);
  }

  return (
    <div>
      <h1>Szerencsekerék</h1>


      <Puzzle word={puzzle} guessedLetters={guessedLetters} />

      <Keyboard onLetterClick={guessLetter} usedLetters={guessedLetters} />



      <p>
        Tippelt betűk:
        {guessedLetters.join(", ")}
      </p>

      <br/><br/>

      <ScoreBoard score={score} />
      <button onClick={() => setScore(score + 100)}>
        +100 pont
      </button>



      <br/><br/>
      <Wheel
        onSpinResult={handleSpin}
      />
      <p>
        Kerék eredménye: {wheelValue}
      </p>
      <p>
        Aktuális érték:
        {currentSpinValue}
      </p>


    </div>
  );
}

export default GameBoard;