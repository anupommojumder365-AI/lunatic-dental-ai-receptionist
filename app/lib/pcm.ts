/** Streaming, low-pass FIR conversion: ElevenLabs WebRTC PCM16/48kHz -> Simli PCM16/16kHz. */
export class Pcm48To16 {
  private history = new Float64Array(63);
  private cursor = 0;
  private phase = 0;
  private pendingByte: number | null = null;
  private coefficients = Float64Array.from({ length: 63 }, (_, i) => {
    const x = i - 31;
    const cutoff = 7000 / 48000;
    return (x === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * x) / (Math.PI * x)) * (.54 - .46 * Math.cos(2 * Math.PI * i / 62));
  });
  constructor() {
    const sum = this.coefficients.reduce((a, b) => a + b, 0);
    this.coefficients = this.coefficients.map(value => value / sum);
  }
  reset() { this.history.fill(0); this.cursor = 0; this.phase = 0; this.pendingByte = null; }
  convert(bytes: Uint8Array): Uint8Array {
    const samples: number[] = [];
    for (const byte of bytes) {
      if (this.pendingByte === null) { this.pendingByte = byte; continue; }
      let sample = this.pendingByte | (byte << 8);
      if (sample >= 32768) sample -= 65536;
      this.pendingByte = null;
      this.history[this.cursor] = sample;
      this.cursor = (this.cursor + 1) % 63;
      if (++this.phase < 3) continue;
      this.phase = 0;
      let value = 0;
      for (let i = 0; i < 63; i++) value += this.history[(this.cursor - 1 - i + 126) % 63] * this.coefficients[i];
      samples.push(Math.max(-32768, Math.min(32767, Math.round(value))));
    }
    const output = new Uint8Array(samples.length * 2);
    const view = new DataView(output.buffer);
    samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));
    return output;
  }
}
