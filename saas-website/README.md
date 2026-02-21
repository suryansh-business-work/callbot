# CallBotAI - SaaS Website

Marketing and product website for **CallBotAI** — built with [Astro](https://astro.build), TypeScript, and Tailwind CSS v4.

## Tech Stack

- **Astro v5** — Static site generator
- **Tailwind CSS v4** — Utility-first CSS (via `@tailwindcss/vite`)
- **TypeScript** — Strict type checking
- **Nginx** — Production static file serving with rate limiting & CORS

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, stats, features, how-it-works, CTA |
| `/about` | About — mission, values, team |
| `/use-cases` | Use Cases — Travel, E-Commerce, Real Estate, Healthcare, Finance, Education |
| `/pricing` | Pricing — 3 tiers with INR/USD toggle, one-time integration cost |
| `/contact` | Contact — form + contact info |
| `/privacy-policy` | Privacy Policy |
| `/terms` | Terms & Conditions |
| `/cookies` | Cookie Policy |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 9006)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 9006 |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run Astro type checker (`astro check`) |
| `npm run lint` | Check code formatting with Prettier |
| `npm run format` | Auto-format code with Prettier |

## Docker

### Build & Run Standalone

```bash
docker build -t callbotai-website .
docker run -p 9006:80 callbotai-website
```

### With Docker Compose (from project root)

```bash
docker compose up saas-website -d
```

The website will be available at `http://localhost:9006`.

## Nginx Configuration

The production Docker image uses Nginx with:

- **Rate Limiting** — 10 req/s per IP with burst of 20 (protects against abuse)
- **CORS Headers** — `Access-Control-Allow-Origin: *` for GET/HEAD/OPTIONS
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- **Gzip Compression** — For text, CSS, JS, JSON, SVG
- **Static Asset Caching** — 1 year cache for immutable assets (JS, CSS, images, fonts)

## Project Structure

```
saas-website/
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── use-cases.astro
│   │   ├── pricing.astro
│   │   ├── contact.astro
│   │   ├── privacy-policy.astro
│   │   ├── terms.astro
│   │   └── cookies.astro
│   └── styles/
│       └── global.css
├── public/
├── Dockerfile
├── nginx.conf
├── package.json
├── astro.config.mjs
└── tsconfig.json
```
