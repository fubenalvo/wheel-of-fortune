type PuzzleProps = {
  word: string;
  guessedLetters: string[];
};

function Puzzle({ word, guessedLetters }: PuzzleProps) {

  return (
    <div>
      {word.split("").map((letter, index) => {

        if (letter === " ") {
          return (
            <span key={index}>
              &nbsp;&nbsp;
            </span>
          );
        }

        const visible = guessedLetters.includes(letter);

        return (
          <span key={index}>
            {visible ? letter : "_"}{" "}
          </span>
        );
      })}
    </div>
  );
}

export default Puzzle;