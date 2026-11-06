// Browser audio helpers. Chrome records WebM/Opus, Safari records MP4/AAC, Firefox records Ogg, and Gemini does not
// reliably accept all of them. So every recording is decoded in the browser and re-encoded as 16 kHz mono WAV, a
// format every browser can play back and every speech model understands.

const TARGET_RATE = 16_000;

function encodeWav(samples: Float32Array, rate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // bytes per second
  view.setUint16(32, 2, true); // bytes per sample frame
  view.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, s)) * 32767), true));
  return new Blob([buffer], { type: "audio/wav" });
}

// rms = how loud the recording is overall (0-1). Near zero means the microphone captured silence.
export async function blobToWav16k(blob: Blob): Promise<{ wav: Blob; rms: number }> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    // Rendering through a 1-channel, 16 kHz offline context does the resampling and the stereo-to-mono mix for us.
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * TARGET_RATE)), TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const samples = (await offline.startRendering()).getChannelData(0);
    let sum = 0;
    for (const s of samples) sum += s * s;
    return { wav: encodeWav(samples, TARGET_RATE), rms: Math.sqrt(sum / Math.max(1, samples.length)) };
  } finally {
    await context.close();
  }
}

export const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
