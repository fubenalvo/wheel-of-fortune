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

  return (
    <div>
      {letters.map(letter => (

        <button
          key={letter}
          disabled={disabled || usedLetters.includes(letter)}
          onClick={() => onLetterClick(letter)}
        >
          {letter}
        </button>

      ))}
    </div>
  );
}


export default Keyboard;