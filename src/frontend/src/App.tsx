import { motion } from "motion/react";
import { useState } from "react";
import DifficultySelector from "./components/DifficultySelector";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import { useGame } from "./hooks/useGame";
import type { Difficulty } from "./hooks/useGame";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function getLeaderboard() {
  const sampleNames = [
    "PoopDodger99",
    "BrownBomber",
    "StinkySlayer",
    "DungeonMaster",
    "SkidMarks",
  ];
  const defaults: Record<Difficulty, number[]> = {
    easy: [42, 31, 25],
    medium: [38, 27, 19],
    hard: [22, 15, 9],
  };
  const allScores: { name: string; score: number; difficulty: Difficulty }[] =
    [];
  for (const d of DIFFICULTIES) {
    const stored = Number.parseInt(
      localStorage.getItem(`highscore_${d}`) || "0",
      10,
    );
    if (stored > 0)
      allScores.push({ name: "YOU", score: stored, difficulty: d });
    defaults[d].forEach((score, i) => {
      if (stored === 0 || score < stored) {
        allScores.push({
          name: sampleNames[i % sampleNames.length],
          score,
          difficulty: d,
        });
      }
    });
  }
  allScores.sort((a, b) => b.score - a.score);
  return allScores.slice(0, 5).map((e, idx) => ({ rank: idx + 1, ...e }));
}

const FEATURES = [
  {
    emoji: "\u{1F4A9}",
    title: "Dodge Poop",
    desc: "Poop rains from above. Move fast or get hit!",
  },
  {
    emoji: "\u26A1",
    title: "3 Difficulty Levels",
    desc: "Easy, Medium, and Hard modes to test your reflexes.",
  },
  {
    emoji: "\u{1F3C6}",
    title: "Beat Your Best",
    desc: "High scores saved per difficulty. Can you top them all?",
  },
];

const FOOTER_LINKS = [
  { heading: "ABOUT", links: ["The Game", "How It Works", "Changelog"] },
  { heading: "COMMUNITY", links: ["Discord", "Reddit", "Fan Art"] },
  { heading: "HELP", links: ["Controls", "FAQ", "Contact"] },
];

const SOCIAL_ICONS = ["\u{1D54F}", "\u{1F4D8}", "\u{1F4F8}", "\u{1F3AE}"];
const MEDAL: Record<number, string> = {
  0: "\u{1F947}",
  1: "\u{1F948}",
  2: "\u{1F949}",
};

function GameCanvasShared({ game }: { game: ReturnType<typeof useGame> }) {
  return (
    <GameCanvas
      gameStatus={game.gameStatus}
      difficulty={game.difficulty}
      score={game.score}
      lives={game.lives}
      highScore={game.highScore}
      onScoreChange={game.onScoreChange}
      onLivesChange={game.onLivesChange}
      onGameOver={game.onGameOver}
      onStartGame={game.startGame}
      onResumeGame={game.resumeGame}
      onRestartGame={game.restartGame}
    />
  );
}

