import { useCallback, useEffect, useRef, useState } from "react";
import "./Wheel.css";

type WheelResult = { type: "money" | "bankrupt" | "halve" | "double"; value?: number };

type WheelProps = {
  onSpinResult: (result: WheelResult) => void;
  disabled: boolean;
  lastResult?: WheelResult | null;
  autoSpin?: boolean;
  manualSpinRequest?: boolean;
  onManualSpinConsumed?: () => void;
  showButton?: boolean;
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


function Wheel({
  onSpinResult,
  disabled,
  autoSpin = false,
  manualSpinRequest = false,
  onManualSpinConsumed,
  showButton = true,
}: WheelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const animationRef = useRef<number | null>(null);
  const autoSpinHandledRef = useRef(false);
  const manualSpinHandledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        window.clearTimeout(animationRef.current);
      }
    };
  }, []);

  const startSpin = useCallback((force = false) => {
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
  }, [disabled, isSpinning, selectedIndex, onSpinResult]);

  function spinWheel() {
    startSpin(false);
  }

  useEffect(() => {
    if (!autoSpin) {
      autoSpinHandledRef.current = false;
      return;
    }

    if (autoSpinHandledRef.current) {
      return;
    }

    autoSpinHandledRef.current = true;
    startSpin(true);
  }, [autoSpin, startSpin]);

  useEffect(() => {
    if (!manualSpinRequest) {
      manualSpinHandledRef.current = false;
      return;
    }

    if (manualSpinHandledRef.current) {
      return;
    }

    manualSpinHandledRef.current = true;
    startSpin(true);
    onManualSpinConsumed?.();
  }, [manualSpinRequest, onManualSpinConsumed, startSpin]);

  return (
    <div className="wheel-container">

        {wheelValues.map((item, index) => {

          // Map item types to their display labels
          const labelMap = {
            money: item.value,
            bankrupt: "Csőd",
            halve: "Felező",
            double: "Duplázó",
          };

          // Fall back to item.type if the type is not in labelMap
          const label = String(labelMap[item.type] ?? item.type);


          return (
            <div
              key={`${item.type}-${index}`}
              className={`side-column-item wheel-item ${selectedIndex === index ? "selected" : ""}`}
            >
              {label}
            </div>
          );
        })}

      {showButton && (
        <button onClick={spinWheel} disabled={disabled || isSpinning}>
          {isSpinning ? "Pörgetés..." : "Pörgetés"}
        </button>
      )}


      
    </div>
  );
}


export default Wheel;