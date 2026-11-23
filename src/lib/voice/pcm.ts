/**
 * The microphone's audio, as ilovelawyer-api's live dictation takes it: 16-bit little-endian mono
 * PCM at 16 kHz. Browsers record at the device's rate (usually 44.1 or 48 kHz) in floats, so each
 * block is averaged down to the lower rate and turned into 16-bit samples. Averaging over each output
 * sample's span also filters out the highs that would otherwise fold back as noise.
 */

export const LIVE_SAMPLE_RATE = 16_000;

export class PcmDownsampler {
  /** Input samples per output sample. */
  private readonly step: number;
  /** Where the next output sample starts, in input samples, counted from the start of `pending`. */
  private position = 0;
  /** Input left over from the last block, not yet a whole output sample. */
  private pending = new Float32Array(0);

  constructor(inputRate: number, outputRate = LIVE_SAMPLE_RATE) {
    if (inputRate < outputRate) throw new Error(`Can't downsample ${inputRate} Hz to ${outputRate} Hz`);
    this.step = inputRate / outputRate;
  }

  /** The next block of input, as the output samples it completes. */
  push(block: Float32Array): Int16Array {
    const input = new Float32Array(this.pending.length + block.length);
    input.set(this.pending);
    input.set(block, this.pending.length);

    const count = Math.floor((input.length - this.position) / this.step);
    const out = new Int16Array(count);
    let position = this.position;
    for (let i = 0; i < count; i++) {
      const start = Math.floor(position);
      const end = Math.min(input.length, Math.floor(position + this.step));
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j]!;
      const sample = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
      out[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
      position += this.step;
    }

    const used = Math.floor(position);
    this.pending = input.slice(used);
    this.position = position - used;
    return out;
  }
}
