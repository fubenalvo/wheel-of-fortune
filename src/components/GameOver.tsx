import { useEffect, useState } from "react";
import type { Player } from "../models/Player";
import "./GameOver.css";

type GameOverProps = {
    players: Player[];
};

type Score = {
    _id: string;
    name: string;
    score: number;
    date: string;
};

const API_URL = import.meta.env.VITE_API_URL;

function GameOver({ players }: GameOverProps) {

    const [topScores, setTopScores] = useState<Score[]>([]);
    const [scoresSubmitted, setScoresSubmitted] = useState(false);
    const [loadingTopScores, setLoadingTopScores] = useState(true);

    async function loadTopScores() {
        setLoadingTopScores(true);

        try {
            const response = await fetch(`${API_URL}/api/scores/top`);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();

            setTopScores(data);

        } catch (error) {
            console.warn(
                "Score server is not available. Continuing without leaderboard.",
                error
            );

        } finally {
            setLoadingTopScores(false);
        }
    }

    async function submitScores() {
        const humanPlayers = players.filter(player => !player.computer);

        let allSubmitted = true;

        for (const player of humanPlayers) {
            try {
                const response = await fetch(`${API_URL}/api/scores`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: player.name,
                        score: player.sum
                    })
                });

                if (!response.ok) {
                    throw new Error(
                        `Server returned ${response.status}`
                    );
                }

            } catch (error) {
                console.warn(
                    `Could not submit score for ${player.name}.`,
                    error
                );

                allSubmitted = false;
            }
        }

        if (allSubmitted) {
            setScoresSubmitted(true);

            // Refresh TOP 10 after submitting scores
            await loadTopScores();
        }
    }

    useEffect(() => {
        loadTopScores();
    }, []);

    return (
        <div>

            <h1>Játék vége</h1>

            {players.map((player, index) => (
                !player.computer && (
                    <div
                        className="game-over-player"
                        key={index}
                    >
                        {player.name} - {player.sum}
                    </div>
                )
            ))}

            <input
                className="game-over-submut-button"
                onClick={submitScores}
                type="button"
                value={
                    scoresSubmitted
                        ? "Eredmények beküldve"
                        : "Eredmények beküldése"
                }
                disabled={scoresSubmitted}
            />

            <h2 className="topscore-title">ONLINE TOP 10</h2>

            <div className="topscore-grid">

                {loadingTopScores ? (
                    <div className="topscore-loading">
                        TOPLISTA BETÖLTÉSE<span className="loading-dots">...</span>
                    </div>
                ) : (
                    topScores.map((score, index) => (
                        <div
                            className="topscore-player"
                            key={score._id}
                        >
                            <div>{index + 1}.</div>
                            <div>{score.name}</div>
                            <div>{score.score}</div>
                        </div>
                    ))
                )}

            </div>

        </div>
    );
}

export default GameOver;