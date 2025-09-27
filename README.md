# Weather-App-Chatbot

A lightweight React + Node weather chatbot that fetches realtime weather data from free APIs and returns context-aware conversational responses. Designed for local development and deployed to AWS.

Why this project
- Natural chat interface for quick weather queries
- Real-time API-backed weather data
- Minimal, composable frontend components with TypeScript + React
- Small Node backend acting as an API/agent layer

Main features
- Conversational UI with message bubbles, input, and voice/locale helpers
- Weather lookups (current, location-aware)
- Modular front-end components (ChatInput, ChatMessage, WeatherChat)
- Simple Node server to proxy and orchestrate API calls

Tech stack
- Frontend: React + TypeScript, Vite, Tailwind (UI components under src/components)
- Backend: Node (Express-style agent files in /server)
- Deployment: Hosted on AWS (static frontend + API backend)

Quick start (local)
1. Clone
   git clone <repo>
2. Install dependencies
   cd client
   npm install
   cd ../server
   npm install
3. Configure environment
   - Create and populate:
     - server/.env (e.g. WEATHER_API_KEY=..., PORT=5000)
     - client/.env (e.g. VITE_API_BASE_URL=http://localhost:5000)
4. Run (dev)
   - From server:
     cd server
     npm run dev
   - From client:
     cd client
     npm run dev
5. Open http://localhost:5173 (or the port Vite prints)

Production build & deploy (summary)
- Build frontend: cd client && npm run build
- Serve built assets via the Node server, S3 + CloudFront, or any static host
- Ensure server has required env vars (API keys, port) and is reachable by the frontend

Environment variables
- server/.env (example)
  - WEATHER_API_KEY — key for the weather data provider
  - PORT — server port
- client/.env (example)
  - VITE_API_BASE_URL — backend base URL used by the frontend

Project layout (top-level)
- client/ — React frontend (src/, public/, index.html)
- server/ — Node backend (index.js, agent*.js)
- .env — local env stubs

Contributing
- Keep changes small and focused
- Add/update unit tests for new logic
- Open a PR with a short description and screenshots when UI changes

License
- MIT (or add your chosen license file)

Contact
- Maintain non-sensitive config locally. For deployment questions, consult AWS docs for S3/CloudFront or Elastic Beanstalk / ECS based