import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Difficulty, GameStatus } from "../hooks/useGame";
import { playGameOverSound, playHitSound } from "../hooks/useSoundEffects";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { spawnInterval: number; baseSpeed: number; speedIncrement: number }
> = {
  easy: { spawnInterval: 1800, baseSpeed: 2.5, speedIncrement: 0.0002 },
  medium: { spawnInterval: 1200, baseSpeed: 4, speedIncrement: 0.0004 },
  hard: { spawnInterval: 700, baseSpeed: 6, speedIncrement: 0.0008 },
};

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 60;
const POOP_SIZE = 36;
const GROUND_TOTAL = 68;
const PLAYER_SPEED = 280;

const JOY_OUTER_R = 45;
const JOY_INNER_R = 22;
const JOY_THRESHOLD = 8;

interface Poop {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

interface JoystickState {
  active: boolean;
  startX: number;
  currentX: number;
  baseX: number;
  baseY: number;
  pointerId: number;
}

interface Props {
  gameStatus: GameStatus;
  difficulty: Difficulty;
  score: number;
  lives: number;
  highScore: number;
  onScoreChange: (s: number) => void;
  onLivesChange: (l: number) => void;
  onGameOver: (finalScore: number, d: Difficulty) => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  flash: boolean,
  step: number,
) {
  const headR = 11;
  const bodyH = 24;
  const bodyW = 20;
  const topY = py - PLAYER_HEIGHT / 2;
  const headCY = topY + headR;
  const bodyTopY = headCY + headR + 1;
  const legTopY = bodyTopY + bodyH;
  const footY = legTopY + 20;

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(px, py + PLAYER_HEIGHT / 2 + 3, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = Math.sin(step * 0.35) * 5;
  const skinColor = flash ? "#FF6666" : "#FFCCBC";
  const shirtColor = flash ? "#FF3333" : "#E53935";
  const pantsColor = flash ? "#FF3333" : "#1565C0";
  const shoeColor = flash ? "#FF2222" : "#3E2723";

  ctx.fillStyle = pantsColor;
  ctx.beginPath();
  ctx.roundRect(px - 10, legTopY, 8, 16 + legSwing, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(px + 2, legTopY, 8, 16 - legSwing, 3);
  ctx.fill();

  ctx.fillStyle = shoeColor;
  ctx.beginPath();
  ctx.roundRect(px - 13, footY - 2 + legSwing, 13, 7, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(px, footY - 2 - legSwing, 13, 7, 3);
  ctx.fill();

  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(px - bodyW / 2, bodyTopY, bodyW, bodyH, 5);
  ctx.fill();
  ctx.fillStyle = flash ? "#FF6666" : "#EF9A9A";
  ctx.fillRect(px - 2, bodyTopY + 4, 4, bodyH - 8);

  const armSwing = -legSwing * 0.6;
  ctx.strokeStyle = skinColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(px - bodyW / 2, bodyTopY + 6);
  ctx.lineTo(px - bodyW / 2 - 9, bodyTopY + 16 + armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px + bodyW / 2, bodyTopY + 6);
  ctx.lineTo(px + bodyW / 2 + 9, bodyTopY + 16 - armSwing);
  ctx.stroke();

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(px, headCY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? "#FF4444" : "#D4956B";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = flash ? "#FF4444" : "#4E342E";
  ctx.beginPath();
  ctx.arc(px, headCY, headR, Math.PI * 0.9, Math.PI * 0.1, true);
  ctx.closePath();
  ctx.fill();

  if (!flash) {
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(px - 4, headCY + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 4, headCY + 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6D4C41";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, headCY + 3, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 6, headCY);
    ctx.lineTo(px - 2, headCY + 4);
    ctx.moveTo(px - 2, headCY);
    ctx.lineTo(px - 6, headCY + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 2, headCY);
    ctx.lineTo(px + 6, headCY + 4);
    ctx.moveTo(px + 6, headCY);
    ctx.lineTo(px + 2, headCY + 4);
    ctx.stroke();
  }
}

function drawJoystick(ctx: CanvasRenderingContext2D, joystick: JoystickState) {
  const { baseX, baseY, active, startX, currentX } = joystick;
  const clampedDelta = active
    ? Math.max(-JOY_OUTER_R, Math.min(JOY_OUTER_R, currentX - startX))
    : 0;
  const thumbX = baseX + clampedDelta;
  const thumbY = baseY;

  // Outer ring
  ctx.beginPath();
  ctx.arc(baseX, baseY, JOY_OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Direction arrows hint
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◀", baseX - JOY_OUTER_R + 10, baseY);
  ctx.fillText("▶", baseX + JOY_OUTER_R - 10, baseY);

  // Inner thumb
  const thumbGrad = ctx.createRadialGradient(
    thumbX - 5,
    thumbY - 5,
    2,
    thumbX,
    thumbY,
    JOY_INNER_R,
  );
  thumbGrad.addColorStop(0, "rgba(255,255,255,0.95)");
  thumbGrad.addColorStop(1, "rgba(180,180,200,0.85)");

  ctx.beginPath();
  ctx.arc(thumbX, thumbY, JOY_INNER_R, 0, Math.PI * 2);
  ctx.fillStyle = thumbGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default function GameCanvas({
  gameStatus,
  difficulty,
  score,
  lives,
  highScore,
  onScoreChange,
  onLivesChange,
  onGameOver,
  onStartGame,
  onResumeGame,
  onRestartGame,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef(0);
  const lastTimeRef = useRef(0);

  const gameStatusRef = useRef(gameStatus);
  const difficultyRef = useRef(difficulty);
  const playerRef = useRef({ x: 200, y: 400, vx: 0 });
  const poopsRef = useRef<Poop[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const keysRef = useRef({ left: false, right: false });
  const touchDirRef = useRef<"left" | "right" | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(lives);
  const speedRef = useRef(DIFFICULTY_CONFIG[difficulty].baseSpeed);
  const lastSpawnRef = useRef(0);
  const hitFlashEndRef = useRef(0);
  const poopIdRef = useRef(0);
  const stepRef = useRef(0);

  const joystickRef = useRef<JoystickState>({
    active: false,
    startX: 0,
    currentX: 0,
    baseX: 200,
    baseY: 400,
    pointerId: -1,
  });

  const onScoreChangeRef = useRef(onScoreChange);
  const onLivesChangeRef = useRef(onLivesChange);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
  }, [onScoreChange]);
  useEffect(() => {
    onLivesChangeRef.current = onLivesChange;
  }, [onLivesChange]);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    if (gameStatus === "playing") {
      const canvas = canvasRef.current;
      const w = canvas?.width || 400;
      const h = canvas?.height || 500;
      const groundY = h - GROUND_TOTAL;
      const config = DIFFICULTY_CONFIG[difficulty];
      poopsRef.current = [];
      speedRef.current = config.baseSpeed;
      lastSpawnRef.current = performance.now();
      scoreRef.current = 0;
      stepRef.current = 0;
      hitFlashEndRef.current = 0;
      playerRef.current = { x: w / 2, y: groundY - PLAYER_HEIGHT / 2, vx: 0 };
      joystickRef.current = {
        active: false,
        startX: 0,
        currentX: 0,
        baseX: w / 2,
        baseY: groundY - 70,
        pointerId: -1,
      };
    }
  }, [gameStatus, difficulty]);

  useEffect(() => {
    cloudsRef.current = Array.from({ length: 6 }, (_, i) => ({
      x: i * 170 - 50,
      y: 30 + Math.random() * 110,
      w: 90 + Math.random() * 60,
      h: 38 + Math.random() * 20,
      speed: 12 + Math.random() * 12,
    }));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    lastTimeRef.current = performance.now();

    function update(dt: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const config = DIFFICULTY_CONFIG[difficultyRef.current];
      const groundY = h - GROUND_TOTAL;
      const playerGroundY = groundY - PLAYER_HEIGHT / 2;

      speedRef.current += config.speedIncrement;

      const player = playerRef.current;
      const joy = joystickRef.current;
      let joyDir: "left" | "right" | null = null;
      if (joy.active) {
        const delta = joy.currentX - joy.startX;
        if (delta < -JOY_THRESHOLD) joyDir = "left";
        else if (delta > JOY_THRESHOLD) joyDir = "right";
      }

      const movingLeft =
        keysRef.current.left ||
        touchDirRef.current === "left" ||
        joyDir === "left";
      const movingRight =
        keysRef.current.right ||
        touchDirRef.current === "right" ||
        joyDir === "right";

      if (movingLeft) player.vx = -PLAYER_SPEED;
      else if (movingRight) player.vx = PLAYER_SPEED;
      else player.vx = 0;

      player.x += (player.vx * dt) / 1000;
      player.x = Math.max(
        PLAYER_WIDTH / 2,
        Math.min(w - PLAYER_WIDTH / 2, player.x),
      );
      player.y = playerGroundY;

      if (movingLeft || movingRight) stepRef.current += dt * 0.06;

      const now = performance.now();
      if (now - lastSpawnRef.current > config.spawnInterval) {
        poopsRef.current.push({
          id: poopIdRef.current++,
          x: POOP_SIZE + Math.random() * (w - POOP_SIZE * 2),
          y: -POOP_SIZE,
          rotation: Math.random() * Math.PI * 2,
        });
        lastSpawnRef.current = now;
      }

      const surviving: Poop[] = [];
      let newScore = scoreRef.current;
      let newLives = livesRef.current;
      let hitOccurred = false;
      const hitBoxW = PLAYER_WIDTH * 0.75;
      const hitBoxH = PLAYER_HEIGHT * 0.75;

      for (const poop of poopsRef.current) {
        poop.y += speedRef.current * (dt / 16.667);
        poop.rotation += 0.03;
        const dx = Math.abs(poop.x - player.x);
        const dy = Math.abs(poop.y - player.y);
        if (
          dx < hitBoxW / 2 + POOP_SIZE / 2 &&
          dy < hitBoxH / 2 + POOP_SIZE / 2
        ) {
          hitFlashEndRef.current = performance.now() + 320;
          newLives--;
          hitOccurred = true;
        } else if (poop.y > h + POOP_SIZE) {
          newScore++;
        } else {
          surviving.push(poop);
        }
      }
      poopsRef.current = surviving;

      if (newScore !== scoreRef.current) {
        scoreRef.current = newScore;
        onScoreChangeRef.current(newScore);
      }
      if (hitOccurred) {
        playHitSound();
        livesRef.current = newLives;
        onLivesChangeRef.current(newLives);
        if (newLives <= 0) {
          playGameOverSound();
          onGameOverRef.current(newScore, difficultyRef.current);
        }
      }

      for (const cloud of cloudsRef.current) {
        cloud.x += (cloud.speed * dt) / 1000;
        if (cloud.x > w + cloud.w) {
          cloud.x = -cloud.w;
          cloud.y = 25 + Math.random() * 120;
        }
      }
    }

    function render() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.85);
      skyGrad.addColorStop(0, "#7FD3FF");
      skyGrad.addColorStop(1, "#BFEFFF");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      for (const cloud of cloudsRef.current) {
        const cx = cloud.x;
        const cy = cloud.y;
        const cw = cloud.w;
        const ch = cloud.h;
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          cx + cw * 0.28,
          cy - ch * 0.2,
          cw * 0.32,
          ch * 0.55,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(
          cx - cw * 0.28,
          cy - ch * 0.1,
          cw * 0.27,
          ch * 0.48,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      const groundY = h - GROUND_TOTAL;
      const dirtGrad = ctx.createLinearGradient(0, groundY + 24, 0, h);
      dirtGrad.addColorStop(0, "#8B5E3C");
      dirtGrad.addColorStop(1, "#5D3A1A");
      ctx.fillStyle = dirtGrad;
      ctx.fillRect(0, groundY + 20, w, h - groundY);

      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let i = 0; i < 7; i++) {
        const rx = (w / 8) * i + 20;
        ctx.beginPath();
        ctx.ellipse(rx, groundY + 38, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 24);
      grassGrad.addColorStop(0, "#66BB6A");
      grassGrad.addColorStop(1, "#388E3C");
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, groundY, w, 24);

      ctx.fillStyle = "#81C784";
      for (let i = 0; i < w; i += 14) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i + 4, groundY - 7);
        ctx.lineTo(i + 8, groundY);
        ctx.fill();
      }

      ctx.font = `${POOP_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const poop of poopsRef.current) {
        ctx.save();
        ctx.translate(poop.x, poop.y);
        ctx.rotate(poop.rotation);
        ctx.fillText("\u{1F4A9}", 0, 0);
        ctx.restore();
      }

      const flash = performance.now() < hitFlashEndRef.current;
      const player = playerRef.current;
      drawPlayer(ctx, player.x, player.y, flash, stepRef.current);

      // Draw joystick only during gameplay
      if (gameStatusRef.current === "playing") {
        drawJoystick(ctx, joystickRef.current);
      }
    }

    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;
      if (gameStatusRef.current === "playing") update(dt);
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      const groundY = height - GROUND_TOTAL;
      playerRef.current.y = groundY - PLAYER_HEIGHT / 2;
      if (playerRef.current.x <= 0 || playerRef.current.x > width) {
        playerRef.current.x = width / 2;
      }
      // Update joystick base position on resize
      joystickRef.current.baseX = width / 2;
      joystickRef.current.baseY = groundY - 70;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d")
        keysRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Joystick touch/mouse handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function getCanvasXY(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = canvas!.width / rect.width;
      const scaleY = canvas!.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    }

    function isInJoystick(x: number, y: number): boolean {
      if (gameStatusRef.current !== "playing") return false;
      const joy = joystickRef.current;
      const dx = x - joy.baseX;
      const dy = y - joy.baseY;
      return Math.sqrt(dx * dx + dy * dy) <= JOY_OUTER_R * 1.5;
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const { x, y } = getCanvasXY(touch.clientX, touch.clientY);
        if (isInJoystick(x, y)) {
          joystickRef.current = {
            ...joystickRef.current,
            active: true,
            startX: x,
            currentX: x,
            pointerId: touch.identifier,
          };
          return;
        }
      }
      // fallback: old tap-left/right if not on joystick
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchDirRef.current =
        touch.clientX - rect.left < rect.width / 2 ? "left" : "right";
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const joy = joystickRef.current;
      if (joy.active) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === joy.pointerId) {
            const { x } = getCanvasXY(touch.clientX, touch.clientY);
            joystickRef.current.currentX = x;
            return;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const joy = joystickRef.current;
      if (joy.active) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === joy.pointerId) {
            joystickRef.current.active = false;
            joystickRef.current.currentX = joystickRef.current.startX;
            touchDirRef.current = null;
            return;
          }
        }
      }
      touchDirRef.current = null;
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (gameStatusRef.current !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const joy = joystickRef.current;
    const dx = x - joy.baseX;
    const dy = y - joy.baseY;
    if (Math.sqrt(dx * dx + dy * dy) <= JOY_OUTER_R * 1.5) {
      joystickRef.current = {
        ...joystickRef.current,
        active: true,
        startX: x,
        currentX: x,
      };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !joystickRef.current.active) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    joystickRef.current.currentX = x;
  };

  const handleCanvasMouseUp = () => {
    if (joystickRef.current.active) {
      joystickRef.current.active = false;
      joystickRef.current.currentX = joystickRef.current.startX;
    }
    touchDirRef.current = null;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        className="w-full h-full outline-none block"
        style={{ cursor: gameStatus === "playing" ? "none" : "default" }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        aria-label="Game canvas. Use arrow keys, joystick, or tap left/right to move."
      />

      <AnimatePresence>
        {gameStatus === "start" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(7,20,35,0.78)" }}
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
              className="text-center px-6"
            >
              <div className="text-6xl mb-2 animate-float">💩</div>
              <h1
                className="font-arcade text-4xl md:text-5xl text-game-yellow mb-1"
                style={{
                  textShadow: "3px 3px 0 #0B2F4D, 5px 5px 0 rgba(0,0,0,0.3)",
                }}
              >
                POOP DODGE
              </h1>
              <p className="text-white/80 font-body text-base mb-4 mt-2">
                Don&apos;t let the poop hit you! 3 hits = game over.
              </p>
              <div className="text-white/60 font-body text-sm mb-6 space-y-1">
                <p>🖥️ Arrow keys / A-D to move</p>
                <p>📱 Drag the joystick to move</p>
              </div>
              <button
                type="button"
                onClick={onStartGame}
                data-ocid="game.start.primary_button"
                className="font-arcade text-lg text-navy-dark bg-game-yellow px-10 py-3.5 rounded-full btn-arcade border-2 border-game-yellow-dark hover:brightness-105 transition-all"
                style={{ boxShadow: "0 5px 0 #B3871F" }}
              >
                🎮 PLAY NOW
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameStatus === "paused" && (
          <motion.div
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(7,20,35,0.72)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center px-6"
            >
              <div className="text-5xl mb-3">⏸</div>
              <h2
                className="font-arcade text-4xl text-game-yellow mb-4"
                style={{ textShadow: "3px 3px 0 #0B2F4D" }}
              >
                PAUSED
              </h2>
              <button
                type="button"
                onClick={onResumeGame}
                data-ocid="game.resume.primary_button"
                className="font-arcade text-base text-navy-dark bg-game-yellow px-8 py-3 rounded-full btn-arcade border-2 border-game-yellow-dark"
                style={{ boxShadow: "0 4px 0 #B3871F" }}
              >
                ▶ RESUME
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameStatus === "gameover" && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "rgba(7,20,35,0.80)" }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 18,
                delay: 0.05,
              }}
              className="text-center px-6"
            >
              <div className="text-5xl mb-2">💀</div>
              <h2
                className="font-arcade text-4xl text-red-400 mb-4"
                style={{ textShadow: "3px 3px 0 #0B2F4D" }}
              >
                GAME OVER
              </h2>
              <div className="bg-white/10 rounded-2xl px-8 py-4 mb-5 border border-white/20">
                <p className="text-white/70 font-body text-sm uppercase tracking-widest mb-1">
                  Score
                </p>
                <p
                  className="font-arcade text-5xl text-white"
                  style={{ textShadow: "2px 2px 0 #0B2F4D" }}
                >
                  {score}
                </p>
                {score > 0 && score >= highScore && (
                  <p className="text-game-yellow font-body text-sm mt-1 animate-bounce-in">
                    🏆 NEW BEST!
                  </p>
                )}
                <p className="text-white/50 font-body text-xs mt-2">
                  Best: {highScore}
                </p>
              </div>
              <button
                type="button"
                onClick={onRestartGame}
                data-ocid="game.restart.primary_button"
                className="font-arcade text-base text-navy-dark bg-game-yellow px-8 py-3 rounded-full btn-arcade border-2 border-game-yellow-dark"
                style={{ boxShadow: "0 4px 0 #B3871F" }}
              >
                🔄 PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
