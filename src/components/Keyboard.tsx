import { useEffect, useRef } from "react";
import beepSound from "../assets/beep-a.ogg";

type KeyboardProps = {
  onLetterClick: (letter: string) => void;
  usedLetters: string[];
 disabled:boolean;
};


const letters = [
  "A","Á","B","C","D","E","É",
  "F","G","H","I","Í","J",
  "K","L","M","N","O","Ó",
  "Ö","Ő","P","Q","R","S",
  "T","U","Ú","Ü","Ű",
  "V","W","X","Y","Z"
];




function Keyboard({ onLetterClick, usedLetters, disabled }: KeyboardProps) {
  const beepSoundRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    beepSoundRef.current = new Audio(beepSound);
    beepSoundRef.current.preload = "auto";
  }, []);

  function sfxBeep() {
      if (beepSoundRef.current) {
        beepSoundRef.current.currentTime = 0;
        beepSoundRef.current.play().catch(() => {});
      }    
  }

  return (
    <div>
      {letters.map(letter => (

        <button
          key={letter}
          className={usedLetters.includes(letter) ? "already-used" : ""}
          disabled={disabled || usedLetters.includes(letter)}
          onClick={() => {
            sfxBeep();
            onLetterClick(letter);}}
        >
          {letter}
        </button>

      ))}
    </div>
  );
}


export default Keyboard;