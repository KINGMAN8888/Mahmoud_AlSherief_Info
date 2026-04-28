# Deployment Guide — ceo.altawasul-alalami.com

**Stack:** Node.js 20 · Express · SQLite · React 19 · Vite · PM2 · Nginx · Let's Encrypt  
**Repository:** https://github.com/KINGMAN8888/Mahmoud_AlSherief_Info  
**Live URL:** https://ceo.altawasul-alalami.com

---

## Server Layout

```
/var/www/vcard/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── ecosystem.config.js
│   ├── middleware/
│   ├── routes/
│   ├── uploads/          ← user-uploaded images (writable)
│   ├── vcard.db          ← SQLite database (auto-created on first run)
│   └── .env              ← secrets — never commit this file
└── frontend/
    └── dist/             ← built React app served by Nginx
```

---

## Part 1 — DNS (Hostinger Panel)

1. Log in to **hpanel.hostinger.com**
2. Go to **Domains** → click `altawasul-alalami.com` → **DNS / Nameservers**
3. Click **Add Record** and add:

   | Type | Name | Points to        | TTL  |
   |------|------|------------------|------|
   | `A`  | `ceo` | `YOUR_VPS_IP`   | 3600 |

   > Find `YOUR_VPS_IP` in Hostinger → **VPS** → your server → **Overview**

4. Wait 5–15 minutes for DNS to propagate before proceeding to SSL setup

---

## Part 2 — First-Time Server Setup

Connect to the VPS:

```bash
ssh root@YOUR_VPS_IP
```

### 2.1 — System update

```bash
apt update && apt upgrade -y
```

### 2.2 — Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v    # must show v20.x.x
npm -v
```

### 2.3 — Install PM2, Nginx, Certbot

```bash
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx
```

### 2.4 — Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
ufw status
```

### 2.5 — Create directory structure

```bash
mkdir -p /var/www/vcard/backend/uploads
mkdir -p /var/www/vcard/frontend/dist
touch /var/www/vcard/backend/uploads/.gitkeep
```

---

## Part 3 — Build Frontend Locally

Run this on **your own machine** (not the VPS):

```bash
cd "f:\Dashboard my father\frontend"
npm install
npm run build
```

This creates `frontend/dist/` — the compiled React app.

---

## Part 4 — Upload Files to VPS

Run all of the following on **your own machine**:

```bash
# Upload backend source code (excludes .env, node_modules, database)
rsync -avz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='*.db' \
  --exclude='*.db-shm' \
  --exclude='*.db-wal' \
  --exclude='uploads/*' \
  "f:/Dashboard my father/backend/" \
  root@YOUR_VPS_IP:/var/www/vcard/backend/

# Upload built frontend
rsync -avz \
  "f:/Dashboard my father/frontend/dist/" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/

# Upload logo / favicon
rsync -avz \
  "f:/Dashboard my father/frontend/public/altawasul.png" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/
```

---

## Part 5 — Configure Environment on VPS

Back on the **VPS**:

```bash
cd /var/www/vcard/backend
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output. Then create the `.env` file:

```bash
nano /var/www/vcard/backend/.env
```

Paste exactly this content, replacing the placeholder values:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=PASTE_THE_64_CHARACTER_HEX_STRING_HERE
ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHOOSE_A_STRONG_PASSWORD_HERE
CORS_ORIGIN=https://ceo.altawasul-alalami.com
```

Save and close (`Ctrl+X` → `Y` → `Enter`), then lock the file:

```bash
chmod 600 /var/www/vcard/backend/.env
chmod 755 /var/www/vcard/backend/uploads
```

---

## Part 6 — Install Backend Dependencies

```bash
cd /var/www/vcard/backend
npm install --omit=dev
```

---

## Part 7 — Start the Application with PM2

```bash
cd /var/www/vcard/backend
pm2 start ecosystem.config.js
```

Verify it started successfully:

```bash
pm2 status
# Must show:  vcard  |  online
```

Check logs for errors:

```bash
pm2 logs vcard --lines 30
# Must show: Server running on port 3000
```

Enable auto-start on server reboot:

```bash
pm2 save
pm2 startup
# PM2 will print a command — copy it and run it exactly as shown
```

---

## Part 8 — Configure Nginx

Create the Nginx config file:

```bash
nano /etc/nginx/sites-available/ceo-altawasul
```

Paste this entire block:

```nginx
server {
    listen 80;
    server_name ceo.altawasul-alalami.com;

    client_max_body_size 10M;

    root /var/www/vcard/frontend/dist;
    index index.html;

    # API — proxy to Node.js backend
    location /api/ {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        'upgrade';
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded images — proxy to Node.js backend
    location /uploads/ {
        proxy_pass       http://localhost:3000;
        proxy_set_header Host      $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React SPA — all routes fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets for 1 year
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and close (`Ctrl+X` → `Y` → `Enter`), then enable the site:

```bash
# Enable site
ln -s /etc/nginx/sites-available/ceo-altawasul /etc/nginx/sites-enabled/

