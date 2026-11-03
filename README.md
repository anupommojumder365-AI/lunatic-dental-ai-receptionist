# Lunatic Dental Clinic — AI Receptionist

A responsive Next.js portfolio demonstration with a voice-first interface, ElevenLabs React SDK, live transcript, microphone controls and state-based avatar animation.

## Development
Requires Node.js 20.9+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```
The existing clinic agent `agent_0501m6etpx8tef9tp7pyjxmyv86g` is configured as the default. Set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` to override this public identifier. It is a public identifier, not an API key. Never put credentials in NEXT_PUBLIC variables. No agent is created or modified by this app. An authenticated agent requires a server-side signed-session implementation before use; that mode is not implemented.

```sh
npm run typecheck
npm run build
npm start
```

## Interface
Desktop displays a large avatar on the left and the live voice panel on the right. At widths of 900px or less, the avatar sits above the panel. Transcript scrolling stays within the panel. There is no navigation, marketing content, services section, or footer. Suggested prompts are examples to speak aloud, not mock chat controls.

## Architecture
`app/page.tsx` contains the single-screen 55/45 desktop avatar and voice panel and client conversation component inside the official SDK provider. `app/globals.css` supplies the responsive theme, reduced-motion support and connection-driven animations. Tailwind CSS v4 is configured through PostCSS. There is no database or booking integration. Transcripts remain in component memory. ElevenLabs processes conversation audio under its own settings and policies.

Replace `public/receptionist.jpg` to update the prominent avatar. The portrait is a locally stored Unsplash image (photo-1580489944761-15a19d654956), used under the Unsplash license. It represents a demo persona, not a clinic employee or endorsement.

## Deployment
Import this repository into Vercel using the Next.js preset. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID before building. Use the Hobby plan only where eligible. The browser requires HTTPS (or localhost) for microphone access. No private ElevenLabs key belongs in the browser. Vercel production deployment is configured in the anupom3 Hobby workspace. Public agent configuration and WebRTC session-token issuance were verified. A real browser microphone conversation remains untested. The Vercel GitHub App is not installed for this repository, so deployment uses a direct upload of committed source; pushes do not automatically deploy.

## Demo scope
This is an AI Receptionist portfolio demonstration. Conversations and appointment requests are simulated. No real appointment is created.

Voice connection, speaking/listening state, transcript, mute and end-call controls are implemented against the SDK. Permission denial, missing microphone, connection failures, and disconnecting have explicit UI states. No live voice or browser device tests have been performed. The waveform indicates conversation state and is not an audio amplitude measurement or lip synchronization.

## Simli live avatar

The official `simli-client` SDK renders video and plays the existing ElevenLabs agent's generated audio. No second agent or TTS voice is created. The ElevenLabs WebRTC `onAudio` callback emits PCM16 at 48 kHz in the installed SDK; a streaming low-pass converter produces Simli's required 16 kHz mono PCM. ElevenLabs local playback is muted and Simli plays the synchronized audio/video. Agent interruptions clear the Simli buffer; end/disconnect/unmount stop the avatar session. The microphone and transcript still belong to ElevenLabs.

Configure `SIMLI_API_KEY` as a server-only Vercel secret and `NEXT_PUBLIC_SIMLI_AVATAR_ID=9291a1e2-8290-43ab-b5e1-4a5cdf147402`. Never prefix the key with NEXT_PUBLIC. `POST /api/simli/session` calls the official Simli token API with the fixed avatar, a 10-minute maximum session and 2-minute idle timeout. It returns only a short-lived session token and rejects cross-origin requests. This is a public portfolio demo, not an authenticated or globally rate-limited service; monitor provider usage limits. No provider error bodies or keys are sent to clients.

The avatar starts before the ElevenLabs conversation so initial voice audio is not lost. If avatar startup fails, the combined session does not start; there is no fake animated fallback. An idle placeholder is explicitly labeled. Browsers that block audio playback show an Enable avatar audio button.

```sh
node --experimental-strip-types --test tests/pcm.test.mjs
```

Official reference: https://github.com/simliai/simli-client and https://docs.simli.com/api-reference/javascript . Live avatar rendering, acoustic synchronization and physical microphone behavior require real-browser verification; audio-conversion unit tests and production builds do not establish those results.
