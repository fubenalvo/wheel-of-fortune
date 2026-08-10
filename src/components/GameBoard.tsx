import { useEffect, useState } from "react";
import { useGame } from "../game/useGame";
import { useAudio } from "../components/AudioProvider";

import Keyboard from "./Keyboard";
import Puzzle from "./Puzzle";
import GameOver from "./GameOver";
import ScoreBoard from "./ScoreBoard";
import Wheel from "./Wheel";
import StartingScreen from "./StartingScreen";

function GameBoard() {
  const [solveGuess, setSolveGuess] = useState("");
  const [manualSpinRequest, setManualSpinRequest] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    isMuted,
    isMusicMuted,
    toggleMute,
    toggleMusic,
    playBeep,
  } = useAudio();

  const {
    players,
    currentPlayer,
    guessedLetters,
    currentSpinValue,
    gamePhase,
    difficulty,
    puzzle,
    gameOverResult,
    category,
    guessLetter,
    attemptSolve,
    handleSpin,
    restartGame,
    lastSpinResult,
    setPlayers
  } = useGame();

  const difficultyLevels = [
    "Analfabéta",
    "Pancser",
    "Kontár",
    "Amatőr",
    "Kezdő",
    "Haladó",
    "Rutinos",
    "No csak",
    "Profi",
    "Zseni",
    "Genius",
    "Einstein",
    "Mint én",
  ];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Handle Enter and Space as game action buttons
      if (event.key === "Enter") {
        event.preventDefault();

        // Start a new game
        if (
          (gamePhase === "gameOver" ||
            gamePhase === "won" ||
            gamePhase === "starting") &&
          !currentPlayer.computer
        ) {
          restartGame();
          playBeep();
          return;
        }

        // Spin the wheel
        if (
          gamePhase === "spinning" &&
          !currentPlayer.computer
        ) {
          setManualSpinRequest(true);
          playBeep();
          return;
        }

        // Solve the puzzle
        if (
          gamePhase === "guessing" &&
          !currentPlayer.computer &&
          solveGuess.trim()
        ) {
          attemptSolve(solveGuess);
          setSolveGuess("");
          playBeep();
          return;
        }

        return;
      }

      // Ignore keyboard shortcuts when typing into a form field
      const target = event.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // Only handle single-character keyboard input
      if (event.key.length !== 1) {
        return;
      }

      // Convert the input to uppercase so lowercase keys work as well
      const letter = event.key.toUpperCase();

      // Only allow letters used by the game's keyboard
      const validLetters = [
        "A", "Á", "B", "C", "D", "E", "É",
        "F", "G", "H", "I", "Í", "J",
        "K", "L", "M", "N", "O", "Ó",
        "Ö", "Ő", "P", "Q", "R", "S",
        "T", "U", "Ú", "Ü", "Ű",
        "V", "W", "X", "Y", "Z"
      ];

      if (!validLetters.includes(letter)) {
        return;
      }

      // Use the same logic as clicking a letter on the on-screen keyboard
      guessLetter(letter);
      playBeep();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    guessLetter,
    gamePhase,
    currentPlayer.computer,
    solveGuess,
    attemptSolve,
    restartGame,
    playBeep
  ]);

  function handleSolve() {
    attemptSolve(solveGuess);
    setSolveGuess("");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }  

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);  

  const shouldAutoSpin =
    currentPlayer.computer && gamePhase === "spinning";

  const displayedDifficulty = Math.min(
    Math.max(difficulty, 1),
    difficultyLevels.length
  );

  return (
    <div className="game-board">

      <div className="side-column left-column">
        <Wheel
          onSpinResult={handleSpin}
          disabled={
            gamePhase !== "spinning" ||
            currentPlayer.computer
          }
          lastResult={lastSpinResult}
          autoSpin={shouldAutoSpin}
          manualSpinRequest={manualSpinRequest}
          onManualSpinConsumed={() => setManualSpinRequest(false)}
          onSpinningChange={setIsWheelSpinning}
          showButton={false}
        />
      </div>

      <div className="main-column">

        <div className="main-column-left">

          {gamePhase !== "gameOver" && (
            <h1 className="logo">
              szerencsekerék
            </h1>
          )}

          {gamePhase === "starting" && (
            <StartingScreen
              players={players}
              setPlayers={setPlayers}
            />
          )}

          {gamePhase !== "starting" && (
            <div className="puzzle-positioner">
              <div className="puzzle-positioner-helper">

                {gamePhase === "gameOver" && gameOverResult ? (
                  <GameOver
                    players={players}
                  />
                ) : null}

                {gamePhase !== "gameOver" && (
                  <>
                    <p className="puzzle-category">
                      Kategória: {category}
                    </p>

                    <Puzzle
                      word={puzzle}
                      guessedLetters={guessedLetters}
                    />
                  </>
                )}

              </div>
            </div>
          )}

        </div>

        <div className="main-column-right">

          {/* Audio toggle above the player list */}
          <div className="audio-toggle">
            <button onClick={toggleMute}>
              {isMuted ? "Hangok BE" : "Hangok KI"}
            </button>
            &nbsp;
            <button onClick={toggleMusic}>
              {isMusicMuted ? "Zene BE" : "Zene KI"}
            </button>
            &nbsp;
            <button className="fullscreen-button" onClick={toggleFullscreen}>
              {isFullscreen ? ".": "."}
            </button>            
            <br/>
          </div>

          <ScoreBoard
            currentPlayer={currentPlayer}
            players={players}
          />

        </div>

        <div className="keyboard-letters">

          {gamePhase !== "won" &&
            gamePhase !== "waiting" &&
            gamePhase !== "gameOver" && (
              <Keyboard
                onLetterClick={guessLetter}
                usedLetters={guessedLetters}

                // Disable keyboard until the wheel has been spun or if the computer is playing
                disabled={
                  gamePhase !== "guessing" ||
                  currentPlayer.computer
                }
              />
            )}

        </div>

        <div className="bottom-info">

          {gamePhase === "spinning" &&
            !currentPlayer.computer && (
              <div className="spin-action">
                <button
                  className="spin-button"
                  disabled={isWheelSpinning}
                  onClick={() => {
                    playBeep();
                    setManualSpinRequest(true);
                  }}
                >
                  {isWheelSpinning
                    ? "Pörgetés..."
                    : "Pörgetés"}
                </button>
              </div>
            )}

          {gamePhase === "guessing" &&
            !currentPlayer.computer && (
              <div className="solve-guess">
                <input
                  type="text"
                  value={solveGuess}
                  onChange={event =>
                    setSolveGuess(event.target.value)
                  }
                  placeholder="Írd be a megfejtést"
                />

                <button
                  onClick={() => {
                    playBeep();
                    handleSolve();
                  }}
                  disabled={!solveGuess.trim()}
                >
                  Megfejtés
                </button>
              </div>
            )}

          <div>

            {gamePhase === "gameOver" && (
              <div className="spin-action">
                <button
                  className="spin-button"
                  onClick={() => {
                    playBeep();
                    restartGame();
                  }}
                >
                  Új játék
                </button>
              </div>
            )}

            {gamePhase === "starting" && (
              <div className="spin-action">
                <button
                  className="spin-button"
                  onClick={() => {
                    playBeep();
                    restartGame();
                  }}
                >
                  Új játék
                </button>
              </div>
            )}

          </div>

          {gamePhase === "won" && (
            <div>
              <h2>Vége a körnek!</h2>

              <button
                onClick={() => {
                  playBeep();
                  restartGame();
                }}
              >
                Új játék
              </button>
            </div>
          )}

        </div>
      </div>

      <div className="side-column right-column difficulty-sidebar">

        {difficultyLevels.map((label, index) => {
          const level = index + 1;

          return (
            <div
              key={label}
              className={`side-column-item level-${level} ${
                displayedDifficulty === level
                  ? "selected"
                  : ""
              }`}
            >
              {label}
            </div>
          );
        })}

      </div>

      <div className="debug-phase">
        Game phase:
        {" "}
        {gamePhase}
        |
        Current spin value:
        {" "}
        {currentSpinValue}
      </div>

    </div>
  );
}

export default GameBoard;