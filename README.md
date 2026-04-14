# Nakama Tic-Tac-Toe

A production-style multiplayer Tic-Tac-Toe web app built with a server-authoritative Nakama backend. The React client only sends move intents; Nakama owns the board, turn order, winner detection, timer enforcement, room lifecycle, and leaderboard updates.

## Live Deliverables

- Frontend URL: add the deployed Vercel/Netlify/GitHub Pages link here
- Nakama endpoint: add the deployed Nakama server URL here
- Source repo: `https://github.com/RiteshTiwari1/Nakama-TicTacToe`

## Tech Stack

- React 19 + Vite + Tailwind CSS for the responsive web client
- Nakama TypeScript runtime for authoritative multiplayer match logic
- Nakama realtime sockets for state updates and move messages
- PostgreSQL for Nakama persistence
- Docker Compose locally, cloud VM deployment for Nakama

## Architecture

```text
React Client
  -> Nakama JS Client + Realtime Socket
  -> RPCs: create_match, find_match
  -> Authoritative Nakama match handler
  -> Validated STATE_UPDATE / TIMER_SYNC / GAME_OVER broadcasts
  -> Nakama leaderboard records
  -> PostgreSQL persistence
```

## What Makes This Server-Authoritative

- The client sends only `{ position }` move intents.
- Nakama rejects moves if it is not the sender's turn, the cell is occupied, the board position is invalid, or the game is not in the `playing` phase.
- The server increments `moveNumber`, tracks `lastMove`, checks win/draw conditions, switches turns, and broadcasts the resulting state.
- Timed mode is enforced in the Nakama match loop, not with a client-only countdown.
- Disconnects during play are handled as forfeits and recorded in the leaderboard.

## Features

- Email/password authentication through Nakama.
- Quick Match automatically pairs players by selected mode.
- Create Room gives a shareable Nakama match ID.
- Classic and Timed modes, with 30-second server-side timeout forfeits.
- Realtime board, player cards, turn status, match ID, move count, and last-move highlight.
- Global leaderboard with win/draw scoring.
- Mobile-first UI with a distinct visual style from the sample mockup.

## Project Structure

```text
|-- docker-compose.yml
|-- server/src/
|   |-- main.ts
|   |-- match_handler.ts
|   |-- match_rpc.ts
|   |-- leaderboard.ts
|   |-- utils.ts
|   |-- constants.ts
|   `-- types.ts
`-- client/src/
    |-- pages/
    |-- components/
    |-- services/
    |-- context/
    `-- types/
```

## Local Setup

```bash
git clone https://github.com/RiteshTiwari1/Nakama-TicTacToe.git
cd Nakama-TicTacToe

cd server
npm install
npm run build
cd ..

docker-compose up -d

cd client
npm install
npm run dev
```

Local URLs:

- Web app: `http://localhost:5173`
- Nakama API: `http://localhost:7350`
- Nakama console: `http://localhost:7351` using `admin` / `password`

## Client Environment

Create `client/.env` for a deployed backend:

```env
VITE_NAKAMA_HOST=your-nakama-domain-or-ip
VITE_NAKAMA_PORT=7350
VITE_NAKAMA_KEY=defaultkey
VITE_NAKAMA_USE_SSL=false
```

Use `VITE_NAKAMA_USE_SSL=true` and port `443` if Nakama is behind HTTPS / a reverse proxy.

## Multiplayer Testing

1. Start Nakama and the client locally.
2. Open the app in a normal browser and create account A.
3. Open the app in incognito or a second browser and create account B.
4. Select the same mode on both clients.
5. Use `Find Random Match`, or create a room on account A and join it from account B using the match ID.
6. Try invalid actions: click out of turn, click an occupied cell, or leave mid-game. The server should reject or resolve these cases.
7. Play a timed match and wait 30 seconds without moving to verify server-side timeout forfeit.

## Deployment Notes

Frontend:

```bash
cd client
npm install
npm run build
```

Deploy `client/dist` to Vercel, Netlify, GitHub Pages, or another static host. Set the `VITE_NAKAMA_*` environment variables in the hosting dashboard.

Nakama:

1. Provision a small cloud VM.
2. Install Docker and Docker Compose.
3. Copy the repo or deployment bundle to the VM.
4. Run `cd server && npm install && npm run build`.
5. Run `docker-compose up -d`.
6. Open the required firewall ports or put Nakama behind a reverse proxy:
   - `7350` for client API/realtime socket access.
   - `7351` for console access, ideally restricted.
7. Update the frontend environment variables to point to the public Nakama endpoint.

## Build Verification

```bash
cd server && npm run build
cd ../client && npm run build
```
