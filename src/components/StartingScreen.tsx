import robotIcon from "../assets/robot.png";
import type { Player } from "../models/Player";


type StartingScreenProps = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
};


const COMPUTER_NAMES = [
  "Gipsz Jakab",
  "James T. Kirk",
  "Khaaaan",
  "Dart Vödör",
  "Doggo",
  "Grumpy Cat",
  "Master Chief",
  "Leeroy Jenkins",
  "Dr. Genya",
  "RAMbo",
  "Chuck Norris",
  "Soft Snake",
];


function getRandomComputerName() {
  return COMPUTER_NAMES[
    Math.floor(Math.random() * COMPUTER_NAMES.length)
  ];
}


function StartingScreen({
  players,
  setPlayers
}: StartingScreenProps) {

  function handleNameChange(
    playerId: number,
    name: string
  ) {
    setPlayers(previousPlayers =>
      previousPlayers.map(player =>
        player.id === playerId
          ? {
              ...player,
              name,
              computer: false
            }
          : player
      )
    );
  }


  function handleComputerChange(
    playerId: number,
    isComputer: boolean
  ) {
    setPlayers(previousPlayers =>
      previousPlayers.map(player =>
        player.id === playerId
          ? {
              ...player,
              computer: isComputer,
              name: isComputer
                ? getRandomComputerName()
                : player.name
            }
          : player
      )
    );
  }


  return (
    <div className="starting-screen puzzle-positioner">
      <div className="puzzle-positioner-helper">

        {players.map((player, index) => (
          <div
            className="starting-screen-player"
            key={player.id}
          >
            {index + 1}.

            <input
              maxLength={15}
              type="text"
              value={player.name}
              disabled={player.computer}
              onChange={event =>
                handleNameChange(
                  player.id,
                  event.target.value
                )
              }
              placeholder="Játékos neve"
            />

            &nbsp;

            <img
              className="player-robot-icon"
              src={robotIcon}
              alt="Robot player"
            />

            <input
              type="checkbox"
              checked={player.computer}
              onChange={event =>
                handleComputerChange(
                  player.id,
                  event.target.checked
                )
              }
            />
          </div>
        ))}

      </div>
    </div>
  );
}


export default StartingScreen;