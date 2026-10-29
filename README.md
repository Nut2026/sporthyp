# Sporthyp

### The high starts now.

[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB.svg?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Uses TypeScript](https://img.shields.io/badge/Uses-TypeScript-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Powered by Vite](https://img.shields.io/badge/Powered%20by-Vite-646CFF.svg?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![AI: Groq](https://img.shields.io/badge/AI-Groq-FF6B6B.svg?style=flat-square&logo=groq&logoColor=white)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

## Vision & Mission

**Vision**: A world that understands why it can't look away — where the machinery of manufactured obsession is felt, not just explained.

**Mission**: To compress the emotional lifecycle of sports fandom — from blissful ignorance to euphoric obsession to quiet dissipation — into a single intense session that shows, through experience, how modern sports culture consumes attention, exploits scarcity, and manufactures meaning.

## About Sporthyp

Sporthyp is a 15–20 minute narrative-driven web experience: an audio-psychological simulation of sports obsession. No actual sporting knowledge is required — you cannot control the match, only how you participate in it.

Each run is one unique match broken into five psychological states. Time pressure is the primary mechanic: countdowns close ticket windows, seats vanish while you hesitate, stock drains while you browse, and the final whistle hands you over to the crash. The look is black-and-white neo-brutalism — no gradients, no rounded corners, no sugar-coating — with colour used only for emotional punctuation: glowing timers, red alerts, blinding goal flashes.

### How I built Sporthyp

**Day 1**: **Planning**. I wrote [the PRD](docs/PRD.md) first: the design philosophy (stark monochrome with strategic colour), the five-phase core loop, every countdown and timing window, the virtual economy, and the exact Groq prompts each phase would need.

**Day 2–3**: **The skeleton**. After breaking the PRD into phases, I programmed Sporthyp incrementally:
- The app shell, the Zustand store, and the entry form that names your match
- Phase 1: the notification bombardment, live media feed, reaction counters, and Countdown #1
- Phase 2: the seat map that fills itself in real time, the bot check, the fake queue, and the 50/50 server error
- Phase 3: the merch grid with draining stock, the commute, the concourse queue, the ticket scanner, and the concessions
- Phase 4: the generated commentary engine, live scoreboard, VAR freezes, goal shakes, and full-time confetti
- Phase 5: the post-match feed, the slow desaturation, and the reset loop

**Day 4**: **Polishing**. I spent the day playing Sporthyp start to finish to tune the rhythm — countdown lengths, event pacing (3–10s between commentary beats), notification drip speed, the fade curve — and to make sure every phase degrades gracefully. Content generation talks to Groq through a Supabase Edge Function, with local template fallbacks so a missing API key or dead connection never breaks a session.

All in all, Sporthyp had to feel less like a website and more like being consumed by one.

## Features

### Phase 1: The Spark
- Chat-style entry: your name, your country, the opponent, the match
- 40 generated headlines raining down as push notifications
- 50-post media feed with climbing reactions, ageing timestamps, and clickable counters
- Countdown #1 (4:00–8:00, yellow at 50s, flashing red at 20s) — miss it and the cycle restarts
- $2,000 virtual economy with an ATM that pays out $5 at a time

### Phase 2: The Scarcity Hunt
- 100-seat map where green seats turn red in real time — the best go fastest
- Bot check with a 10-second timer, then the manufactured "Loading Queue" panic
- 50% chance of "Our servers are experiencing intense traffic"
- Half of accepted purchases fail — the other half earn a confetti burst: **TICKET SECURED, SECTOR X, ROW Y**

### Phase 3: The Gateway
- Merch grid: 50 themed items, 20 shown, live stock draining from 1000 to 0
- Commute simulator: Self-Drive ($50, slow) or Official Shuttle ($150, dedicated lane)
- Concourse queue and a ticket scanner to align — verified unlocks the stands
- Countdown #3 decides everything: too late = **BANNED FROM ENTRY**

### Phase 4: The War
- Generated 20–35 event commentary with a live scoreboard updating per event
- VAR check → 3-second full-screen freeze, then confirmed or overturned
- Cheerboard: ROAR | CHANT | BOO | GASP | GROAN
- Goal shakes, full-time confetti, and the hand-off to the crash

### Phase 5: The Crash & The Fade
- Post-match reaction feed draining into a 30-second desaturation
- New posts slow to a crawl, then stop entirely
- Pitch black. One line: "The high has passed." — and the button to do it all again

## License

Sporthyp is licensed under the MIT License - please see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- **The PRD** — [docs/PRD.md](docs/PRD.md) — for being the whole design in one document
- **Groq** for fast, free LLM inference behind every generated headline, post, and commentary beat
- **Supabase** for hosting the edge function that keeps the API key off the client
- **canvas-confetti** and **framer-motion** for the shakes, freezes, and bursts

Sporthyp wouldn't be here without them!

## Future Roadmap

- [ ] Layered stadium audio wired to the cheerboard (intensity scaling on repeat clicks)
- [ ] Home/away fan audio reactions driven by commentary events (roars, groans, chants)
- [ ] Haptic feedback on the ticket scanner and goal moments
- [ ] Persisted "high score": fastest ticket, biggest comeback, longest unbeaten run
- [ ] Accessibility pass: reduced-motion mode, screen-reader-friendly feed

And many more through experiments, exposure, feedback, and tiny "aha!" moments

## 🎉 Show Your Support

If you find Sporthyp interesting, feel free to:
- ⭐ Star the repository
- 🍴 Fork it to explore
- 👀 Watch for updates
- 📢 Share it with others who can't stop checking the score

---

> **Built with ❤️ for one more match, one more scroll, one more high.**
