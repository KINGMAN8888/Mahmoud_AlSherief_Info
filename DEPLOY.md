# VPS Deployment Guide

## Requirements

- Node.js 18+ (20 LTS recommended)
- PM2: `npm install -g pm2`
- Nginx
- A domain name (optional but recommended for SSL)

## File Structure on VPS

```
/var/www/vcard/
├── backend/          ← server + API + SQLite DB
│   ├── uploads/      ← uploaded images
│   └── vcard.db      ← SQLite database (auto-created)
└── frontend/
    └── dist/         ← built React app
```

## Deployment Steps

### 1. Upload project files to VPS

```bash
# From your local machine:
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='*.db' \
  ./backend/ user@your-vps:/var/www/vcard/backend/
rsync -avz ./frontend/dist/ user@your-vps:/var/www/vcard/frontend/dist/
```

### 2. Install backend dependencies on VPS

```bash
cd /var/www/vcard/backend
npm install --production
```

### 3. Create and configure .env

```bash
cd /var/www/vcard/backend
cp .env.example .env
nano .env
```

Set these values:

```
PORT=3000
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your strong password>
CORS_ORIGIN=https://your-domain.com
```

### 4. Start with PM2

```bash
cd /var/www/vcard/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # follow the printed command to enable auto-start on reboot
```

### 5. Nginx configuration

Create `/etc/nginx/sites-available/vcard`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 6M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/vcard /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. SSL with Let's Encrypt (recommended)

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Auto-renewal is configured automatically.

## Updating the App

### Update backend code only

```bash
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='*.db' \
  ./backend/ user@your-vps:/var/www/vcard/backend/
pm2 restart vcard
```

### Update frontend only

```bash
cd frontend && npm run build
rsync -avz ./frontend/dist/ user@your-vps:/var/www/vcard/frontend/dist/
# No restart needed — Express serves static files directly
```

### Full update

```bash
# Run from project root
npm run build
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='*.db' \
  ./backend/ user@your-vps:/var/www/vcard/backend/
rsync -avz ./frontend/dist/ user@your-vps:/var/www/vcard/frontend/dist/
ssh user@your-vps "cd /var/www/vcard/backend && npm install --production && pm2 restart vcard"
```

## PM2 Commands

```bash
pm2 status          # check if running
pm2 logs vcard      # view logs
pm2 restart vcard   # restart
pm2 stop vcard      # stop
```

## Security Checklist

- [ ] `JWT_SECRET` is a random 64+ byte hex string (not the example value)
- [ ] `ADMIN_PASSWORD` is strong and unique
- [ ] Firewall allows only ports 22, 80, 443
- [ ] SSL is enabled
- [ ] `backend/.env` permissions: `chmod 600 .env`
- [ ] `backend/uploads/` permissions: `chmod 755 uploads/`
