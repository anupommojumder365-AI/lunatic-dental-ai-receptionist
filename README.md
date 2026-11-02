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

## Architecture
`app/page.tsx` contains the responsive landing page and client conversation component inside the official SDK provider. `app/globals.css` supplies the responsive theme, reduced-motion support and connection-driven animations. Tailwind CSS v4 is configured through PostCSS. There is no database or booking integration. Transcripts remain in component memory. ElevenLabs processes conversation audio under its own settings and policies.

Replace `public/receptionist.jpg` to update both portrait placements. The portrait is a locally stored Unsplash image (photo-1580489944761-15a19d654956), used under the Unsplash license. It represents a demo persona, not a clinic employee or endorsement.

## Deployment
Import this repository into Vercel using the Next.js preset. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID before building. Use the Hobby plan only where eligible. The browser requires HTTPS (or localhost) for microphone access. No private ElevenLabs key belongs in the browser. This project has not yet been deployed or tested with a real agent.

## Demo scope
This is an AI Receptionist portfolio demonstration. Conversations and appointment requests are simulated. No real appointment is created.

Voice connection, speaking/listening state, transcript, mute and end-call controls are implemented against the SDK. Missing configuration produces an explicit error. No live voice or browser device tests have been performed. The waveform indicates conversation state and is not an audio amplitude measurement or lip synchronization.