export default function App() {
  const game = useGame();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const leaderboard = getLeaderboard();
  const isGameActive =
    game.gameStatus === "playing" || game.gameStatus === "paused";

  return (
    <>
      {/* ========== MOBILE LAYOUT ========== */}
      <div
        className="md:hidden flex flex-col overflow-hidden"
        style={{
          height: "100dvh",
          background: "linear-gradient(180deg, #7FD3FF 0%, #BFEFFF 100%)",
        }}
      >
        {/* Mobile top bar */}
        <header
          className="shrink-0 flex items-center justify-between px-3 py-2"
          style={{
            background: "linear-gradient(90deg, #0B2F4D 0%, #0A2742 100%)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              💩
            </span>
            <span
              className="font-arcade text-sm text-game-yellow"
              style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.4)" }}
            >
              POOP DODGE
            </span>
          </div>
          <DifficultySelector
            value={game.difficulty}
            onChange={game.setDifficulty}
            disabled={isGameActive}
          />
        </header>

        {/* Score/lives bar when game is active */}
        {isGameActive && (
          <div
            className="shrink-0 flex items-center justify-between px-4 py-1.5"
            style={{
              background: "rgba(7,20,35,0.75)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`text-lg ${i < game.lives ? "opacity-100" : "opacity-25 grayscale"}`}
                >
                  ❤️
                </span>
              ))}
            </div>
            <span
              className="font-arcade text-2xl text-white"
              style={{ textShadow: "2px 2px 0 #0B2F4D" }}
            >
              {game.score}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-arcade text-xs text-game-yellow">
                BEST {game.highScore}
              </span>
              <button
                type="button"
                onClick={
                  game.gameStatus === "playing"
                    ? game.pauseGame
                    : game.resumeGame
                }
                data-ocid="hud.mobile.toggle.button"
                className="bg-navy text-game-yellow font-arcade text-xs px-3 py-1 rounded-lg btn-arcade"
              >
                {game.gameStatus === "playing" ? "⏸" : "▶"}
              </button>
            </div>
          </div>
        )}

        {/* Game canvas fills remaining height */}
        <div className="flex-1 min-h-0 relative">
          <GameCanvasShared game={game} />
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div
        className="hidden md:flex flex-col min-h-screen"
        style={{
          background: "linear-gradient(180deg, #7FD3FF 0%, #BFEFFF 100%)",
        }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-50 w-full"
          style={{
            background: "linear-gradient(90deg, #0B2F4D 0%, #0A2742 100%)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.35)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-2xl" aria-hidden="true">
                💩
              </span>
              <span
                className="font-arcade text-lg text-game-yellow"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
              >
                POOP DODGE
              </span>
            </div>
            <nav
              className="flex items-center gap-1 sm:gap-3"
              aria-label="Main navigation"
            >
              <a
                href="#game"
                data-ocid="nav.game.link"
                className="text-white/80 font-body text-sm hover:text-white transition-colors tracking-wide"
              >
                HOME
              </a>
              <a
                href="#how-to-play"
                data-ocid="nav.howtoplay.link"
                className="text-white/80 font-body text-sm hover:text-white transition-colors tracking-wide"
              >
                HOW TO PLAY
              </a>
              <button
                type="button"
                onClick={() => setShowLeaderboard((v) => !v)}
                data-ocid="nav.leaderboard.toggle"
                className="text-white/80 font-body text-sm hover:text-white transition-colors tracking-wide"
              >
                HIGH SCORES
              </button>
              <button
                type="button"
                onClick={game.startGame}
                data-ocid="nav.playnow.primary_button"
                className="font-arcade text-xs text-navy-dark bg-game-yellow px-4 py-2 rounded-full btn-arcade border border-game-yellow-dark hover:brightness-105 transition-all"
                style={{ boxShadow: "0 3px 0 #B3871F" }}
              >
                🎮 PLAY NOW
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1" id="game">
          <div className="flex justify-center py-4 px-4">
            <DifficultySelector
              value={game.difficulty}
              onChange={game.setDifficulty}
              disabled={isGameActive}
            />
          </div>

          <section
            className="max-w-5xl mx-auto px-3 pb-4"
            aria-label="Game area"
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                border: "4px solid #1E2B33",
                boxShadow: "0 8px 0 #1E2B33, 0 12px 32px rgba(0,0,0,0.3)",
                background: "#6EC6E6",
              }}
            >
              <div
                className="p-1"
                style={{
                  border: "3px solid #2E6C86",
                  borderRadius: "calc(1.5rem - 4px)",
                }}
              >
                <div className="flex flex-row gap-2">
                  <div
                    className="flex-1 rounded-2xl overflow-hidden"
                    style={{
                      minHeight: "420px",
                      height: "clamp(420px, 55vh, 560px)",
                    }}
                  >
                    <GameCanvasShared game={game} />
                  </div>
                  <div className="w-36 lg:w-44 flex flex-col">
                    <HUD
                      lives={game.lives}
                      score={game.score}
                      highScore={game.highScore}
                      gameStatus={game.gameStatus}
                      difficulty={game.difficulty}
                      onPause={game.pauseGame}
                      onResume={game.resumeGame}
                      onRestart={game.restartGame}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="max-w-5xl mx-auto px-4 py-8"
            id="how-to-play"
            aria-label="Game features and leaderboard"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2
                  className="font-arcade text-xl text-navy mb-4"
                  style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}
                >
                  🎮 GAME FEATURES
                </h2>
                <div className="flex flex-col gap-3">
                  {FEATURES.map((f) => (
                    <div
                      key={f.title}
                      className="flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80"
                      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
                    >
                      <span className="text-3xl shrink-0">{f.emoji}</span>
                      <div>
                        <p className="font-arcade text-sm text-navy-dark">
                          {f.title}
                        </p>
                        <p className="text-foreground/70 font-body text-sm mt-0.5">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-navy/10 rounded-2xl p-4 border border-navy/20">
                  <h3 className="font-arcade text-sm text-navy mb-2">
                    HOW TO PLAY
                  </h3>
                  <ul className="space-y-1.5 font-body text-sm text-foreground/80">
                    <li className="flex items-center gap-2">
                      <span>⬅️➡️</span> Arrow keys or A/D to move
                    </li>
                    <li className="flex items-center gap-2">
                      <span>👆</span> Drag the joystick on mobile
                    </li>
                    <li className="flex items-center gap-2">
                      <span>💩</span> Avoid the falling poop!
                    </li>
                    <li className="flex items-center gap-2">
                      <span>❤️</span> 3 hits = game over
                    </li>
                    <li className="flex items-center gap-2">
                      <span>🏆</span> Score goes up when poop misses you
                    </li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2
                  className="font-arcade text-xl text-navy mb-4"
                  style={{ textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}
                >
                  🏆 HIGH SCORES
                </h2>
                <div
                  className="bg-navy rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: "0 4px 0 #061A2B, 0 8px 24px rgba(0,0,0,0.25)",
                  }}
                  data-ocid="leaderboard.table"
                >
                  <div className="p-4 border-b border-white/10">
                    <p className="font-arcade text-xs text-game-yellow text-center tracking-widest">
                      TOP PLAYERS
                    </p>
                  </div>
                  {leaderboard.length === 0 ? (
                    <div
                      className="p-8 text-center text-white/50 font-body"
                      data-ocid="leaderboard.empty_state"
                    >
                      No scores yet. Play a game!
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {leaderboard.map((entry, idx) => (
                        <div
                          key={`${entry.name}-${entry.difficulty}-${entry.score}`}
                          data-ocid={`leaderboard.item.${idx + 1}`}
                          className={`flex items-center gap-3 px-4 py-3 ${idx === 0 ? "bg-game-yellow/15" : ""}`}
                        >
                          <span
                            className={`font-arcade text-sm w-7 text-center ${idx === 0 ? "text-game-yellow" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-amber-600" : "text-white/40"}`}
                          >
                            {MEDAL[idx] ?? `#${entry.rank}`}
                          </span>
                          <span className="flex-1 font-body text-sm text-white/90 truncate">
                            {entry.name}
                          </span>
                          <span className="font-arcade text-xs text-white/50 capitalize">
                            {entry.difficulty}
                          </span>
                          <span
                            className={`font-arcade text-base ${idx === 0 ? "text-game-yellow" : "text-white"}`}
                          >
                            {entry.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {DIFFICULTIES.map((d) => {
                    const hs = Number.parseInt(
                      localStorage.getItem(`highscore_${d}`) || "0",
                      10,
                    );
                    return (
                      <div
                        key={d}
                        className="bg-white/70 rounded-xl p-3 text-center border border-white/80"
                      >
                        <p className="font-arcade text-xs text-navy/60 uppercase tracking-widest">
                          {d}
                        </p>
                        <p className="font-arcade text-xl text-navy mt-1">
                          {hs}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer
          className="mt-4"
          style={{
            background: "linear-gradient(90deg, #0B2F4D 0%, #0A2742 100%)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {FOOTER_LINKS.map((col) => (
                <div key={col.heading}>
                  <p className="font-arcade text-xs text-game-yellow mb-3 tracking-widest">
                    {col.heading}
                  </p>
                  <ul className="space-y-1.5">
                    {col.links.map((l) => (
                      <li key={l}>
                        <span className="text-white/60 font-body text-sm cursor-default">
                          {l}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className="font-arcade text-xs text-game-yellow mb-3 tracking-widest">
                  SOCIAL
                </p>
                <div className="flex gap-3">
                  {SOCIAL_ICONS.map((icon) => (
                    <span
                      key={icon}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg"
                    >
                      {icon}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 text-center">
              <p className="text-white/40 font-body text-xs">
                &copy; {new Date().getFullYear()} Poop Dodge. Built with ❤️ using{" "}
                <a
                  href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white/70 transition-colors"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
          </div>
        </footer>

        {showLeaderboard && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowLeaderboard(false)}
            onKeyDown={(e) => e.key === "Escape" && setShowLeaderboard(false)}
          >
            <div
              className="bg-navy rounded-3xl p-6 max-w-sm w-full"
              style={{ boxShadow: "0 8px 0 #061A2B" }}
              data-ocid="leaderboard.modal"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-arcade text-base text-game-yellow">
                  🏆 HIGH SCORES
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLeaderboard(false)}
                  data-ocid="leaderboard.close_button"
                  className="text-white/60 hover:text-white text-xl transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {DIFFICULTIES.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between py-2 border-b border-white/10"
                >
                  <span className="font-body text-white capitalize">{d}</span>
                  <span className="font-arcade text-game-yellow">
                    {localStorage.getItem(`highscore_${d}`) || "0"}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowLeaderboard(false);
                  game.startGame();
                }}
                data-ocid="leaderboard.play.primary_button"
                className="w-full mt-4 font-arcade text-sm text-navy-dark bg-game-yellow py-3 rounded-xl btn-arcade"
              >
                PLAY NOW
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
