import { useCallback, useState } from "react";

export type GameStatus = "start" | "playing" | "paused" | "gameover";
export type Difficulty = "easy" | "medium" | "hard";

function loadHighScore(d: Difficulty): number {
  return Number.parseInt(localStorage.getItem(`highscore_${d}`) || "0", 10);
}

export function useGame() {
  const [gameStatus, setGameStatus] = useState<GameStatus>("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficultyState] = useState<Difficulty>("easy");
  const [highScore, setHighScore] = useState<number>(() =>
    loadHighScore("easy"),
  );

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d);
    setHighScore(loadHighScore(d));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameStatus("playing");
  }, []);

  const pauseGame = useCallback(() => setGameStatus("paused"), []);
  const resumeGame = useCallback(() => setGameStatus("playing"), []);

  const restartGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameStatus("playing");
  }, []);

  const onScoreChange = useCallback((s: number) => setScore(s), []);
  const onLivesChange = useCallback((l: number) => setLives(l), []);

  const onGameOver = useCallback((finalScore: number, d: Difficulty) => {
    const key = `highscore_${d}`;
    const current = loadHighScore(d);
    if (finalScore > current) {
      localStorage.setItem(key, String(finalScore));
      setHighScore(finalScore);
    }
    setGameStatus("gameover");
  }, []);

  return {
    gameStatus,
    score,
    lives,
    highScore,
    difficulty,
    setDifficulty,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    onScoreChange,
    onLivesChange,
    onGameOver,
  };
}
