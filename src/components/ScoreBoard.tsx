import type { Player } from "../models/Player";
import robotIcon from "../assets/robot.png";

type ScoreBoardProps = {
  currentPlayer: Player;
  players: Player[];
};

function ScoreBoard({ currentPlayer, players }: ScoreBoardProps) {

  return (
    <div>
        <h2>Score Board</h2>
        {players.map((player) => (
            <div className={player.id === currentPlayer.id ? "current-player" : ""} key={player.id}>
              {player.computer && (
                <img
                  className="player-robot-icon"
                  src={robotIcon}
                  alt="Robot player"
                />
              )}
              {player.name}
              : {player.score}
            </div>
        ))}
    </div>
  );
}


export default ScoreBoard;