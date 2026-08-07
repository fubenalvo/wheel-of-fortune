import { puzzles, type Puzzle } from "../data/puzzles";

export function countLetter(
  word: string,
  letter: string
): number {

  let count = 0;

  for (const char of word) {

    if (char === letter) {
      count++;
    }

  }

  return count;
}


export function getRandomPuzzle(): Puzzle {

  const index = Math.floor(
    Math.random() * puzzles.length
  );

  return puzzles[index];

}

export function isPuzzleSolved(
  word:string,
  guessedLetters:string[]
)
{
  for(const letter of word)
  {
    if(
      letter !== " " &&
      !guessedLetters.includes(letter)
    )
    {
      return false;
    }
  }

  return true;
}