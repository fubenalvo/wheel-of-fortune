import { useEffect, useRef, useState } from "react";
import type { Player } from "../models/Player";

import {
    countLetter,
  getRandomPuzzle,
  isPuzzleSolved
} from "./gameLogic";


type GamePhase =
  | "spinning"
  | "guessing"
  | "waiting"
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

  const turnTimerRef = useRef<number | null>(null);


  const currentPlayer =
    players[currentPlayerIndex];


  const [guessedLetters, setGuessedLetters] =
    useState<string[]>([]);


  const [currentSpinValue, setCurrentSpinValue] =
    useState(0);

  const [lastSpinResult, setLastSpinResult] =
    useState<{ type: "money" | "bankrupt" | "halve" | "double"; value?: number } | null>(null);


  const [gamePhase, setGamePhase] =
    useState<GamePhase>("spinning");


  const [puzzleData, setPuzzleData] =
    useState(() => getRandomPuzzle());


  const puzzle = puzzleData.text;

  const category = puzzleData.category;

  useEffect(() => {
    return () => {
      if (turnTimerRef.current !== null) {
        window.clearTimeout(turnTimerRef.current);
      }
    };
  }, []);

  function scheduleNextTurn() {
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
    }

    setGamePhase("waiting");

    turnTimerRef.current = window.setTimeout(() => {
      turnTimerRef.current = null;
      setCurrentPlayerIndex(previousIndex =>
        (previousIndex + 1) % players.length
      );
      setCurrentSpinValue(0);
      setLastSpinResult(null);
      setGamePhase("spinning");
    }, 3000);
  }


  /*
    Called after the wheel stops spinning.
    The result becomes the value of the next letter guess.
  */
  function handleSpin(result: { type: "money" | "bankrupt" | "halve" | "double"; value?: number }) {
    setLastSpinResult(result);

    if (result.type === "money") {
      setCurrentSpinValue(result.value ?? 0);
      setGamePhase("guessing");
      return;
    }

    if (result.type === "double") {
      setGamePhase("guessing");
      return;
    }

    setPlayers(previousPlayers =>
      previousPlayers.map((player, index) => {
        if (index !== currentPlayerIndex) {
          return player;
        }

        if (result.type === "bankrupt") {
          return {
            ...player,
            score: 0,
          };
        }

        if (result.type === "halve") {
          return {
            ...player,
            score: Math.floor(player.score / 2),
          };
        }

        return player;
      })
    );

    setCurrentSpinValue(0);
    scheduleNextTurn();
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
    if (gamePhase !== "guessing") {
      return;
    }

    if (guessedLetters.includes(letter)) {
      return;
    }

    const amount = countLetter(puzzle, letter);

    if (amount > 0) {
      const spinValue =
        lastSpinResult?.type === "money"
          ? lastSpinResult.value ?? 0
          : currentSpinValue;

      let gainedScore = amount * spinValue;

      if (lastSpinResult?.type === "double") {
        gainedScore *= 2;
      }

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

    const newLetters = [...guessedLetters, letter];
    setGuessedLetters(newLetters);

    if (isPuzzleSolved(puzzle, newLetters)) {
      setGamePhase("won");
      return;
    }

    setCurrentPlayerIndex(previousIndex =>
      (previousIndex + 1) % players.length
    );
    setCurrentSpinValue(0);
    setLastSpinResult(null);
    setGamePhase("spinning");
  }


  function attemptSolve(guess: string) {
    if (gamePhase !== "guessing") {
      return;
    }

    const normalizedGuess = guess
      .trim()
      .toUpperCase();

    const normalizedPuzzle = puzzle.trim().toUpperCase();

    if (normalizedGuess === normalizedPuzzle) {
      const missingLetters = [...puzzle]
        .filter(letter => letter !== " " && !guessedLetters.includes(letter));

      const points = missingLetters.length * 1000;

      if (points > 0) {
        setPlayers(previousPlayers =>
          previousPlayers.map((player, index) => {
            if (index !== currentPlayerIndex) {
              return player;
            }

            return {
              ...player,
              score: player.score + points
            };
          })
        );
      }

      const allLetters = new Set(
        puzzle.split("").filter(letter => letter !== " ")
      );
      setGuessedLetters([...guessedLetters, ...allLetters].filter(
        (letter, index, array) => array.indexOf(letter) === index
      ));
      setGamePhase("won");
      return;
    }

    setCurrentPlayerIndex(previousIndex =>
      (previousIndex + 1) % players.length
    );
    setCurrentSpinValue(0);
    setLastSpinResult(null);
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
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    setCurrentPlayerIndex(0);
    setGuessedLetters([]);
    setCurrentSpinValue(0);
    setLastSpinResult(null);
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
    lastSpinResult,

    puzzle,
    category,

    setPlayers,
    setGuessedLetters,
    setCurrentSpinValue,
    setGamePhase,

    guessLetter,
    attemptSolve,
    handleSpin,
    restartGame
  };
}