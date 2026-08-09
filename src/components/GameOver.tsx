import "./GameOver.css";

type GameOverProps = {
  winnerName: string;
  prize: number;
};

function GameOver({ winnerName, prize }: GameOverProps) {
  return (
    <div className="game-over" aria-live="polite">
      <h2>Játék vége</h2>
      <p>Gratulálunk {winnerName}, a nyereményed {prize} pont.</p>
    </div>
  );
}

export default GameOver;
