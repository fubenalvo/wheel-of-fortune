import { useState } from "react";
import type { Player } from "../models/Player";

import {
    countLetter,
  getRandomPuzzle,
  isPuzzleSolved
} from "./gameLogic";


type GamePhase =
  | "spinning"
  | "guessing"
  | "gameOver"
  | "won";


export function useGame() {


  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: "Khaaaan",
      score: 0,
    },
        {
      id: 2,
      name: "Gipsz Jakab",
      score: 0,
    },
        {
      id: 3,
      name: "James T. Krik",
      score: 0,
    },
  ]);


  const [currentPlayerIndex, setCurrentPlayerIndex] =
    useState(0);


  const currentPlayer =
    players[currentPlayerIndex];


  const [guessedLetters, setGuessedLetters] =
    useState<string[]>([]);


  const [currentSpinValue, setCurrentSpinValue] =
    useState(0);


  const [gamePhase, setGamePhase] =
    useState<GamePhase>("spinning");


  const [puzzleData, setPuzzleData] =
    useState(() => getRandomPuzzle());


  const puzzle = puzzleData.text;

  const category = puzzleData.category;


  /*
    Called after the wheel stops spinning.
    The result becomes the value of the next letter guess.
  */
  function handleSpin(value: number) {

    setCurrentSpinValue(value);

    // Allow the player to choose a letter
    setGamePhase("guessing");
  }


  
  /*
    Called when the player selects a letter.

    Checks:
    - Was this letter already used?
    - How many times does it appear?
    - Should score increase?
    - Is the puzzle solved?
  */
  function guessLetter(letter: string) {
    if (gamePhase === "won") {
      return;
    }

    // Prevent selecting the same letter twice
    if (guessedLetters.includes(letter)) {
      return;
    }


    // Count how many times the letter appears
    const amount = countLetter(
      puzzle,
      letter
    );


    if (amount > 0) {

      // Correct guess:
      // wheel value multiplied by found letters
      const gainedScore =
        amount * currentSpinValue;


      setPlayers(previousPlayers =>
        previousPlayers.map((player, index) => {

          if (index !== currentPlayerIndex) {
            return player;
          }

          return {
            ...player,
            score: player.score + gainedScore
          };

        })
      );
    }

    // Store the guessed letter
    const newLetters = [
      ...guessedLetters,
      letter
    ];


    setGuessedLetters(newLetters);


    // Check if all letters have been revealed
    if (
      isPuzzleSolved(
        puzzle,
        newLetters
      )
    ) {
      setGamePhase("won");
      return;
    }

    // Move to the next player after every guess.
    setCurrentPlayerIndex(previousIndex =>
      (previousIndex + 1) % players.length
    );
    setCurrentSpinValue(0);
    setGamePhase("spinning");
  }


  function restartGame() {
    setPlayers([
      {
        id: 1,
        name: "Khaaaan",
        score: 0,
      },
      {
        id: 2,
        name: "Gipsz Jakab",
        score: 0,
      },
      {
        id: 3,
        name: "James T. Krik",
        score: 0,
      },
    ]);
    setCurrentPlayerIndex(0);
    setGuessedLetters([]);
    setCurrentSpinValue(0);
    setGamePhase("spinning");
    setPuzzleData(getRandomPuzzle());
  }

  return {
    players,
    currentPlayer,

    guessedLetters,
    currentSpinValue,
    currentPlayerIndex,

    gamePhase,

    puzzle,
    category,

    setPlayers,
    setGuessedLetters,
    setCurrentSpinValue,
    setGamePhase,

    guessLetter,
    handleSpin,
    restartGame
  };
}