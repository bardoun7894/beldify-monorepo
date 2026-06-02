# Beldify Production Deployment Guide

## Architecture
| Domain | Service | Port |
|--------|---------|------|
| `www.beldify.com` | Next.js Frontend | 3100 |
| `pro.beldify.com` | Laravel Backend API | 7894 |
| `pro.beldify.com/app` | WebSocket (Reverb) | 8082 |

---

## Step 1: SSH into VPS
```bash
ssh root@91.230.110.187
```

## Step 2: Install Nginx (if not installed)
```bash
apt update && apt install nginx -y
```

## Step 3: Copy Nginx configs
```bash
# Copy the config files to nginx sites-available
cp /var/local/beldify-monorepo/nginx/www.beldify.com.conf /etc/nginx/sites-available/
cp /var/local/beldify-monorepo/nginx/pro.beldify.com.conf /etc/nginx/sites-available/

# Create symlinks to enable sites
ln -sf /etc/nginx/sites-available/www.beldify.com.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/pro.beldify.com.conf /etc/nginx/sites-enabled/

# Test configuration and reload
nginx -t && systemctl reload nginx
```

## Step 4: Open firewall ports
```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8082/tcp  # WebSocket
ufw reload
```

## Step 5: Install SSL certificates
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d www.beldify.com -d beldify.com -d pro.beldify.com
```

## Step 6: Restart Docker containers
```bash
cd /var/local/beldify-monorepo/beldify-frontend
docker-compose down && docker-compose up -d

cd /var/local/beldify-monorepo/beldify-backend
docker-compose down && docker-compose up -d
```

## Step 7: Verify
- Frontend: https://www.beldify.com
- Backend API: https://pro.beldify.com/api/health
- WebSocket: wss://pro.beldify.com/app

---

## Troubleshooting

**Connection Refused:**
```bash
docker ps                    # Check containers
systemctl status nginx       # Check Nginx
docker logs beldify-frontend # Frontend logs
docker logs beldify-backend  # Backend logs
```

**CORS Errors:**
Backend CORS at `config/cors.php` includes `www.beldify.com`.

**WebSocket not connecting:**
```bash
docker exec beldify-backend php artisan reverb:start
```
