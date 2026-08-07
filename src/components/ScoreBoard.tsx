import type { Player } from "../models/Player";

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
            {player.name}: {player.score}
            </div>
        ))}
    </div>
  );
}


export default ScoreBoard;