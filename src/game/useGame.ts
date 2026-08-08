import { useCallback, useEffect, useRef, useState } from "react";
import type { Player } from "../models/Player";

import {
    countLetter,
  getRandomPuzzle,
  isPuzzleSolved
} from "./gameLogic";

const COMPUTER_BASE_HIT_CHANCE = 0.25;
const COMPUTER_DIFFICULTY_BONUS = 0.05;
const COMPUTER_THINK_DELAY_MS = 1000;
const COMPUTER_LETTERS = [
  "A","Á","B","C","D","E","É",
  "F","G","H","I","Í","J",
  "K","L","M","N","O","Ó",
  "Ö","Ő","P","Q","R","S",
  "T","U","Ú","Ü","Ű",
  "V","W","X","Y","Z"
];


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
      sum: 0,
      computer: false,
      difficulty: 1,
    },
    {
      id: 2,
      name: "Gipsz Jakab",
      score: 0,
      sum: 0,
      computer: true,
      difficulty: 1,
    },
    {
      id: 3,
      name: "Robo Játékos",
      score: 0,
      sum: 0,
      computer: true,
      difficulty: 1,
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

  const aiTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current !== null) {
        window.clearTimeout(turnTimerRef.current);
      }
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
      }
    };
  }, []);

  const scheduleNextTurn = useCallback(() => {
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
  }, [players.length]);

  function getComputerHitChance(difficulty: number) {
    return Math.min(
      1,
      COMPUTER_BASE_HIT_CHANCE + difficulty * COMPUTER_DIFFICULTY_BONUS
    );
  }

  function getUnusedLetters() {
    return COMPUTER_LETTERS.filter(
      letter => !guessedLetters.includes(letter)
    );
  }

  function getMissingLetters() {
    return Array.from(
      new Set(
        puzzle
          .split("")
          .filter(letter => letter !== " " && !guessedLetters.includes(letter))
      )
    );
  }

  function getIncorrectUnusedLetters() {
    return getUnusedLetters().filter(letter => !puzzle.includes(letter));
  }

  function chooseComputerLetter() {
    const missingLetters = getMissingLetters();
    if (missingLetters.length === 0) {
      return null;
    }

    const hitProbability = getComputerHitChance(currentPlayer.difficulty);
    const shouldHit = Math.random() < hitProbability;

    if (shouldHit) {
      return missingLetters[
        Math.floor(Math.random() * missingLetters.length)
      ];
    }

    const incorrectLetters = getIncorrectUnusedLetters();
    if (incorrectLetters.length > 0) {
      return incorrectLetters[
        Math.floor(Math.random() * incorrectLetters.length)
      ];
    }

    const unusedLetters = getUnusedLetters();
    return unusedLetters.length > 0
      ? unusedLetters[Math.floor(Math.random() * unusedLetters.length)]
      : null;
  }

  const handleSpin = useCallback(
    (result: { type: "money" | "bankrupt" | "halve" | "double"; value?: number }) => {
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
    },
    [currentPlayerIndex, scheduleNextTurn]
  );


  const guessLetter = useCallback(
    (letter: string) => {
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
    },
    [currentPlayerIndex, currentSpinValue, gamePhase, guessedLetters, lastSpinResult, players.length, puzzle]
  );

  useEffect(() => {
    if (!currentPlayer.computer) {
      return;
    }

    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (gamePhase === "guessing") {
      aiTimerRef.current = window.setTimeout(() => {
        aiTimerRef.current = null;
        const letter = chooseComputerLetter();
        if (letter) {
          guessLetter(letter);
        }
      }, COMPUTER_THINK_DELAY_MS);
    }

    return () => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [currentPlayerIndex, currentPlayer.computer, currentPlayer.difficulty, gamePhase, guessedLetters, guessLetter]);


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

      const solveBonus = missingLetters.length * 1000;

      setPlayers(previousPlayers =>
        previousPlayers.map((player, index) => {
          if (index !== currentPlayerIndex) {
            return {
              ...player,
              score: 0,
            };
          }

          return {
            ...player,
            sum: player.sum + player.score + solveBonus,
            score: 0,
            difficulty: Math.min(player.difficulty + 1, 13),
          };
        })
      );

      setGuessedLetters([]);
      setCurrentSpinValue(0);
      setLastSpinResult(null);
      setPuzzleData(getRandomPuzzle());
      setGamePhase("spinning");
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
        sum: 0,
        computer: false,
        difficulty: 1,
      },
      {
        id: 2,
        name: "Gipsz Jakab",
        score: 0,
        sum: 0,
        computer: false,
        difficulty: 1,
      },
      {
        id: 3,
        name: "Robo Játékos",
        score: 0,
        sum: 0,
        computer: true,
        difficulty: 1,
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