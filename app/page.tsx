'use client';

import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { useEffect, useRef, useState } from 'react';
import { AudioLines, ArrowUpRight, Mic, MicOff, Phone, PhoneOff, LoaderCircle } from 'lucide-react';

const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_0501m6etpx8tef9tp7pyjxmyv86g';
const prompts = ['What dental services do you offer?', 'What is a root canal treatment?', 'I want to request an appointment.'];
type Message = { role: string; text: string };

export default function Home() {
  return <ConversationProvider><Experience /></ConversationProvider>;
}

function Experience() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [muted, setMuted] = useState(false);
  const [permission, setPermission] = useState<'idle' | 'requesting' | 'granted'>('idle');
  const busy = useRef(false);
  const mounted = useRef(true);
  const transcript = useRef<HTMLDivElement>(null);
  const conversation = useConversation({
    micMuted: muted,
    onMessage: message => setMessages(current => [...current, {
      role: message.source === 'user' ? 'You' : 'Receptionist', text: message.message,
    }]),
    onError: () => setError('The voice connection failed. Check your connection and try again.'),
    onDisconnect: () => { setStarting(false); setEnding(false); },
  });
  const connected = conversation.status === 'connected';
  const pending = starting || conversation.status === 'connecting';
  const active = connected || pending || ending;
  const state = ending ? 'disconnecting' : pending ? 'connecting' : connected ? conversation.isSpeaking ? 'speaking' : muted ? 'muted' : 'listening' : 'idle';
  const labels = { idle: 'Ready to connect', connecting: permission === 'requesting' ? 'Waiting for microphone permission' : 'Connecting to receptionist', listening: 'Listening to you', speaking: 'Receptionist is speaking', muted: 'Microphone muted', disconnecting: 'Ending conversation' };
  const endSession = useRef(conversation.endSession);
  endSession.current = conversation.endSession;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; void Promise.resolve().then(() => endSession.current()).catch(() => {}); };
  }, []);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function start() {
    if (busy.current || active) return;
    busy.current = true;
    setStarting(true); setError(''); setMuted(false); setMessages([]);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use a supported browser with HTTPS to access your microphone.');
      setPermission('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      if (!mounted.current) return;
      setPermission('granted');
      await conversation.startSession({ agentId, connectionType: 'webrtc' });
      if (!mounted.current) await endSession.current();
    } catch (cause) {
      if (!mounted.current) return;
      setPermission('idle');
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow access in your browser settings, then try again.'
        : cause instanceof DOMException && cause.name === 'NotFoundError'
          ? 'No microphone found. Connect a microphone and try again.'
          : 'Unable to connect. Check your microphone and internet connection, then try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setStarting(false);
    }
  }

  async function end() {
    if (ending) return;
    setEnding(true);
    try { await conversation.endSession(); }
    catch { setEnding(false); setError('Unable to end the call. Reload this page to close the connection.'); }
  }

  return <main className="demo" data-state={state}>
    <section className="visual" aria-label="AI receptionist avatar">
      <div className="ambient ambient-blue" /><div className="ambient ambient-violet" />
      <div className="brand"><span className="brand-symbol"><AudioLines size={24} /></span><div>Lunatic Dental Clinic<span>AI RECEPTIONIST</span></div></div>
      <div className="portrait">
        <img src="/receptionist.jpg" alt="Female receptionist demo avatar" fetchPriority="high" />
        <div className="portrait-shade" />
        <div className="portrait-border" />
      </div>
      <div className="avatar-caption"><span className="avatar-label">YOUR AI RECEPTIONIST</span><div className="avatar-status"><span className="status-dot" />{labels[state]}</div><div className="wave" aria-hidden="true">{Array.from({ length: 37 }, (_, i) => <i key={i} style={{ height: `${8 + Math.sin(i * 1.7) ** 2 * 26}px`, animationDelay: `${i * .055}s` }} />)}</div></div>
      <span className="visual-note">VOICE EXPERIENCE <span>01 / LIVE DEMO</span></span>
    </section>

    <section className="panel" aria-labelledby="panel-title">
      <div className="panel-heading"><div className="eyebrow"><span /> LIVE VOICE TESTING</div><h1 id="panel-title">Talk to Our<br /><span>AI Receptionist.</span></h1><p>Speak naturally. Ask a question or try a simulated appointment request.</p></div>
      <div className="session-controls">
        <div className="connection-status" role="status"><span className="status-dot" />{labels[state]}<span className="connection-type">{connected ? 'CONNECTED' : pending ? 'CONNECTING' : 'VOICE AI'}</span></div>
        <button className="start-button" disabled={active} onClick={() => void start()}>{pending ? <LoaderCircle className="spinner" size={19} /> : <Phone size={19} />}<span>{pending ? 'Connecting…' : connected ? 'Conversation in progress' : 'Start Conversation'}</span>{!active && <ArrowUpRight size={19} />}</button>
        <div className="secondary-controls"><button disabled={!connected || ending} onClick={() => setMuted(value => !value)} aria-pressed={muted}>{muted ? <MicOff size={16} /> : <Mic size={16} />}{muted ? 'Unmute microphone' : 'Mute microphone'}</button><button className="end-button" disabled={!connected || ending} onClick={() => void end()}><PhoneOff size={16} />{ending ? 'Ending…' : 'End Conversation'}</button></div>
        <p className="permission-note"><Mic size={12} />{permission === 'requesting' ? 'Choose Allow in your browser’s microphone prompt.' : connected ? muted ? 'Your microphone is muted.' : 'Microphone is on. You can speak now.' : 'Microphone permission is requested when you start.'}</p>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      <div className="transcript-wrap"><div className="transcript-heading"><span><AudioLines size={15} /> Live transcript</span><span>{messages.length ? `${messages.length} MESSAGES` : 'YOUR CONVERSATION'}</span></div><div className="transcript" ref={transcript} role="log" aria-live="polite" aria-label="Live conversation transcript">{messages.length ? messages.map((message, index) => <div className={`message ${message.role === 'You' ? 'user' : ''}`} key={index}><small>{message.role}</small><p>{message.text}</p></div>) : <div className="empty-transcript"><AudioLines size={26} /><p>Your conversation starts here.</p><span>Start a call to see the live transcript.</span></div>}</div></div>
      <div className="suggestions"><span>NOT SURE WHAT TO SAY? TRY ASKING</span><ul>{prompts.map(prompt => <li key={prompt}><span>“{prompt}”</span></li>)}</ul></div>
      <p className="notice">This is an AI Receptionist portfolio demonstration. Conversations and appointment requests are simulated. No real appointment is created. <span>Audio is processed by ElevenLabs. Avoid sharing sensitive information.</span></p>
    </section>
  </main>;
}
