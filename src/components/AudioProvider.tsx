import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import beepSound from "../assets/beep-a.ogg";
import musicSound from "../assets/music.ogg";

type AudioContextType = {
  isMuted: boolean;
  isMusicMuted: boolean;
  toggleMute: () => void;
  toggleMusic: () => void;
  playBeep: () => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const MUTE_STORAGE_KEY = "szerencsekerek-muted";
const MUSIC_MUTE_STORAGE_KEY = "szerencsekerek-music-muted";

type AudioProviderProps = {
  children: ReactNode;
};

export function AudioProvider({ children }: AudioProviderProps) {
  // Sound effects are enabled by default
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });

  // Music is disabled by default
  const [isMusicMuted, setIsMusicMuted] = useState(() => {
    return localStorage.getItem(MUSIC_MUTE_STORAGE_KEY) !== "false";
  });

  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);

  // Create audio objects once
  useEffect(() => {
    const beep = new Audio(beepSound);
    beep.preload = "auto";

    const music = new Audio(musicSound);
    music.preload = "auto";
    music.loop = true;
    music.volume = 0.25;

    beepAudioRef.current = beep;
    musicAudioRef.current = music;

    return () => {
      beep.pause();
      music.pause();

      beepAudioRef.current = null;
      musicAudioRef.current = null;
    };
  }, []);

  // Start music on the first user interaction if music is enabled
  useEffect(() => {
    const startMusic = () => {
      const music = musicAudioRef.current;

      if (
        !music ||
        isMusicMuted ||
        musicStartedRef.current
      ) {
        return;
      }

      musicStartedRef.current = true;

      music.play().catch(() => {
        // Browser may still block playback
        musicStartedRef.current = false;
      });
    };

    window.addEventListener("pointerdown", startMusic);
    window.addEventListener("keydown", startMusic);

    return () => {
      window.removeEventListener("pointerdown", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, [isMusicMuted]);

  // Stop music when music is disabled
  useEffect(() => {
    const music = musicAudioRef.current;

    if (!music) {
      return;
    }

    if (isMusicMuted) {
      music.pause();
      musicStartedRef.current = false;
    }
  }, [isMusicMuted]);

  function toggleMute() {
    setIsMuted(previousMuted => {
      const newMutedState = !previousMuted;

      localStorage.setItem(
        MUTE_STORAGE_KEY,
        String(newMutedState)
      );

      return newMutedState;
    });
  }

  function toggleMusic() {
    setIsMusicMuted(previousMuted => {
      const newMutedState = !previousMuted;

      localStorage.setItem(
        MUSIC_MUTE_STORAGE_KEY,
        String(newMutedState)
      );

      // If music is being enabled, try to start it immediately.
      if (!newMutedState) {
        const music = musicAudioRef.current;

        if (music) {
          musicStartedRef.current = true;

          music.play().catch(() => {
            // Browser may block playback if there was no user interaction
            musicStartedRef.current = false;
          });
        }
      }

      return newMutedState;
    });
  }

  function playBeep() {
    if (isMuted || !beepAudioRef.current) {
      return;
    }

    beepAudioRef.current.currentTime = 0;

    beepAudioRef.current.play().catch(() => {});
  }

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        isMusicMuted,
        toggleMute,
        toggleMusic,
        playBeep,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);

  if (!context) {
    throw new Error(
      "useAudio must be used inside an AudioProvider"
    );
  }

  return context;
}
