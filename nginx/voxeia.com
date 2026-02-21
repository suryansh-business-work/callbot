# ═══════════════════════════════════════════════════════════════════
#  Voxeia.com — Nginx Reverse Proxy Configuration
#  Place this at: /etc/nginx/sites-available/voxeia.com
#  Symlink to:    /etc/nginx/sites-enabled/voxeia.com
# ═══════════════════════════════════════════════════════════════════

# ─── Rate Limiting ────────────────────────────────────────────────
limit_req_zone $binary_remote_addr zone=voxeia_general:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=voxeia_api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=voxeia_site:10m rate=15r/s;

# ═══════════════════════════════════════════════════════════════════
#  voxeia.com → SaaS Marketing Website (port 9006)
# ═══════════════════════════════════════════════════════════════════
server {
    listen 80;
    server_name voxeia.com www.voxeia.com;

    # Redirect to HTTPS (after Certbot setup)
    # return 301 https://$host$request_uri;

    location / {
        limit_req zone=voxeia_site burst=30 nodelay;

        proxy_pass http://127.0.0.1:9006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }
}

# ═══════════════════════════════════════════════════════════════════
#  app.voxeia.com → UI Dashboard (port 9003)
# ═══════════════════════════════════════════════════════════════════
server {
    listen 80;
    server_name app.voxeia.com;

    location / {
        limit_req zone=voxeia_general burst=40 nodelay;

        proxy_pass http://127.0.0.1:9003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://voxeia.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
}

# ═══════════════════════════════════════════════════════════════════
#  api.voxeia.com → Backend API (port 9004)
# ═══════════════════════════════════════════════════════════════════
server {
    listen 80;
    server_name api.voxeia.com;

    client_max_body_size 50M;

    location / {
        limit_req zone=voxeia_api burst=50 nodelay;

        proxy_pass http://127.0.0.1:9004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;

        # CORS headers
        add_header Access-Control-Allow-Origin "https://app.voxeia.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;

        # Handle preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://app.voxeia.com";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization";
            add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            return 204;
        }

        # Security headers
        add_header X-Content-Type-Options "nosniff" always;
    }
}

# ═══════════════════════════════════════════════════════════════════
#  ws.voxeia.com → WebSocket Server (port 9005)
# ═══════════════════════════════════════════════════════════════════
server {
    listen 80;
    server_name ws.voxeia.com;

    location / {
        proxy_pass http://127.0.0.1:9005;
        proxy_http_version 1.1;

        # WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Long timeouts for persistent WS connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        # CORS
        add_header Access-Control-Allow-Origin "https://app.voxeia.com" always;
        add_header Access-Control-Allow-Credentials "true" always;
    }
}
