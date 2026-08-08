import { useEffect, useRef, useState } from "react";
import "./Wheel.css";

type WheelResult = { type: "money" | "bankrupt" | "halve" | "double"; value?: number };

type WheelProps = {
  onSpinResult: (result: WheelResult) => void;
  disabled: boolean;
  lastResult?: WheelResult | null;
  autoSpinTrigger?: number | null;
};


const wheelValues = [
  { type: "bankrupt" as const },
  { type: "money" as const, value: 5000 },
  { type: "money" as const, value: 1000 },
  { type: "money" as const, value: 500 },
  { type: "money" as const, value: 300 },
  { type: "money" as const, value: 250 },
  { type: "money" as const, value: 200 },
  { type: "money" as const, value: 150 },
  { type: "money" as const, value: 100 },
  { type: "money" as const, value: 50 },
  { type: "money" as const, value: 10 },
  { type: "halve" as const },
  { type: "double" as const },
];


function Wheel({ onSpinResult, disabled,  autoSpinTrigger }: WheelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastAutoSpin = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        window.clearTimeout(animationRef.current);
      }
    };
  }, []);

  function startSpin(force = false) {
    if ((!force && disabled) || isSpinning) {
      return;
    }

    setIsSpinning(true);

    const finalIndex = Math.floor(Math.random() * wheelValues.length);
    const fullLoops = 2 + Math.floor(Math.random() * 2); // 2 to 3 full loops
    const offset = (finalIndex - selectedIndex + wheelValues.length) % wheelValues.length; // Calculate the offset to reach the final index
    const steps = fullLoops * wheelValues.length + offset; // Total steps to reach the final index

    let currentIndex = selectedIndex;
    let step = 0;

    const tick = () => {
      currentIndex = (currentIndex + 1) % wheelValues.length;
      setSelectedIndex(currentIndex);
      step += 1;

      if (step < steps) {
        const delay = Math.max(
          40,
          55 + step * 3.5 + (step === steps - 1 ? 50 : 0)
        );
        animationRef.current = window.setTimeout(tick, delay);
        return;
      }

      setIsSpinning(false);
      onSpinResult(wheelValues[finalIndex]);
    };

    tick();
  }

  function spinWheel() {
    startSpin(false);
  }

  useEffect(() => {
    if (autoSpinTrigger == null) {
      return;
    }

    if (autoSpinTrigger === lastAutoSpin.current) {
      return;
    }

    lastAutoSpin.current = autoSpinTrigger;
    startSpin(true);
  }, [autoSpinTrigger]);

  return (
    <div className="wheel-container">

        {wheelValues.map((item, index) => {
          const label = item.type === "money" ? `${item.value}` : item.type;

          return (
            <div
              key={`${item.type}-${index}`}
              className={`side-column-item wheel-item ${selectedIndex === index ? "selected" : ""}`}
            >
              {label}
            </div>
          );
        })}

      <button onClick={spinWheel} disabled={disabled || isSpinning}>
        {isSpinning ? "Pörgetés..." : "Pörgetés"}
      </button>


      
    </div>
  );
}


export default Wheel;