import type { Difficulty, GameStatus } from "../hooks/useGame";

interface Props {
  lives: number;
  score: number;
  highScore: number;
  gameStatus: GameStatus;
  difficulty: Difficulty;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
}

export default function HUD({
  lives,
  score,
  highScore,
  gameStatus,
  difficulty,
  onPause,
  onResume,
  onRestart,
}: Props) {
  const isPlaying = gameStatus === "playing";
  const isPaused = gameStatus === "paused";

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl h-full"
      style={{ background: "#5FB7D9", border: "3px solid #2E6C86" }}
    >
      {/* Lives */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-arcade text-xs tracking-widest text-navy-dark uppercase opacity-80">
          Lives
        </span>
        <div className="flex gap-1" aria-label={`${lives} lives remaining`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`text-2xl transition-all duration-300 ${
                i < lives
                  ? "opacity-100 scale-100"
                  : "opacity-25 scale-75 grayscale"
              }`}
              aria-hidden="true"
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-navy/20" />

      {/* Score */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-arcade text-xs tracking-widest text-navy-dark uppercase opacity-80">
          Score
        </span>
        <span
          className="font-arcade text-4xl text-white text-outline"
          style={{ textShadow: "2px 2px 0 #0B2F4D" }}
          aria-label={`Score: ${score}`}
        >
          {score}
        </span>
      </div>

      {/* High Score */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-arcade text-xs tracking-widest text-navy-dark uppercase opacity-80">
          Best
        </span>
        <span
          className="font-arcade text-xl text-game-yellow"
          style={{ textShadow: "1px 1px 0 #0B2F4D" }}
          aria-label={`High score: ${highScore}`}
        >
          {highScore}
        </span>
      </div>

      {/* Difficulty badge */}
      <div className="flex justify-center">
        <span className="bg-navy/30 text-white font-arcade text-xs px-3 py-1 rounded-full uppercase tracking-widest">
          {difficulty}
        </span>
      </div>

      <div className="flex-1" />

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        {(isPlaying || isPaused) && (
          <button
            type="button"
            onClick={isPlaying ? onPause : onResume}
            data-ocid="hud.toggle.button"
            className="w-full font-arcade text-xs py-2.5 px-3 rounded-xl bg-navy text-game-yellow border-2 border-game-yellow/30 btn-arcade hover:bg-navy-light transition-colors"
          >
            {isPlaying ? "⏸ PAUSE" : "▶ RESUME"}
          </button>
        )}
        {(isPlaying || isPaused || gameStatus === "gameover") && (
          <button
            type="button"
            onClick={onRestart}
            data-ocid="hud.restart.button"
            className="w-full font-arcade text-xs py-2.5 px-3 rounded-xl bg-white/20 text-white border-2 border-white/30 btn-arcade hover:bg-white/30 transition-colors"
          >
            🔄 RESTART
          </button>
        )}
      </div>
    </div>
  );
}
