import { useCallback, useEffect, useRef, useState } from "react";
import type { Player } from "../models/Player";

import {
    countLetter,
  getRandomPuzzle,
  isPuzzleSolved
} from "./gameLogic";

const COMPUTER_HIT_CHANCES_BY_DIFFICULTY = [
  0.3, 0.35, 0.4, 0.45, 0.5, 0.55,
  0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9,
];
const COMPUTER_SOLVE_INCREMENT_BASE = 0.005;
const COMPUTER_SOLVE_INCREMENT_MAX = 0.015;
const COMPUTER_THINK_DELAY_MS = 1000;
const COMPUTER_LETTERS = [
  "A","Á","B","C","D","E","É",
  "F","G","H","I","Í","J",
  "K","L","M","N","O","Ó",
  "Ö","Ő","P","Q","R","S",
  "T","U","Ú","Ü","Ű",
  "V","W","X","Y","Z"
];

function createInitialPlayers(): Player[] {
  return [
    {
      id: 1,
      name: "Khaaaan",
      score: 0,
      sum: 0,
      computer: false,
    },
    {
      id: 2,
      name: "Gipsz Jakab",
      score: 0,
      sum: 0,
      computer: true,
    },
    {
      id: 3,
      name: "Robo Játékos",
      score: 0,
      sum: 0,
      computer: true,
    },
  ];
}


type GamePhase =
  | "spinning"
  | "guessing"
  | "waiting"
  | "gameOver"
  | "won";


type GameOverResult = {
  winnerName: string;
  prize: number;
};

