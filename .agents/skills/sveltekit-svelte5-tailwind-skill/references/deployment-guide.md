---
title: "Deploy SvelteKit + Svelte 5 + Tailwind v4 to Production"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit repository (adapter documentation)"
last_reviewed: 2025-10-28
summary: "Deploy to Vercel, Cloudflare Pages, Node servers, or static hosts with adapter configuration, environment variables, CSS build setup, and platform-specific optimizations."
---

# Deploy SvelteKit + Svelte 5 + Tailwind v4 to Production

Deploy your integrated stack to production with confidence. This guide covers adapter selection, platform-specific configuration, environment variable management, and CSS build optimization for Vercel, Cloudflare Pages, Node servers, and static hosting.

## Choosing the Right Adapter

Select an adapter based on your deployment target and application needs.

**Adapter comparison:**

| Adapter | Platform | SSR | Edge | Node.js | Best For |
|---------|----------|-----|------|---------|----------|
| `adapter-vercel` | Vercel | ✅ | ✅ | ✅ | Vercel deployments |
| `adapter-cloudflare` | Cloudflare Pages | ✅ | ✅ | ❌ | Edge-first apps |
| `adapter-node` | Any Node host | ✅ | ❌ | ✅ | VPS, Docker, custom servers |
| `adapter-static` | Static hosts | ❌ | ❌ | ❌ | SPAs, static sites |
| `adapter-auto` | Auto-detect | Varies | Varies | Varies | Quick start |

**Decision tree:**

- Need full SSR + database? → `adapter-node` or `adapter-vercel`
- Want edge computing? → `adapter-cloudflare` or `adapter-vercel` (Edge)
- Building SPA or static site? → `adapter-static`
- Deploying to Vercel specifically? → `adapter-vercel`
- Not sure? → `adapter-auto` (detects platform)

❌ **Wrong: Using wrong adapter for platform**
```js
// Deploying to Vercel but using adapter-node
import adapter from '@sveltejs/adapter-node';
```

✅ **Right: Platform-specific adapter**
```js
// For Vercel deployment
import adapter from '@sveltejs/adapter-vercel';
```

## Vercel Deployment

Deploy to Vercel with automatic builds and previews.

**Install adapter:**
```bash
npm install -D @sveltejs/adapter-vercel
```

**Configure `svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x', // or 'edge'
      regions: ['iad1'], // Optional: deployment region
      split: false // Split into multiple functions
    })
  }
};

export default config;
```

**Edge vs Node.js runtime:**

❌ **Wrong: Edge runtime with Node.js APIs**
```js
// svelte.config.js
adapter: adapter({
  runtime: 'edge' // Can't use fs, crypto, etc.
})
```

```ts
// +page.server.ts
import { readFile } from 'fs/promises'; // ERROR on edge
```

✅ **Right: Node.js runtime for server APIs**
```js
adapter: adapter({
  runtime: 'nodejs20.x' // Full Node.js support
})
```

**Environment variables on Vercel:**

1. Add in Vercel dashboard: Settings → Environment Variables
2. Separate production/preview/development values
3. Prefix with `PUBLIC_` for client-side access

```bash
# Production environment
DATABASE_URL=postgresql://prod-db
PRIVATE_API_KEY=sk_live_xxx

# Public variables
PUBLIC_API_URL=https://api.example.com
```

