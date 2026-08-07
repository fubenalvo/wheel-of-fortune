type WheelProps = {
  onSpinResult: (value: number) => void;
};


const wheelValues = [
  100,
  200,
  300,
  500,
  1000,
  2000,
  0
];


function Wheel({ onSpinResult }: WheelProps) {

  function spinWheel() {

    const randomIndex = Math.floor(
      Math.random() * wheelValues.length
    );

    const result = wheelValues[randomIndex];

    onSpinResult(result);
  }


  return (
    <div>
      <h2>🎡 Kerék</h2>

      <button onClick={spinWheel}>
        Pörgetés
      </button>
    </div>
  );
}


export default Wheel;