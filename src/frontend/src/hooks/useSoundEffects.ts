let audioCtx: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
  return audioCtx;
}

export async function playHitSound() {
  const ctx = await getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Noise burst via white noise buffer
  const bufferSize = ctx.sampleRate * 0.25;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Low-pass filter to give a wet "splat" character
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + 0.22);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  // Low thud oscillator
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(1.0, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.25);
  osc.start(now);
  osc.stop(now + 0.2);
}

export async function playGameOverSound() {
  const ctx = await getAudioContext();
  if (!ctx) return;

  const notes = [440, 330, 220, 165];
  const duration = 0.15;

  notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * (duration + 0.02);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  });
}
