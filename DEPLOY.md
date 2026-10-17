# Deploying AUS Prep on a DigitalOcean droplet

A plain Node server behind Nginx, kept alive by PM2, with a Let's Encrypt
certificate. No Vercel, no serverless — `next start` on port 3000.

## 0. Prerequisites

- A droplet (Ubuntu 22.04+, 2 GB RAM is comfortable) with a domain A record
  pointing at its IP.
- A Supabase project (Postgres + Auth + Storage).
- A Bunny.net Stream video library.

## 1. Server setup

```bash
# as root or a sudo user
sudo apt update && sudo apt install -y nginx git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 2. Supabase

1. **Auth → Providers**: enable **Email**. Add your production URL and
   `https://yourdomain.com/auth/callback` to the redirect allow-list. For quick
   testing you can turn off "Confirm email".
2. **Storage → new buckets**: `avatars`, `question-images`, `course-assets`
   (private) and **`files` (public)**. The `files` bucket holds written-exam
   answer PDFs, evaluator voice notes, annotated PDFs, and homepage/site assets
   (logo, banners, testimonial images).
3. **Settings → API**: copy the project URL, `anon` key and `service_role` key.
4. **Connect**: copy the pooled `DATABASE_URL` (port 6543) and the direct
   `DIRECT_URL` (port 5432).

## 3. Bunny Stream

1. **Stream → your library → API**: copy the **API Key** and the numeric
   **Library ID**.
2. **Pull Zone**: copy the CDN hostname, e.g. `vz-xxxx.b-cdn.net`.
3. (Recommended) Under **Security**, add your domain to **Allowed Referrers**
   so embeds only play on your site.

## 4. Clone, configure, build

```bash
cd /var/www
sudo git clone <your-repo> aus-prep && cd aus-prep
sudo chown -R $USER:$USER .

cp .env.example .env
nano .env            # fill in Supabase, DATABASE_URL/DIRECT_URL, Bunny, CRON_SECRET

npm ci
npx prisma migrate deploy         # apply migrations
psql "$DIRECT_URL" -f prisma/manual/one_live_attempt.sql   # one-live-attempt index
npm run db:seed                   # optional demo data + admin account
npm run build
```

## 5. Run with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # run the command it prints, to survive reboots
```

The `aus-prep` app serves on `127.0.0.1:3000`. The `aus-prep-cron` process
ticks every minute to flip live-exam windows and publish results (the app also
sweeps opportunistically on traffic, so this is only a fallback).

## 6. Nginx reverse proxy

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/aus-prep
sudo nano /etc/nginx/sites-available/aus-prep    # set your server_name
sudo ln -s /etc/nginx/sites-available/aus-prep /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config to add the TLS block and sets up auto-renewal.

## 8. Updating a deployed instance

```bash
cd /var/www/aus-prep
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 reload aus-prep
```

## Notes

- **Video bytes never touch this server.** The browser uploads straight to
  Bunny via a presigned resumable (TUS) upload; Node only creates the video
  object and signs the upload. The 25 MB `client_max_body_size` in Nginx is for
  CSV/Excel MCQ imports.
- **Single instance.** The rate limiter and the live-exam sweep keep state in
  memory, so run one PM2 instance. To scale horizontally, move the rate limiter
  to Redis and drive exam processing solely from the cron.
- **Make yourself admin:** register in the app, then
  `npm run make-admin -- you@example.com` and sign out/in.
