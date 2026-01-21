# Deployment Guide

EasyPDF is a static Next.js application that can be deployed to any static hosting platform.

## Configuration

### Static Export Setup

The app is configured for static export in `next.config.ts`:

```typescript
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

### Build Command

```bash
npm run build
```

This generates static files in the `out/` directory.

---

## Deployment Options

### 1. Vercel (Recommended)

**Easiest option for Next.js apps.**

#### One-Click Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click "Deploy"

#### CLI Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Pros:** Zero config, automatic deploys, preview URLs, free tier
**Cons:** Bandwidth limits on free tier

---

### 2. Cloudflare Pages

**Best for unlimited bandwidth.**

1. Push code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Connect repository
4. Set build command: `npm run build`
5. Set output directory: `out`

**Pros:** Unlimited bandwidth, fastest CDN, free
**Cons:** Slightly more setup than Vercel

---

### 3. Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import repository
4. Set build command: `npm run build`
5. Set publish directory: `out`

**Pros:** Easy setup, form handling
**Cons:** Bandwidth limits on free tier

---

### 4. GitHub Pages

1. Add to `next.config.ts`:
   ```typescript
   basePath: '/easy-pdf',
   assetPrefix: '/easy-pdf/',
   ```

2. Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./out
   ```

**Pros:** Free, integrated with GitHub
**Cons:** Requires basePath configuration

---

### 5. Hostinger (FTP)

For traditional hosting with FTP access.

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hostinger

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build

      - name: Upload to Hostinger via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./out/
          server-dir: ${{ secrets.FTP_DIR }}
```

#### Required GitHub Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `FTP_SERVER` | FTP server IP | `145.79.212.191` |
| `FTP_USERNAME` | FTP username | `u667575025` |
| `FTP_PASSWORD` | FTP password | Your password |
| `FTP_DIR` | Target directory | `/public_html/` |

#### Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret

---

## Environment Variables

### Required for SEO

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Your production URL | `https://easypdf.com` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `G-XXXXXXXXXX` |

Set in Vercel/Netlify dashboard, `.env.local`, or GitHub Secrets:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Post-Deployment Checklist

- [ ] Verify all tools load correctly
- [ ] Check meta tags with browser DevTools
- [ ] Run [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Run Lighthouse audit (aim for 90+ SEO score)
- [ ] Test on mobile devices
- [ ] Verify dark mode works
- [ ] Check PWA installation works

---

## Troubleshooting

### Images Not Loading

Ensure `images.unoptimized: true` is set in `next.config.ts`.

### 404 on Page Refresh

Static hosting may need SPA fallback. Add `_redirects` file:
```
/*    /index.html   200
```

### Build Fails

Check that these files have `export const dynamic = "force-static"`:
- `src/app/robots.ts`
- `src/app/sitemap.ts`
