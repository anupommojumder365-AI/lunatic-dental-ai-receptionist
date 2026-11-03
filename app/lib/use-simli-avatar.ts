'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SimliClient } from 'simli-client';
import { Pcm48To16 } from './pcm';

export function useSimliAvatar(onFailure: () => void) {
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const client = useRef<SimliClient | null>(null);
  const generation = useRef(0);
  const ready = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const converter = useRef(new Pcm48To16());
  const failure = useRef(onFailure);
  failure.current = onFailure;
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'error'>('idle');
  const [speaking, setSpeaking] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const playAudio = useCallback(() => {
    if (audio.current?.srcObject) void audio.current.play().then(() => setPlaybackBlocked(false)).catch(() => setPlaybackBlocked(true));
  }, []);

  const stop = useCallback(async () => {
    generation.current++;
    controller.current?.abort(); controller.current = null;
    ready.current = false;
    const previous = client.current; client.current = null;
    converter.current.reset();
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    if (video.current) video.current.srcObject = null;
    if (previous) await previous.stop().catch(() => {});
  }, []);

  const fail = useCallback(() => {
    void stop(); setStatus('error'); setSpeaking(false); failure.current();
  }, [stop]);

  const start = useCallback(async () => {
    await stop();
    const attempt = generation.current;
    setStatus('connecting'); setSpeaking(false); setPlaybackBlocked(false);
    const abort = new AbortController(); controller.current = abort;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await fetch('/api/simli/session', { method: 'POST', signal: abort.signal });
      if (!response.ok) throw new Error('Avatar session unavailable');
      const { session_token } = await response.json();
      const { SimliClient, LogLevel } = await import('simli-client');
      if (attempt !== generation.current || !video.current || !audio.current) throw new Error('Avatar startup canceled');
      const instance = new SimliClient(session_token, video.current, audio.current, null, LogLevel.CRITICAL);
      client.current = instance;
      const current = () => generation.current === attempt;
      instance.on('speaking', () => { if (current()) setSpeaking(true); });
      instance.on('silent', () => { if (current()) setSpeaking(false); });
      instance.on('error', () => { if (current()) fail(); });
      instance.on('stop', () => { if (current()) fail(); });
      await Promise.race([
        instance.start(),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Avatar startup timed out')), 30000); }),
      ]);
      if (!current()) throw new Error('Avatar startup canceled');
      ready.current = true; setStatus('ready');
    } catch (error) {
      if (attempt === generation.current) { await stop(); setStatus('error'); }
      throw error;
    } finally { clearTimeout(timeout); }
  }, [stop, fail]);

  const sendAudio = useCallback((base64: string) => {
    if (!ready.current || !client.current) return;
    try {
      const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
      const pcm = converter.current.convert(bytes);
      if (pcm.length) client.current.sendAudioData(pcm);
    } catch { fail(); }
  }, [fail]);

  const interrupt = useCallback(() => {
    converter.current.reset();
    try { if (ready.current) client.current?.ClearBuffer(); }
    catch { fail(); }
  }, [fail]);

  const finish = useCallback(() => {
    void stop(); setStatus('idle'); setSpeaking(false); setPlaybackBlocked(false);
  }, [stop]);
  useEffect(() => () => { void stop(); }, [stop]);
  return { video, audio, status, speaking, start, finish, sendAudio, interrupt, fail, playbackBlocked, playAudio };
}
