import type { Difficulty } from "../hooks/useGame";

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}

const OPTIONS: { value: Difficulty; label: string; emoji: string }[] = [
  { value: "easy", label: "EASY", emoji: "😊" },
  { value: "medium", label: "MEDIUM", emoji: "😅" },
  { value: "hard", label: "HARD", emoji: "💀" },
];

export default function DifficultySelector({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <fieldset
      className="flex items-center gap-1 bg-navy/80 backdrop-blur-sm rounded-full p-1.5 border-2 border-white/20 shadow-arcade"
      data-ocid="difficulty.select"
      aria-label="Select difficulty"
      style={{ border: "none" }}
    >
      <legend className="sr-only">Game difficulty</legend>
      <div
        className="flex items-center gap-1 bg-navy/80 backdrop-blur-sm rounded-full p-1.5"
        style={{
          border: "2px solid rgba(255,255,255,0.2)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            data-ocid={`difficulty.${opt.value}.tab`}
            aria-pressed={value === opt.value}
            className={[
              "px-4 py-1.5 rounded-full font-arcade text-sm tracking-wider transition-all duration-150 btn-arcade select-none",
              value === opt.value
                ? "bg-game-yellow text-navy-dark shadow-arcade-inset"
                : "text-white hover:bg-white/10 active:bg-white/20",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            <span className="mr-1">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
