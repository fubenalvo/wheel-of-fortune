import type { Player } from "../models/Player";
import robotIcon from "../assets/robot.png";

type ScoreBoardProps = {
  currentPlayer: Player;
  players: Player[];
};

function ScoreBoard({ currentPlayer, players }: ScoreBoardProps) {

  return (
    <div className="scoreboard">
      <h2>Score Board</h2>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>név</th>
            <th>pont</th>
            <th>sum</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr
              key={player.id}
              className={player.id === currentPlayer.id ? "current-player" : ""}
            >
              <td>
                {player.name}
                {player.computer && (
                  <img
                    className="player-robot-icon"
                    src={robotIcon}
                    alt="Robot player"
                  />
                )}
              </td>
              <td>{player.score}</td>
              <td>{player.sum}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default ScoreBoard;