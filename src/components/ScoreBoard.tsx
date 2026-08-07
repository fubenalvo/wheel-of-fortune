type ScoreBoardProps = {
  score: number;
};

function ScoreBoard({ score }: ScoreBoardProps) {

  return (
    <div>
      Pontszám: {score}
    </div>
  );
}


export default ScoreBoard;