# Test config syntax
nginx -t
# Must show: syntax is ok / test is successful

# Apply
systemctl reload nginx
```

---

## Part 9 — SSL Certificate (HTTPS)

> DNS must be pointing to the VPS before running this step. Verify with:
> ```bash
> dig ceo.altawasul-alalami.com +short
> # Must return YOUR_VPS_IP
> ```

```bash
certbot --nginx -d ceo.altawasul-alalami.com
```

When prompted:
1. Enter your email address
2. Accept the Terms of Service → `A`
3. Choose whether to share email with EFF → your choice
4. **Select option 2** — Redirect HTTP traffic to HTTPS

Certbot will modify the Nginx config automatically and reload it.

Verify auto-renewal works:

```bash
certbot renew --dry-run
# Must show: Congratulations, all simulated renewals succeeded
```

---

## Part 10 — Final Verification

```bash
# Check PM2 process
pm2 status

# Test the API directly
curl https://ceo.altawasul-alalami.com/api/vcard/public

# Check Nginx logs if anything is wrong
tail -f /var/log/nginx/error.log
```

Open in browser: **https://ceo.altawasul-alalami.com**

---

## Updating the Application

### Frontend only (no restart required)

```bash
# On your local machine:
cd "f:\Dashboard my father\frontend"
npm run build

rsync -avz \
  "f:/Dashboard my father/frontend/dist/" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/

rsync -avz \
  "f:/Dashboard my father/frontend/public/altawasul.png" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/
```

### Backend only

```bash
# On your local machine:
rsync -avz \
  --exclude='node_modules' --exclude='.env' \
  --exclude='*.db' --exclude='*.db-shm' --exclude='*.db-wal' \
  --exclude='uploads/*' \
  "f:/Dashboard my father/backend/" \
  root@YOUR_VPS_IP:/var/www/vcard/backend/

ssh root@YOUR_VPS_IP \
  "cd /var/www/vcard/backend && npm install --omit=dev && pm2 restart vcard"
```

### Full update (frontend + backend)

```bash
# On your local machine:
cd "f:\Dashboard my father\frontend" && npm run build

rsync -avz \
  --exclude='node_modules' --exclude='.env' \
  --exclude='*.db' --exclude='*.db-shm' --exclude='*.db-wal' \
  --exclude='uploads/*' \
  "f:/Dashboard my father/backend/" \
  root@YOUR_VPS_IP:/var/www/vcard/backend/

rsync -avz \
  "f:/Dashboard my father/frontend/dist/" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/

rsync -avz \
  "f:/Dashboard my father/frontend/public/altawasul.png" \
  root@YOUR_VPS_IP:/var/www/vcard/frontend/dist/

ssh root@YOUR_VPS_IP \
  "cd /var/www/vcard/backend && npm install --omit=dev && pm2 restart vcard"
```

### Update from GitHub (on the VPS)

```bash
# On the VPS:
cd /var/www/vcard
git clone https://github.com/KINGMAN8888/Mahmoud_AlSherief_Info.git .
# or if already cloned:
git pull origin main

cd backend && npm install --omit=dev && pm2 restart vcard
```

---

## PM2 Reference

```bash
pm2 status              # list all processes and their state
pm2 logs vcard          # stream live logs
pm2 logs vcard --lines 100   # last 100 log lines
pm2 restart vcard       # restart the app
pm2 stop vcard          # stop without removing
pm2 delete vcard        # remove from PM2 list
pm2 monit               # live CPU / RAM dashboard
```

---

## Nginx Reference

```bash
nginx -t                        # test config syntax
systemctl reload nginx          # apply config changes (no downtime)
systemctl restart nginx         # full restart
tail -f /var/log/nginx/access.log   # live access log
tail -f /var/log/nginx/error.log    # live error log
```

---

## SSL Reference

```bash
certbot renew --dry-run         # test auto-renewal
certbot certificates            # list installed certificates and expiry dates
certbot renew                   # force renewal now
```

---

## Security Checklist

- [ ] `JWT_SECRET` is a randomly generated 64-byte hex string
- [ ] `ADMIN_PASSWORD` is at least 16 characters with mixed case, digits, symbols
- [ ] `/var/www/vcard/backend/.env` permissions are `600`
- [ ] `/var/www/vcard/backend/uploads/` permissions are `755`
- [ ] Firewall allows only ports 22, 80, 443
- [ ] HTTPS is active and HTTP redirects to HTTPS
- [ ] `certbot renew --dry-run` completes without errors
- [ ] No `.env` file or `*.db` files are present in the git repository
