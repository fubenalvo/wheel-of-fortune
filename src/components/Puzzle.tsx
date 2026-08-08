type PuzzleProps = {
  word: string;
  guessedLetters: string[];
};

function Puzzle({ word, guessedLetters }: PuzzleProps) {

  return (
    <div className="puzzle-container">
      {word.split("").map((letter, index) => {

        if (letter === " ") {
          return (
            <br/>
          );
        }

        const visible = guessedLetters.includes(letter);

        return (
          <span className="puzzle-letter" key={index}>
            {visible ? letter : "_"}{" "}
          </span>
        );
      })}
    </div>
  );
}

export default Puzzle;