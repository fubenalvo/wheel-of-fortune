import { useCallback, useEffect, useRef, useState } from "react";
import type { Player } from "../models/Player";

import {
  countLetter,
  getRandomPuzzle,
  isPuzzleSolved
} from "./gameLogic";

/*
 * A számítógépes játékosok találati esélye nehézségi szintenként.
 *
 * A difficulty 1-től 13-ig terjed, ezért minden szinthez
 * külön valószínűséget tárolunk.
 */
const COMPUTER_HIT_CHANCES_BY_DIFFICULTY = [
  0.3, 0.35, 0.4, 0.45, 0.5, 0.55,
  0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9,
];

/*
 * A számítógép megfejtési esélyének növekedése.
 *
 * A gép az első körökben még nem próbálja megfejteni
 * a rejtvényt, később viszont minden körrel nő az esélye.
 */
const COMPUTER_SOLVE_INCREMENT_BASE = 0.005;
const COMPUTER_SOLVE_INCREMENT_MAX = 0.015;

/*
 * Ennyi időt "gondolkodik" a számítógépes játékos
 * két lépés között.
 */
const COMPUTER_THINK_DELAY_MS = 1000;

/*
 * A számítógép által használható betűk.
 *
 * Az ékezetes magyar betűk is külön szerepelnek, mert
 * a puzzle szövegeiben ezek önálló karakterek.
 */
const COMPUTER_LETTERS = [
  "A", "Á", "B", "C", "D", "E", "É",
  "F", "G", "H", "I", "Í", "J",
  "K", "L", "M", "N", "O", "Ó",
  "Ö", "Ő", "P", "Q", "R", "S",
  "T", "U", "Ú", "Ü", "Ű",
  "V", "W", "X", "Y", "Z"
];

/*
 * A számítógép extra találati esélye a puzzle
 * hátralévő betűinek száma alapján.
 *
 * 3 hiányzó betű: +10%
 * 2 hiányzó betű: +30%
 * 1 hiányzó betű: +60%
 */
const COMPUTER_HIT_BONUS_BY_MISSING_LETTERS = {
  3: 0.10,
  2: 0.30,
  1: 0.60,
};


/*
 * Létrehozza a játék alapértelmezett játékosait.
 *
 * Az első játékos a valódi játékos,
 * a második és harmadik pedig számítógép által vezérelt.
 */
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


/*
 * A játék aktuális állapotának fő fázisai.
 *
 * spinning  - a játékos pörgethet
 * guessing  - betűt tippelhet / megfejtheti a puzzle-t
 * waiting   - két kör között várakozás
 * gameOver  - a játék véget ért
 * won       - jelenleg nincs használva, de később használható
 */
type GamePhase =
  | "starting"
  | "spinning"
  | "guessing"
  | "waiting"
  | "gameOver"
  | "won";


/*
 * A játék végét összefoglaló adatok.
 */
type GameOverResult = {
  winnerName: string;
  prize: number;
};