export function useGame() {


  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);


  const [currentPlayerIndex, setCurrentPlayerIndex] =
    useState(0);

  const turnTimerRef = useRef<number | null>(null);


  const currentPlayer =
    players[currentPlayerIndex];

  const [difficulty, setDifficulty] = useState(1);

  const [guessedLetters, setGuessedLetters] =
    useState<string[]>([]);


  const [currentSpinValue, setCurrentSpinValue] =
    useState(0);

  const [lastSpinResult, setLastSpinResult] =
    useState<{ type: "money" | "bankrupt" | "halve" | "double"; value?: number } | null>(null);

  const [computerSolveRounds, setComputerSolveRounds] = useState<Record<number, number>>({});

  const [gameOverResult, setGameOverResult] = useState<GameOverResult | null>(null);
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

  const getComputerHitChance = useCallback((difficulty: number) => {
    return COMPUTER_HIT_CHANCES_BY_DIFFICULTY[
      Math.max(0, Math.min(difficulty - 1, COMPUTER_HIT_CHANCES_BY_DIFFICULTY.length - 1))
    ];
  }, []);

  const getComputerSolveChance = useCallback((difficulty: number, round: number) => {
    if (round <= 1) {
      return 0;
    }

    const increment =
      COMPUTER_SOLVE_INCREMENT_BASE +
      ((difficulty - 1) / 12) *
        (COMPUTER_SOLVE_INCREMENT_MAX - COMPUTER_SOLVE_INCREMENT_BASE);

    return Math.min(1, (round - 1) * increment);
  }, []);

  const getComputerSolveRound = useCallback((playerId: number) => {
    return computerSolveRounds[playerId] ?? 0;
  }, [computerSolveRounds]);

  const recordComputerSolveRound = useCallback((playerId: number) => {
    setComputerSolveRounds(previous => ({
      ...previous,
      [playerId]: (previous[playerId] ?? 0) + 1,
    }));
  }, []);

  const getUnusedLetters = useCallback(() => {
    return COMPUTER_LETTERS.filter(
      letter => !guessedLetters.includes(letter)
    );
  }, [guessedLetters]);

  const getMissingLetters = useCallback(() => {
    return Array.from(
      new Set(
        puzzle
          .split("")
          .filter(letter => letter !== " " && !guessedLetters.includes(letter))
      )
    );
  }, [guessedLetters, puzzle]);

  const getIncorrectUnusedLetters = useCallback(() => {
    return getUnusedLetters().filter(letter => !puzzle.includes(letter));
  }, [getUnusedLetters, puzzle]);

  const chooseComputerLetter = useCallback(() => {
    const missingLetters = getMissingLetters();
    if (missingLetters.length === 0) {
      return null;
    }

    const hitProbability = getComputerHitChance(difficulty);
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
  }, [difficulty, getIncorrectUnusedLetters, getMissingLetters, getUnusedLetters, getComputerHitChance]);

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
      let gainedScore = 0;

      if (amount > 0) {
        const isDouble = lastSpinResult?.type === "double";
        const spinValue =
          lastSpinResult?.type === "money"
            ? lastSpinResult.value ?? 0
            : currentSpinValue;

        gainedScore = amount * spinValue;


        setPlayers(previousPlayers =>
          previousPlayers.map((player, index) => {
            if (index !== currentPlayerIndex) {
              return player;
            }

            return {
              ...player,
              score: isDouble ? player.score * 2 : player.score + gainedScore
            };
          })
        );
      }

      const newLetters = [...guessedLetters, letter];
      setGuessedLetters(newLetters);

      if (isPuzzleSolved(puzzle, newLetters)) {
        const roundScore = lastSpinResult?.type === "double"
          ? currentPlayer.score * 2
          : currentPlayer.score + gainedScore;
        const shouldEndGame = currentPlayer.computer || difficulty >= 13;
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
              sum: player.sum + player.score,
              score: 0,
            };
          })
        );
        setDifficulty(previousDifficulty => Math.min(previousDifficulty + 1, 13));

        setGuessedLetters([]);
        setCurrentSpinValue(0);
        setLastSpinResult(null);
        setComputerSolveRounds({});
        if (shouldEndGame) {
          setGameOverResult({
            winnerName: currentPlayer.name,
            prize: currentPlayer.sum + roundScore,
          });
          setGamePhase("gameOver");
          return;
        }
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
    },
    [currentPlayer, currentPlayerIndex, currentSpinValue, difficulty, gamePhase, guessedLetters, lastSpinResult, players.length, puzzle]
  );

  const attemptSolve = useCallback((guess: string) => {
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
      const prize = currentPlayer.sum + currentPlayer.score + solveBonus;
      const shouldEndGame = currentPlayer.computer || difficulty >= 13;


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
          };
        })
      );
      setDifficulty(previousDifficulty => Math.min(previousDifficulty + 1, 13));

      setGuessedLetters([]);
      setCurrentSpinValue(0);
      setLastSpinResult(null);
      setComputerSolveRounds({});
      if (shouldEndGame) {
        setGameOverResult({
          winnerName: currentPlayer.name,
          prize,
        });
        setGamePhase("gameOver");
        return;
      }
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
  }, [currentPlayer, currentPlayerIndex, difficulty, gamePhase, guessedLetters, puzzle, players.length]);

  useEffect(() => {
    if (!currentPlayer.computer) {
      return;
    }

    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    if (gamePhase === "guessing") {
      const currentRound = getComputerSolveRound(currentPlayer.id) + 1;
      const solveChance = getComputerSolveChance(
        difficulty,
        currentRound
      );

      aiTimerRef.current = window.setTimeout(() => {
        aiTimerRef.current = null;
        recordComputerSolveRound(currentPlayer.id);

        if (Math.random() < solveChance) {
          attemptSolve(puzzle);
          return;
        }

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
  }, [currentPlayer.computer, currentPlayer.id, difficulty, gamePhase, guessLetter, getComputerSolveChance, getComputerSolveRound, puzzle, recordComputerSolveRound, chooseComputerLetter, attemptSolve]);

  function restartGame() {
    setPlayers(createInitialPlayers());
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    setCurrentPlayerIndex(0);
    setGuessedLetters([]);
    setCurrentSpinValue(0);
    setLastSpinResult(null);
    setComputerSolveRounds({});
    setGameOverResult(null);
    setDifficulty(1);
    setGamePhase("spinning");
    setPuzzleData(getRandomPuzzle());
  }

  return {
    players,
    currentPlayer,

    guessedLetters,
    currentSpinValue,
    currentPlayerIndex,

    gameOverResult,
    difficulty,
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