**Vercel configuration file (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "sveltekit",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Deploy:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Vercel + Tailwind CSS:**
- Vite plugin order: `tailwindcss()` before `sveltekit()`
- CSS auto-bundled in build
- No special configuration needed

## Cloudflare Pages Deployment

Deploy to Cloudflare's edge network.

**Install adapter:**
```bash
npm install -D @sveltejs/adapter-cloudflare
```

**Configure `svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    })
  }
};

export default config;
```

**Environment variables:**

Cloudflare uses different env var approach:

```ts
// src/app.d.ts
declare global {
  namespace App {
    interface Platform {
      env?: {
        DATABASE_URL: string;
        PRIVATE_API_KEY: string;
      };
    }
  }
}

export {};
```

```ts
// +page.server.ts
export async function load({ platform }) {
  const apiKey = platform?.env?.PRIVATE_API_KEY;

  const response = await fetch('https://api.example.com', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  return { data: await response.json() };
}
```

**Add variables in Cloudflare dashboard:**
1. Go to Workers & Pages → Your site → Settings
2. Add environment variables
3. Redeploy for changes to take effect

**Build configuration:**
```bash
# Build command in Cloudflare
npm run build

# Output directory
.svelte-kit/cloudflare
```

**Wrangler configuration (`wrangler.toml`):**
```toml
name = "my-sveltekit-app"
compatibility_date = "2024-01-01"

[site]
bucket = ".svelte-kit/cloudflare"

[env.production]
vars = { PUBLIC_API_URL = "https://api.example.com" }
```

**Deploy with Wrangler:**
```bash
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages publish .svelte-kit/cloudflare
```

**Cloudflare limitations:**
- No Node.js APIs (no `fs`, limited `crypto`)
- 1MB response size limit
- Cold start latency
- Use Cloudflare KV/D1 for storage

## Node Server Deployment

Deploy to VPS, Docker, or custom Node.js servers.

**Install adapter:**
```bash
npm install -D @sveltejs/adapter-node
```

**Configure `svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true, // Gzip/Brotli compression
      envPrefix: 'MY_APP_'
    })
  }
};

export default config;
```

**Build and run:**
```bash
# Build
npm run build

# Run (production)
node build/index.js
```

**Custom port and host:**
```bash
# Set port via environment variable
PORT=3000 node build/index.js

# Or set in code
HOST=0.0.0.0 PORT=8080 node build/index.js
```

**Docker deployment:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build/index.js"]
```

**Build and run Docker:**
```bash
# Build image
docker build -t my-app .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e PRIVATE_API_KEY=xxx \
  my-app
```

**Nginx reverse proxy:**
```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**PM2 process manager:**
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start build/index.js --name "my-app"

# Save config
pm2 save

# Auto-start on reboot
pm2 startup
```

**PM2 ecosystem file (`ecosystem.config.js`):**
```js
module.exports = {
  apps: [{
    name: 'my-app',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## Static Site Generation

Build static HTML for hosting on CDNs.

**Install adapter:**
```bash
npm install -D @sveltejs/adapter-static
```

**Configure `svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // For SPA mode
      precompress: false,
      strict: true
    })
  }
};

export default config;
```

**Prerender all pages:**
```ts
// src/routes/+layout.ts
export const prerender = true;

// Or per-page
// src/routes/about/+page.ts
export const prerender = true;
```

**Build and deploy:**
```bash
# Build static files
npm run build

# Output in build/ directory
# Deploy to Netlify, GitHub Pages, etc.
```

**Netlify configuration (`netlify.toml`):**
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**GitHub Pages deployment:**
```bash
# Install gh-pages
npm install -D gh-pages

# Add deploy script to package.json
{
  "scripts": {
    "deploy": "gh-pages -d build"
  }
}

# Deploy
npm run deploy
```

❌ **Wrong: Using SSR features with static adapter**
```ts
// +page.server.ts
export async function load() {
  // Won't work with adapter-static
  return { data: await db.query() };
}
```

✅ **Right: Use universal load or prerender**
```ts
// +page.ts
export const prerender = true;

export async function load({ fetch }) {
  const res = await fetch('/data.json');
  return { data: await res.json() };
}
```

## Environment Variables

Manage secrets and configuration across environments.

**Variable types:**

| Type | Where | Example Use |
|------|-------|-------------|
| `$env/static/private` | Server only | API keys, DB URLs |
| `$env/static/public` | Anywhere | Public API URLs |
| `$env/dynamic/private` | Server only | Runtime config |
| `$env/dynamic/public` | Anywhere | Runtime config |

**Server-side variables:**
```ts
// +page.server.ts
import { PRIVATE_API_KEY, DATABASE_URL } from '$env/static/private';

export async function load() {
  const db = connectToDatabase(DATABASE_URL);
  const data = await fetch('https://api.example.com', {
    headers: { 'Authorization': `Bearer ${PRIVATE_API_KEY}` }
  });

  return { data: await data.json() };
}
```

**Client-side variables:**
```svelte
<script>
  import { PUBLIC_API_URL } from '$env/static/public';

  async function fetchPublicData() {
    const res = await fetch(`${PUBLIC_API_URL}/data`);
    return res.json();
  }
</script>
```

**Platform-specific env vars:**

**Vercel:**
```bash
# .env
DATABASE_URL=postgresql://...
PRIVATE_API_KEY=sk_test_xxx

# .env.production (gitignored)
DATABASE_URL=postgresql://prod-url
PRIVATE_API_KEY=sk_live_xxx
```

**Cloudflare:**
```ts
// Access via platform.env
export async function load({ platform }) {
  const key = platform?.env?.PRIVATE_API_KEY;
}
```

**Node/Docker:**
```bash
# Pass via environment
DATABASE_URL=postgresql://... node build/index.js

# Or .env file with dotenv
npm install dotenv
```

```js
// Load in production (build/index.js wrapper)
require('dotenv').config();
require('./index.js');
```

## CSS Build Configuration

Ensure Tailwind CSS builds correctly for production.

**Vite config (all platforms):**
```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(), // MUST be before sveltekit()
    sveltekit()
  ],

  build: {
    cssMinify: 'esbuild', // or 'lightningcss'
    cssCodeSplit: true,
    sourcemap: false // Disable for production
  }
});
```

**Verify CSS in production:**
```bash
# Build
npm run build

# Check output
ls -lh build/client/_app/immutable/assets/*.css

# Should see:
# _app-abc123.css (your Tailwind CSS)
```

**CSS loading issues:**

❌ **Problem: CSS not loading in production**
```
Cause: Plugin order wrong or CSS not imported
```

✅ **Fix:**
```js
// 1. Check vite.config.js plugin order
plugins: [tailwindcss(), sveltekit()]

// 2. Check +layout.svelte import
import '../app.css';
```

**Platform-specific CSS notes:**

**Vercel:**
- CSS auto-bundled
- No special config needed
- Supports Edge runtime with Tailwind

**Cloudflare:**
- CSS bundled at build time
- Check output includes CSS files
- Edge runtime compatible

**Node:**
- CSS served as static assets
- Ensure `build/client` is served
- Configure Nginx to serve static files

**Static:**
- CSS inlined or referenced in HTML
- Works with all CDNs
- Pre-compressed available

## Platform-Specific Issues

**Issue 1: Vercel Edge cold starts**

**Problem:** Slow initial response on Edge runtime.

**Fix:**
```js
// Use Node.js runtime for database access
adapter: adapter({
  runtime: 'nodejs20.x'
})
```

**Issue 2: Cloudflare response size limit**

**Problem:** Responses > 1MB fail.

**Fix:**
```ts
// Stream large responses
export async function load() {
  return {
    data: streamLargeDataset() // Use streaming
  };
}
```

**Issue 3: Node server not serving static files**

**Problem:** CSS/JS 404 errors.

**Fix:**
```bash
# Ensure build/client is accessible
ls build/client/_app

# Check environment variables
echo $ORIGIN  # Should be your domain
```

**Issue 4: Static adapter with dynamic routes**

**Problem:** Dynamic routes don't prerender.

**Fix:**
```ts
// +page.ts
export const prerender = true;

// Specify all pages to prerender
export function entries() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ];
}
```

## Deployment Checklist

**Pre-deployment:**
- [ ] Environment variables configured
- [ ] Adapter installed and configured
- [ ] CSS imports in root layout
- [ ] Build completes without errors
- [ ] Preview server works locally
- [ ] TypeScript checks pass
- [ ] No console errors in production build

**Platform setup:**
- [ ] Repository connected (for auto-deploy)
- [ ] Build command: `npm run build`
- [ ] Output directory configured
- [ ] Environment variables added
- [ ] Domain configured (if custom)

**Post-deployment:**
- [ ] Site accessible at URL
- [ ] CSS loads correctly
- [ ] Images display
- [ ] Forms work
- [ ] API routes respond
- [ ] No console errors
- [ ] SSR works (check view source)
- [ ] Lighthouse score > 90

**Monitoring:**
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Analytics configured

**Build commands by platform:**

| Platform | Build Command | Output Dir |
|----------|--------------|------------|
| Vercel | `npm run build` | Auto-detected |
| Cloudflare | `npm run build` | `.svelte-kit/cloudflare` |
| Netlify | `npm run build` | `build` |
| Node | `npm run build` | `build` |

**Next steps:**
- Optimize performance in `performance-optimization.md`
- Handle errors in `common-issues.md`
- Configure best practices in `best-practices.md`
