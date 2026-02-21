# Twilio Call Bot

Twilio based phone call system with **AI-powered natural voices** - make outbound calls using Twilio API with Amazon Polly Neural voices that sound human!

## ✨ Features

- 🎙️ **6 Natural AI Voices** - Amazon Polly Neural voices (US/UK accents, male/female)
- 🗣️ **Human-like Speech** - SSML-enhanced with natural pauses, prosody, and intonation
- 📞 **Simple Call Interface** - Easy-to-use form for making calls
- 📊 **Call Logs** - View call history with pagination, filtering, and search
- 🎯 **Message Templates** - Example messages for natural-sounding calls
- 🔒 **Secure** - Environment-based credential management

## 📚 Documentation

- **[TWILIO_SETUP.md](TWILIO_SETUP.md)** - Setup guide for Twilio credentials
- **[VOICE_GUIDE.md](VOICE_GUIDE.md)** - How to write natural-sounding messages & voice selection tips

## Project Structure

```
├── server/              # Node.js + TypeScript backend
│   └── src/
│       ├── calls/       # Call feature (controllers, services, routes, validators, models)
│       └── config/      # Environment config & interfaces
├── ui/                  # React + TypeScript + MUI frontend
│   └── src/
│       ├── api/         # Axios client
│       ├── components/  # Shared components (Header, Footer, Breadcrumb)
│       ├── theme/       # MUI theme config
│       └── tools/
│           └── calls/   # Call feature UI (form, logs table, components)
├── saas-website/        # Astro + Tailwind CSS marketing website (port 9006)
│   └── src/
│       ├── components/  # Navbar, Footer
│       ├── layouts/     # Shared Layout
│       ├── pages/       # All pages (home, about, use-cases, pricing, contact, legal)
│       └── styles/      # Global CSS + Tailwind theme
```

## Environment Variables

⚠️ **First Time Setup**: See [TWILIO_SETUP.md](TWILIO_SETUP.md) for detailed instructions on getting your Twilio credentials.

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (from Twilio Console) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token (from Twilio Console) |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number in E.164 format (e.g., +1234567890) |
| `PORT` | Server port (default: 5000) |
| `CLIENT_URL` | Frontend URL for CORS (default: http://localhost:3000) |

## Getting Started

### Server
```bash
cd server
npm install
npm run dev
```

### UI
```bash
cd ui
npm install
npm run dev
```

### SaaS Website
```bash
cd saas-website
npm install
npm run dev
```

Server runs on `http://localhost:5000`, UI runs on `http://localhost:3000`, SaaS website runs on `http://localhost:9006`.

### Docker Compose (All Services)
```bash
docker compose up -d
```

| Service | Port |
|---|---|
| MongoDB | 27017 |
| Server (API) | 9004 |
| WebSocket | 9005 |
| UI | 9003 |
| SaaS Website | 9006 |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/calls` | Make an outbound call |
| `GET` | `/api/calls/logs` | Get call history with pagination & filters |
| `GET` | `/api/health` | Health check |
