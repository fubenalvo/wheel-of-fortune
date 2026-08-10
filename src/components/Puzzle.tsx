type PuzzleProps = {
  word: string;
  guessedLetters: string[];
};

function Puzzle({ word, guessedLetters }: PuzzleProps) {
  return (
    <div>
      {word.split(" ").map((wordPart, wordIndex) => (
        <span className="puzzle-word" key={wordIndex}>
          {wordPart.split("").map((letter, letterIndex) => {
            const visible = guessedLetters.includes(letter);

            return (
              <span className="puzzle-letter" key={letterIndex}>
                {visible ? letter : "_"}{" "}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}

export default Puzzle;
