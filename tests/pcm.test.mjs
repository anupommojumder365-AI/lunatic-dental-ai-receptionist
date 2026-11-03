import test from 'node:test';
import assert from 'node:assert/strict';
import { Pcm48To16 } from '../app/lib/pcm.ts';
const encode = (samples) => {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => view.setInt16(index * 2, sample, true));
  return bytes;
};
const decode = (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.length / 2 }, (_, i) => view.getInt16(i * 2, true));
};
test('one second of 48k PCM becomes one second of 16k PCM', () => {
  assert.equal(new Pcm48To16().convert(encode(Array(48000).fill(0))).length, 32000);
});
test('arbitrary byte chunk boundaries preserve the exact stream', () => {
  const input = encode(Array.from({ length: 4800 }, (_, i) => Math.round(20000 * Math.sin(i * .13))));
  const expected = new Pcm48To16().convert(input);
  const converter = new Pcm48To16(); const chunks = [];
  for (let i = 0; i < input.length; i += 113) chunks.push(...converter.convert(input.slice(i, i + 113)));
  assert.deepEqual(Uint8Array.from(chunks), expected);
});
test('filter preserves speech-band energy and suppresses aliasing', () => {
  const rms = (frequency) => {
    const input = encode(Array.from({ length: 48000 }, (_, i) => Math.round(20000 * Math.sin(2 * Math.PI * frequency * i / 48000))));
    const out = decode(new Pcm48To16().convert(input)).slice(100);
    return Math.sqrt(out.reduce((sum, sample) => sum + sample * sample, 0) / out.length);
  };
  assert.ok(rms(1000) > 13000);
  assert.ok(rms(12000) < 300);
});
test('interruption reset removes buffered speech and byte/phase state', () => {
  const converter = new Pcm48To16(); converter.convert(encode(Array(100).fill(30000))); converter.convert(new Uint8Array([255])); converter.reset();
  assert.deepEqual(converter.convert(encode(Array(300).fill(0))), new Uint8Array(200));
});