export function useGame() {

  /*
   * A játékosok teljes állapota.
   */
  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);

  /*
   * Az aktuális játékos indexe a players tömbben.
   */
  const [currentPlayerIndex, setCurrentPlayerIndex] =
    useState(0);

  /*
   * Timer referencia a következő játékosra váltáshoz.
   */
  const turnTimerRef = useRef<number | null>(null);

  /*
   * Az aktuális játékos kényelmi változóként.
   */
  const currentPlayer =
    players[currentPlayerIndex];

  /*
   * Az aktuális nehézségi szint.
   */
  const [difficulty, setDifficulty] = useState(1);

  /*
   * Az eddig már megtippelt betűk listája.
   */
  const [guessedLetters, setGuessedLetters] =
    useState<string[]>([]);

  /*
   * Az aktuális pörgetésből származó pénzérték.
   */
  const [currentSpinValue, setCurrentSpinValue] =
    useState(0);

  /*
   * Az előző pörgetés eredménye.
   *
   * A value csak pénznyeremény esetén releváns.
   */
  const [lastSpinResult, setLastSpinResult] =
    useState<{
      type: "money" | "bankrupt" | "halve" | "double";
      value?: number;
    } | null>(null);

  /*
   * Megjegyzi, hogy az egyes számítógépes játékosok
   * hány alkalommal próbáltak már megoldást adni
   * az aktuális puzzle során.
   *
   * Például:
   * {
   *   2: 3,
   *   3: 1
   * }
   */
  const [computerSolveRounds, setComputerSolveRounds] =
    useState<Record<number, number>>({});

  /*
   * A játék végeredménye.
   */
  const [gameOverResult, setGameOverResult] =
    useState<GameOverResult | null>(null);

  /*
   * A játék aktuális fázisa.
   */
  const [gamePhase, setGamePhase] =
    useState<GamePhase>("starting");


  /*
   * Az aktuális puzzle.
   *
   * Inicializáláskor rögtön választunk egy véletlenszerűt.
   */
  const [puzzleData, setPuzzleData] =
    useState(() => getRandomPuzzle());

  /*
   * A puzzle szövege és kategóriája külön változóként,
   * hogy kényelmesebb legyen használni őket.
   */
  const puzzle = puzzleData.text;
  const category = puzzleData.category;


  /*
   * Timer a számítógépes játékos gondolkodásához.
   */
  const aiTimerRef = useRef<number | null>(null);


  /*
   * Komponens megszűnésekor minden futó timer törlése.
   *
   * Ez fontos, mert különben egy már nem létező komponens
   * állapotát próbálnánk később módosítani.
   */
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


  /*
   * Elindítja a következő játékosra váltást.
   *
   * Először waiting állapotba kerülünk, majd 3 másodperc
   * után ténylegesen átváltunk a következő játékosra.
   */
  const scheduleNextTurn = useCallback(() => {

    // Ha már futott egy timer, töröljük.
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
    }

    setGamePhase("waiting");

    turnTimerRef.current = window.setTimeout(() => {
      turnTimerRef.current = null;

      // Körbe lépkedünk a játékosokon.
      setCurrentPlayerIndex(previousIndex =>
        (previousIndex + 1) % players.length
      );

      // Az új játékos még nem pörgetett.
      setCurrentSpinValue(0);
      setLastSpinResult(null);

      setGamePhase("spinning");
    }, 3000);

  }, [players.length]);


  /*
   * Meghatározza, hogy az adott nehézségi szinten
   * mekkora eséllyel talál el a számítógép egy helyes betűt.
   */
  const getComputerHitChance = useCallback(
    (difficulty: number) => {

      // Biztosítjuk, hogy a difficulty értéke
      // a tömb érvényes indexére essen.
      return COMPUTER_HIT_CHANCES_BY_DIFFICULTY[
        Math.max(
          0,
          Math.min(
            difficulty - 1,
            COMPUTER_HIT_CHANCES_BY_DIFFICULTY.length - 1
          )
        )
      ];
    },
    []
  );


  /*
   * Meghatározza, hogy a számítógép mekkora eséllyel
   * próbálja meg egyáltalán megfejteni a teljes puzzle-t.
   *
   * Az első körben még 0 az esély.
   * Ezután a próbálkozások számával fokozatosan nő.
   */
  const getComputerSolveChance = useCallback(
    (difficulty: number, round: number) => {

      // Az első próbálkozáskor még nem próbál megfejteni.
      if (round <= 1) {
        return 0;
      }

      /*
       * A nehézségi szint befolyásolja, hogy milyen gyorsan
       * növekszik a megfejtési esély.
       */
      const increment =
        COMPUTER_SOLVE_INCREMENT_BASE +
        ((difficulty - 1) / 12) *
          (
            COMPUTER_SOLVE_INCREMENT_MAX -
            COMPUTER_SOLVE_INCREMENT_BASE
          );

      /*
       * A round - 1 azért kell, mert az első körben
       * még 0 volt az esély.
       *
       * Az Math.min biztosítja, hogy az esély ne menjen 100% fölé.
       */
      return Math.min(1, (round - 1) * increment);
    },
    []
  );


  /*
   * Lekéri, hogy az adott számítógépes játékos
   * hányadik megoldási körnél tart.
   */
  const getComputerSolveRound = useCallback(
    (playerId: number) => {
      return computerSolveRounds[playerId] ?? 0;
    },
    [computerSolveRounds]
  );


  /*
   * Egy számítógépes játékos következő megoldási
   * próbálkozását rögzíti.
   */
  const recordComputerSolveRound = useCallback(
    (playerId: number) => {
      setComputerSolveRounds(previous => ({
        ...previous,
        [playerId]: (previous[playerId] ?? 0) + 1,
      }));
    },
    []
  );


  /*
   * Megkeresi az összes olyan betűt, amelyet még
   * nem tippeltek meg.
   */
  const getUnusedLetters = useCallback(() => {
    return COMPUTER_LETTERS.filter(
      letter => !guessedLetters.includes(letter)
    );
  }, [guessedLetters]);


  /*
   * Megkeresi a puzzle-ben található, de még
   * ki nem talált betűket.
   *
   * A Set miatt minden betű csak egyszer szerepel.
   */
  const getMissingLetters = useCallback(() => {
    return Array.from(
      new Set(
        puzzle
          .split("")
          .filter(
            letter =>
              letter !== " " &&
              !guessedLetters.includes(letter)
          )
      )
    );
  }, [guessedLetters, puzzle]);


  /*
   * Megkeresi azokat a még nem használt betűket,
   * amelyek biztosan rossz tippek.
   *
   * Ezeket használhatja a számítógép, ha éppen
   * nem talál el helyes betűt.
   */
  const getIncorrectUnusedLetters = useCallback(() => {
    return getUnusedLetters().filter(
      letter => !puzzle.includes(letter)
    );
  }, [getUnusedLetters, puzzle]);


  /*
   * Kiválasztja, hogy a számítógép melyik betűt tippelje.
   */
  const chooseComputerLetter = useCallback(() => {

    const missingLetters = getMissingLetters();

    // Ha már nincs hiányzó betű, nincs mit tippelni.
    if (missingLetters.length === 0) {
      return null;
    }

    /*
     * Először eldöntjük, hogy a gép sikeres tippet akar-e.
     */
    const baseHitProbability =
      getComputerHitChance(difficulty);

    const hitBonus =
      COMPUTER_HIT_BONUS_BY_MISSING_LETTERS[
        missingLetters.length as 1 | 2 | 3
      ] ?? 0;

    const hitProbability = Math.min(
      1,
      baseHitProbability + hitBonus
    );

    const shouldHit = Math.random() < hitProbability;

    if (shouldHit) {

      // Véletlenszerű helyes betű választása.
      return missingLetters[
        Math.floor(
          Math.random() * missingLetters.length
        )
      ];
    }


    /*
     * Ha nem akar helyes betűt találni,
     * először próbálunk egy olyan betűt választani,
     * amely biztosan nincs a puzzle-ben.
     */
    const incorrectLetters =
      getIncorrectUnusedLetters();

    if (incorrectLetters.length > 0) {
      return incorrectLetters[
        Math.floor(
          Math.random() * incorrectLetters.length
        )
      ];
    }


    /*
     * Végső esetben bármelyik még nem használt
     * betűből választunk.
     */
    const unusedLetters = getUnusedLetters();

    return unusedLetters.length > 0
      ? unusedLetters[
          Math.floor(
            Math.random() * unusedLetters.length
          )
        ]
      : null;

  }, [
    difficulty,
    getIncorrectUnusedLetters,
    getMissingLetters,
    getUnusedLetters,
    getComputerHitChance
  ]);


  /*
   * Feldolgozza a kerék/pörgetés eredményét.
   */
  const handleSpin = useCallback(
    (
      result: {
        type:
          | "money"
          | "bankrupt"
          | "halve"
          | "double";
        value?: number;
      }
    ) => {

      setLastSpinResult(result);


      /*
       * Normál pénznyeremény:
       * eltároljuk az értéket és mehet a betűtippelés.
       */
      if (result.type === "money") {
        setCurrentSpinValue(result.value ?? 0);
        setGamePhase("guessing");
        return;
      }


      /*
       * Duplázó mező:
       * nincs konkrét pénzérték, ezért csak guessing állapotba
       * lépünk.
       */
      if (result.type === "double") {
        setGamePhase("guessing");
        return;
      }


      /*
       * A bankrupt és halve esetén módosítjuk
       * az aktuális játékos pontszámát.
       */
      setPlayers(previousPlayers =>
        previousPlayers.map((player, index) => {

          // A többi játékoshoz nem nyúlunk.
          if (index !== currentPlayerIndex) {
            return player;
          }


          // Csőd: az aktuális kör pontszáma lenullázódik.
          if (result.type === "bankrupt") {
            return {
              ...player,
              score: 0,
            };
          }


          // Felező mező: az aktuális pontszám felére csökken.
          if (result.type === "halve") {
            return {
              ...player,
              score: Math.floor(player.score / 2),
            };
          }

          return player;
        })
      );


      // Ezek után a következő játékos jön.
      setCurrentSpinValue(0);
      scheduleNextTurn();

    },
    [currentPlayerIndex, scheduleNextTurn]
  );


  /*
   * Egy betű tippelésének teljes játékmenetét kezeli.
   */
  const guessLetter = useCallback(
    (letter: string) => {

      /*
       * Csak guessing állapotban lehet betűt tippelni.
       */
      if (gamePhase !== "guessing") {
        return;
      }


      /*
       * Egy betűt csak egyszer lehet megtippelni.
       */
      if (guessedLetters.includes(letter)) {
        return;
      }


      /*
       * Megszámoljuk, hányszor szerepel a betű a puzzle-ben.
       */
      const amount = countLetter(puzzle, letter);

      let gainedScore = 0;


      /*
       * Ha van találat, kiszámoljuk a megszerzett pontot.
       */
      if (amount > 0) {

        const isDouble =
          lastSpinResult?.type === "double";

        /*
         * Normál esetben a pörgetett pénzértékből számolunk.
         */
        const spinValue =
          lastSpinResult?.type === "money"
            ? lastSpinResult.value ?? 0
            : currentSpinValue;

        gainedScore = amount * spinValue;


        /*
         * Frissítjük az aktuális játékos pontszámát.
         */
        setPlayers(previousPlayers =>
          previousPlayers.map((player, index) => {

            if (index !== currentPlayerIndex) {
              return player;
            }

            return {
              ...player,

              /*
               * Duplázás esetén a teljes aktuális score duplázódik.
               * Egyébként a most szerzett pontot hozzáadjuk.
               */
              score: isDouble
                ? player.score * 2
                : player.score + gainedScore
            };
          })
        );
      }


      /*
       * Az új betű bekerül a megtippelt betűk közé.
       */
      const newLetters = [
        ...guessedLetters,
        letter
      ];

      setGuessedLetters(newLetters);


      /*
       * Megnézzük, hogy a puzzle ezzel a tippel
       * teljesen megfejtődött-e.
       */
      if (isPuzzleSolved(puzzle, newLetters)) {

        /*
         * Meghatározzuk az aktuális körben elért pontot.
         */
        const roundScore =
          lastSpinResult?.type === "double"
            ? currentPlayer.score * 2
            : currentPlayer.score + gainedScore;


        /*
         * A játék véget ér, ha:
         *
         * - számítógép nyeri a kört
         * - vagy elértük a 13-as nehézségi szintet
         */
        const shouldEndGame =
          currentPlayer.computer ||
          difficulty >= 13;


        /*
         * Minden játékos aktuális score-ja nullázódik,
         * de a győztes a saját score-ját hozzáadja
         * az összesített eredményéhez.
         */
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

              // A kör pontszáma bekerül az összesített pénzbe.
              sum: player.sum + player.score,

              // Új kör kezdődik, ezért a körpontszám nullázódik.
              score: 0,
            };
          })
        );


        /*
         * A következő puzzle nehézségi szintje eggyel nő,
         * maximum 13-ig.
         */
        setDifficulty(previousDifficulty =>
          Math.min(previousDifficulty + 1, 13)
        );


        /*
         * Az új puzzle-höz minden betűtipp törlődik.
         */
        setGuessedLetters([]);
        setCurrentSpinValue(0);
        setLastSpinResult(null);

        /*
         * Az AI megfejtési körszámlálója is újraindul.
         */
        setComputerSolveRounds({});


        /*
         * Ha véget ért a játék, eltároljuk a győztest
         * és a nyereményét.
         */
        if (shouldEndGame) {

          setGameOverResult({
            winnerName: currentPlayer.name,
            prize: currentPlayer.sum + roundScore,
          });

          setGamePhase("gameOver");
          return;
        }


        /*
         * Ha még nincs vége a játéknak,
         * új puzzle-t választunk.
         */
        setPuzzleData(getRandomPuzzle());
        setGamePhase("spinning");
        return;
      }


      /*
      * Ha helyes volt a betű, ugyanaz a játékos
      * folytathatja a játékot és újra pörgethet.
      */
      if (amount > 0) {
        setCurrentSpinValue(0);
        setLastSpinResult(null);
        setGamePhase("spinning");
        return;
      }

      /*
      * Ha rossz volt a betű, a következő játékos jön.
      */
      setCurrentPlayerIndex(previousIndex =>
        (previousIndex + 1) % players.length
      );
      setCurrentSpinValue(0);
      setLastSpinResult(null);
      setGamePhase("spinning");

    },
    [
      currentPlayer,
      currentPlayerIndex,
      currentSpinValue,
      difficulty,
      gamePhase,
      guessedLetters,
      lastSpinResult,
      players.length,
      puzzle
    ]
  );


  /*
   * A teljes puzzle közvetlen megfejtésének kezelése.
   */
  const attemptSolve = useCallback(
    (guess: string) => {

      // Csak guessing állapotban lehet megfejteni.
      if (gamePhase !== "guessing") {
        return;
      }


      /*
       * A játékos inputját és a puzzle-t is
       * megtisztítjuk és nagybetűsítjük,
       * hogy a kis-/nagybetű ne számítson.
       */
      const normalizedGuess = guess
        .trim()
        .toUpperCase();

      const normalizedPuzzle = puzzle
        .trim()
        .toUpperCase();


      /*
       * Ha pontosan egyeznek, sikeres megfejtés történt.
       */
      if (normalizedGuess === normalizedPuzzle) {

        /*
         * Megkeressük a még ki nem talált betűket.
         *
         * Minden ilyen betű után 1000 pont jár.
         */
        const missingLetters = [...puzzle]
          .filter(
            letter =>
              letter !== " " &&
              !guessedLetters.includes(letter)
          );

        const solveBonus =
          missingLetters.length * 1000;


        /*
         * A teljes nyeremény:
         *
         * eddigi összesített pénz
         * + aktuális kör pontszáma
         * + megfejtési bónusz
         */
        const prize =
          currentPlayer.sum +
          currentPlayer.score +
          solveBonus;


        /*
         * Számítógép győzelme vagy 13-as nehézségi szint
         * esetén véget ér a játék.
         */
        const shouldEndGame =
          currentPlayer.computer ||
          difficulty >= 13;


        /*
         * Az aktuális kör eredményét hozzáadjuk
         * az összesített pénzhez.
         */
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

              sum:
                player.sum +
                player.score +
                solveBonus,

              score: 0,
            };
          })
        );


        /*
         * Növeljük a nehézségi szintet.
         */
        setDifficulty(previousDifficulty =>
          Math.min(previousDifficulty + 1, 13)
        );


        // Új puzzle előtt minden körhöz kapcsolódó állapot törlése.
        setGuessedLetters([]);
        setCurrentSpinValue(0);
        setLastSpinResult(null);
        setComputerSolveRounds({});


        /*
         * Ha ez volt az utolsó kör, game over.
         */
        if (shouldEndGame) {

          setGameOverResult({
            winnerName: currentPlayer.name,
            prize,
          });

          setGamePhase("gameOver");
          return;
        }


        /*
         * Ellenkező esetben új puzzle indul.
         */
        setPuzzleData(getRandomPuzzle());
        setGamePhase("spinning");
        return;
      }


      /*
       * Hibás megfejtés esetén a következő játékos jön.
       */
      setCurrentPlayerIndex(previousIndex =>
        (previousIndex + 1) % players.length
      );

      setCurrentSpinValue(0);
      setLastSpinResult(null);
      setGamePhase("spinning");
    },
    [
      currentPlayer,
      currentPlayerIndex,
      difficulty,
      gamePhase,
      guessedLetters,
      puzzle,
      players.length
    ]
  );


  /*
   * A számítógépes játékosok automatikus működését kezeli.
   *
   * Amikor egy computer játékos kerül sorra:
   *
   * 1. vár 1 másodpercet
   * 2. eldönti, hogy megfejti-e a puzzle-t
   * 3. ha nem, betűt választ
   * 4. végrehajtja a tippet
   */
  useEffect(() => {

    /*
     * Ha emberi játékos van soron, nincs AI teendő.
     */
    if (!currentPlayer.computer) {
      return;
    }


    /*
     * Ha esetleg már van futó AI timer,
     * azt töröljük.
     */
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }


    /*
     * A számítógép csak guessing fázisban cselekszik.
     */
    if (gamePhase === "guessing") {

      /*
       * Lekérjük a jelenlegi AI körszámot.
       */
      const currentRound =
        getComputerSolveRound(currentPlayer.id) + 1;


      /*
       * Meghatározzuk, hogy ebben a körben
       * mekkora eséllyel próbálja megfejteni a puzzle-t.
       */
      const solveChance =
        getComputerSolveChance(
          difficulty,
          currentRound
        );


      /*
       * A gép nem azonnal reagál, hanem "gondolkodik".
       */
      aiTimerRef.current = window.setTimeout(() => {

        aiTimerRef.current = null;

        /*
         * Rögzítjük, hogy ez volt a következő AI próbálkozás.
         */
        recordComputerSolveRound(currentPlayer.id);


        /*
         * Először megpróbálhatja egyből megfejteni
         * a teljes puzzle-t.
         */
        if (Math.random() < solveChance) {
          attemptSolve(puzzle);
          return;
        }


        /*
         * Ha nem próbálja megfejteni,
         * választ egy betűt.
         */
        const letter = chooseComputerLetter();

        if (letter) {
          guessLetter(letter);
        }

      }, COMPUTER_THINK_DELAY_MS);
    }


    /*
     * Cleanup:
     * ha megváltozik a játékos/fázis/puzzle,
     * a korábbi AI timer ne fusson tovább.
     */
    return () => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };

  }, [
    currentPlayer.computer,
    currentPlayer.id,
    difficulty,
    gamePhase,
    guessLetter,
    getComputerSolveChance,
    getComputerSolveRound,
    puzzle,
    recordComputerSolveRound,
    chooseComputerLetter,
    attemptSolve
  ]);


  /*
   * Teljes játék újraindítása.
   *
   * Minden játékhoz kapcsolódó state visszaáll
   * a kezdeti állapotba.
   */
  function restartGame() {

    // Játékosok alaphelyzetbe állítása.
    // setPlayers(createInitialPlayers());


    // Futó körváltó timer törlése.
    if (turnTimerRef.current !== null) {
      window.clearTimeout(turnTimerRef.current);
      turnTimerRef.current = null;
    }


    // Minden játékállapot alaphelyzetbe állítása.
    setCurrentPlayerIndex(0);
    setGuessedLetters([]);
    setCurrentSpinValue(0);
    setLastSpinResult(null);
    setComputerSolveRounds({});
    setGameOverResult(null);
    setDifficulty(1);
    setGamePhase("spinning");

    // Új véletlenszerű puzzle.
    setPuzzleData(getRandomPuzzle());
  }


  /*
   * A hookból elérhetővé tett adatok és függvények.
   *
   * A komponensek ezeket használhatják a játék UI-jának
   * megjelenítésére és a játékos interakcióinak kezelésére.
   */
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