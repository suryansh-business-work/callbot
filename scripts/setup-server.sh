#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  Voxeia.com — Server Setup Script
#  Run on fresh VPS: ssh root@148.135.136.107
#  Usage: bash scripts/setup-server.sh
# ═══════════════════════════════════════════════════════════════════

set -e

echo "🚀 Setting up Voxeia.com server..."

# ─── Update system ────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ─── Install Docker ───────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker installed."
else
  echo "✅ Docker already installed."
fi

# ─── Install Docker Compose (plugin) ─────────────────────────────
if ! docker compose version &> /dev/null; then
  echo "📦 Installing Docker Compose plugin..."
  apt-get install -y docker-compose-plugin
  echo "✅ Docker Compose installed."
else
  echo "✅ Docker Compose already installed."
fi

# ─── Install Nginx ────────────────────────────────────────────────
if ! command -v nginx &> /dev/null; then
  echo "📦 Installing Nginx..."
  apt-get install -y nginx
  systemctl enable nginx
  systemctl start nginx
  echo "✅ Nginx installed."
else
  echo "✅ Nginx already installed."
fi

# ─── Install Certbot for SSL ─────────────────────────────────────
if ! command -v certbot &> /dev/null; then
  echo "📦 Installing Certbot..."
  apt-get install -y certbot python3-certbot-nginx
  echo "✅ Certbot installed."
else
  echo "✅ Certbot already installed."
fi

# ─── Install Git ─────────────────────────────────────────────────
if ! command -v git &> /dev/null; then
  apt-get install -y git
fi

# ─── Setup firewall ──────────────────────────────────────────────
echo "🔒 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Firewall configured."

# ─── Clone repo ──────────────────────────────────────────────────
APP_DIR=/root/voxeia

if [ ! -d "$APP_DIR" ]; then
  echo "📥 Cloning repository..."
  echo "Run: git clone <your-repo-url> $APP_DIR"
  echo "Then run this script again."
  exit 0
fi

# ─── Copy Nginx config ───────────────────────────────────────────
echo "📝 Setting up Nginx site config..."
cp "$APP_DIR/nginx/voxeia.com" /etc/nginx/sites-available/voxeia.com

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Enable voxeia.com site
ln -sf /etc/nginx/sites-available/voxeia.com /etc/nginx/sites-enabled/voxeia.com

# Test nginx config
nginx -t
systemctl reload nginx
echo "✅ Nginx configured."

# ─── SSL Certificates ────────────────────────────────────────────
echo "🔐 Getting SSL certificates..."
certbot --nginx \
  -d voxeia.com \
  -d www.voxeia.com \
  -d app.voxeia.com \
  -d api.voxeia.com \
  -d ws.voxeia.com \
  --non-interactive \
  --agree-tos \
  -m admin@voxeia.com

echo "✅ SSL certificates installed."

# ─── Deploy with Docker Compose ──────────────────────────────────
echo "🐳 Starting Docker services..."
cd "$APP_DIR"

# Check if .env exists
if [ ! -f server/.env ]; then
  echo "⚠️  server/.env not found!"
  echo "Create it from server/.env.example before deploying."
  exit 1
fi

docker compose -f docker-compose.prod.yml down --remove-orphans
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Voxeia.com deployment complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  🌐 Website:   https://voxeia.com"
echo "  📱 App:       https://app.voxeia.com"
echo "  🔌 API:       https://api.voxeia.com"
echo "  🔗 WebSocket: wss://ws.voxeia.com"
echo ""
echo "  📊 Check status: docker compose -f docker-compose.prod.yml ps"
echo "  📜 View logs:    docker compose -f docker-compose.prod.yml logs -f"
echo ""
