---
title: "SvelteKit Adapters Reference"
version_anchors: ["SvelteKit@2.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit#4991df5 (SvelteKit adapters documentation)"
last_reviewed: 2025-10-28
summary: "Complete reference for SvelteKit deployment adapters including adapter-auto, adapter-node, adapter-static, adapter-vercel, adapter-cloudflare, and custom adapter development"
---

# SvelteKit Adapters Reference

Complete reference for SvelteKit adapters, which transform your application for specific deployment targets.

## Overview

Adapters are plugins that take your built SvelteKit app and generate output optimized for specific deployment platforms. They handle server-side rendering, static generation, and platform-specific optimizations.

## adapter-auto

Zero-configuration adapter that automatically selects the correct adapter based on your deployment platform.

### Installation

```bash
npm install -D @sveltejs/adapter-auto
```

### Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: {
		adapter: adapter()
	}
};
```

### Supported Platforms

| Platform | Auto-Detected Adapter |
|----------|----------------------|
| Cloudflare Pages | `@sveltejs/adapter-cloudflare` |
| Netlify | `@sveltejs/adapter-netlify` |
| Vercel | `@sveltejs/adapter-vercel` |
| Azure Static Web Apps | `svelte-adapter-azure-swa` |
| AWS via SST | `svelte-kit-sst` |
| Google Cloud Run | `@sveltejs/adapter-node` |

### When to Use

✅ **Good for:**
- Quick prototyping
- Standard deployments
- Projects without platform-specific needs

❌ **Not suitable for:**
- Platform-specific configuration (edge runtime, regions, etc.)
- Advanced adapter options
- Custom deployment requirements

### Limitations

- Cannot pass configuration options to underlying adapter
- Must install specific adapter manually for advanced features

### Best Practice

```bash
# Install specific adapter once you know your target platform
npm install -D @sveltejs/adapter-vercel
```

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter({
			edge: true  // Now you can use platform-specific options
		})
	}
};
```

## adapter-node

Generates a standalone Node.js server.

### Installation

```bash
npm install -D @sveltejs/adapter-node
```

### Basic Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
		adapter: adapter()
	}
};
```

### Configuration Options

```js
adapter({
	// Output directory (default: 'build')
	out: 'build',

	// Precompress files with gzip and brotli (default: true)
	precompress: true,

	// Environment variable prefix (default: '')
	envPrefix: ''
})
```

### Environment Variables

#### Server Configuration

```bash
# Listening address and port
HOST=127.0.0.1  # Default: 0.0.0.0
PORT=4000       # Default: 3000

# Or use socket path
SOCKET_PATH=/tmp/socket
```

#### Request Handling

```bash
# Origin for URL construction
ORIGIN=https://example.com

# Header-based origin
PROTOCOL_HEADER=x-forwarded-proto
HOST_HEADER=x-forwarded-host
PORT_HEADER=x-forwarded-port
```

#### Client Address Detection

```bash
# Client IP address header
ADDRESS_HEADER=True-Client-IP

# X-Forwarded-For depth (number of trusted proxies)
XFF_DEPTH=3
```

#### Limits and Timeouts

```bash
# Request body size limit (default: 512K)
BODY_SIZE_LIMIT=512K  # Can use K, M, G suffixes

# Graceful shutdown timeout (default: 30 seconds)
SHUTDOWN_TIMEOUT=30

# Idle timeout for socket activation (no default)
IDLE_TIMEOUT=60
```

### Deployment

#### Basic Deployment

```bash
# 1. Build the app
npm run build

# 2. Deploy these files:
# - build/ directory
# - package.json
# - package-lock.json

# 3. Install production dependencies
npm ci --omit dev

# 4. Start the server
node build
```

#### With Environment Variables

```bash
# Using inline environment variables
HOST=127.0.0.1 PORT=4000 ORIGIN=https://my.site node build

# Using dotenv
node -r dotenv/config build

# Using Node 20.6+ --env-file
node --env-file=.env build
```

#### With Custom Prefix

```js
// svelte.config.js
adapter({
	envPrefix: 'MY_APP_'
})
```

```bash
# Use prefixed environment variables
MY_APP_HOST=127.0.0.1 \
MY_APP_PORT=4000 \
MY_APP_ORIGIN=https://my.site \
node build
```

### Graceful Shutdown

Adapter-node handles graceful shutdown automatically:

1. Receives `SIGTERM` or `SIGINT` signal
2. Rejects new requests
3. Waits for in-flight requests to complete
4. Closes idle connections
5. Force-closes remaining connections after `SHUTDOWN_TIMEOUT`

**Listening to shutdown events:**
```js
// your-app-code.js
process.on('sveltekit:shutdown', async (reason) => {
	// reason is 'SIGINT', 'SIGTERM', or 'IDLE'

	// Close database connections
	await db.close();

	// Stop background jobs
	await jobs.stop();
});
```

### Socket Activation (systemd)

Run your app on-demand with systemd.

#### Service Unit

```ini
# /etc/systemd/system/myapp.service
[Service]
Environment=NODE_ENV=production IDLE_TIMEOUT=60
ExecStart=/usr/bin/node /usr/bin/myapp/build
```

#### Socket Unit

```ini
# /etc/systemd/system/myapp.socket
[Socket]
ListenStream=3000

[Install]
WantedBy=sockets.target
```

#### Enable and Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable socket
sudo systemctl enable --now myapp.socket
```

### Custom Server

Create your own server using the exported handler.

```js
// my-server.js
import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// Add custom routes
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// SvelteKit handles everything else
app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
```

**With middleware:**
```js
import { handler } from './build/handler.js';
import express from 'express';
import compression from '@polka/compression';

const app = express();

// Add middleware
app.use(compression());

// Custom API routes
app.use('/api/custom', customApiRouter);

// SvelteKit
app.use(handler);

app.listen(3000);
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --omit dev

# Copy build output
COPY build ./build

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "build"]
```

```yaml
# docker-compose.yml
version: '3'
services:
	app:
		build: .
		ports:
			- "3000:3000"
		environment:
			- NODE_ENV=production
			- ORIGIN=https://example.com
```

## adapter-static

Generates a static site (SSG - Static Site Generation).

### Installation

```bash
npm install -D @sveltejs/adapter-static
```

### Basic Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		})
	}
};
```

### Configuration Options

```js
adapter({
	// Output directory for prerendered pages (default: 'build')
	pages: 'build',

	// Output directory for static assets (default: same as pages)
	assets: 'build',

	// SPA fallback page (e.g., '200.html', '404.html')
	fallback: undefined,

	// Precompress files with gzip and brotli (default: false)
	precompress: false,

	// Require all pages to be prerendered (default: true)
	strict: true
})
```

### Enable Prerendering

```js
// src/routes/+layout.js
export const prerender = true;
```

**Or per-route:**
```js
// src/routes/about/+page.js
export const prerender = true;
```

### Trailing Slashes

Important for static hosting:

```js
// src/routes/+layout.js
export const prerender = true;
export const trailingSlash = 'always';  // Creates /page/index.html instead of /page.html
```

### SPA Mode

Create a single-page application with a fallback page.

```js
// svelte.config.js
adapter({
	fallback: '200.html'  // Or '404.html' depending on host
})
```

```js
// src/routes/+layout.js
export const prerender = false;  // Don't prerender in SPA mode
export const ssr = false;        // Client-side only
```

**Performance impact:** SPAs have worse initial load times and SEO. Prefer static generation when possible.

### GitHub Pages

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			fallback: '404.html'
		}),
		paths: {
			base: process.argv.includes('dev') ? '' : process.env.BASE_PATH
		}
	}
};
```

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
	push:
		branches: 'main'

jobs:
	build_site:
		runs-on: ubuntu-latest
		steps:
			- name: Checkout
				uses: actions/checkout@v4

			- name: Install Node.js
				uses: actions/setup-node@v4
				with:
					node-version: 20
					cache: npm

			- name: Install dependencies
				run: npm i

			- name: Build
				env:
					BASE_PATH: '/${{ github.event.repository.name }}'
				run: npm run build

			- name: Upload Artifacts
				uses: actions/upload-pages-artifact@v3
				with:
					path: 'build/'

	deploy:
		needs: build_site
		runs-on: ubuntu-latest
		permissions:
			pages: write
			id-token: write
		environment:
			name: github-pages
			url: ${{ steps.deployment.outputs.page_url }}
		steps:
			- name: Deploy
				id: deployment
				uses: actions/deploy-pages@v4
```

### Netlify

```js
// svelte.config.js
adapter({
	pages: 'build',
	assets: 'build',
	fallback: '404.html',
	precompress: true
})
```

Create `static/_redirects`:
```
/*    /index.html   200
```

### Vercel

Zero-config support:
```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter()  // No options needed for Vercel
	}
};
```

## adapter-vercel

Optimized adapter for Vercel deployment.

### Installation

```bash
npm install -D @sveltejs/adapter-vercel
```

### Basic Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter()
	}
};
```

### Configuration Options

```js
adapter({
	// Run on Vercel Edge Runtime (default: false)
	edge: false,

	// External dependencies (not bundled)
	external: [],

	// Split API routes into separate functions (default: false)
	split: false,

	// Regions for edge deployment
	regions: ['iad1', 'sfo1'],

	// ISR configuration
	isr: {
		expiration: 60,
		bypassToken: process.env.BYPASS_TOKEN
	}
})
```

### Edge Runtime

```js
adapter({
	edge: true,
	regions: ['iad1', 'sfo1']  // Deploy to specific regions
})
```

**Limitations:**
- No Node.js APIs
- No file system access
- Limited package compatibility

### Incremental Static Regeneration (ISR)

```js
// svelte.config.js
adapter({
	isr: {
		expiration: 60,  // Revalidate every 60 seconds
		bypassToken: process.env.BYPASS_TOKEN
	}
})
```

```js
// src/routes/blog/[slug]/+page.server.js
export const config = {
	isr: {
		expiration: 60
	}
};
```

### Function Splitting

```js
adapter({
	split: true  // Each route becomes a separate serverless function
})
```

**Benefits:**
- Smaller function sizes
- Faster cold starts
- Independent scaling

**Trade-offs:**
- More functions to manage
- Potential cold start latency

## adapter-cloudflare

For Cloudflare Pages and Workers.

### Installation

```bash
npm install -D @sveltejs/adapter-cloudflare
```

### Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};
```

### Cloudflare Pages

Automatic deployment when connected to GitHub.

**wrangler.toml:**
```toml
name = "my-app"
compatibility_date = "2024-01-01"

[site]
bucket = ".svelte-kit/cloudflare"
```

### Cloudflare Workers

```js
// wrangler.toml
name = "my-worker"
main = ".svelte-kit/cloudflare/index.js"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
```

### Platform Context

Access Cloudflare-specific features:

```js
// src/routes/+page.server.js
export async function load({ platform }) {
	// Access KV namespaces
	const value = await platform.env.MY_KV.get('key');

	// Access Durable Objects
	const id = platform.env.MY_DO.idFromName('name');
	const stub = platform.env.MY_DO.get(id);

	return { value };
}
```

## adapter-netlify

For Netlify deployment.

### Installation

```bash
npm install -D @sveltejs/adapter-netlify
```

### Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-netlify';

export default {
	kit: {
		adapter: adapter({
			edge: false,
			split: false
		})
	}
};
```

### Edge Functions

```js
adapter({
	edge: true
})
```

### Netlify Forms

```svelte
<form name="contact" method="POST" data-netlify="true">
	<input type="hidden" name="form-name" value="contact" />
	<input name="email" type="email" required />
	<button type="submit">Submit</button>
</form>
```

## Platform Comparison

| Feature | Node | Static | Vercel | Cloudflare | Netlify |
|---------|------|--------|--------|------------|---------|
| SSR | ✅ | ❌ | ✅ | ✅ | ✅ |
| SSG | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edge Runtime | ❌ | ❌ | ✅ | ✅ | ✅ |
| File System | ✅ | ✅ | Limited | ❌ | Limited |
| WebSockets | ✅ | ❌ | ❌ | ✅ | ❌ |
| Streaming | ✅ | ❌ | ✅ | ✅ | ✅ |
| Custom Server | ✅ | ❌ | ❌ | ❌ | ❌ |

## Writing Custom Adapters

### Adapter Structure

```js
// my-adapter/index.js
export default function adapter(options) {
	return {
		name: 'my-adapter',

		async adapt(builder) {
			// Clean output directory
			builder.rimraf(options.out);

			// Write server files
			builder.writeServer(options.out);

			// Write client files
			builder.writeClient(options.out);

			// Write prerendered files
			builder.writePrerendered(options.out);

			// Copy static files
			builder.copy('static', options.out);

			// Generate platform-specific files
			builder.generateManifest({ format: 'esm' });
		}
	};
}
```

### Builder API

```typescript
interface Builder {
	// Clean directory
	rimraf(dir: string): void;

	// Create directory
	mkdirp(dir: string): void;

	// Write files
	writeClient(dest: string): void;
	writeServer(dest: string): void;
	writePrerendered(dest: string): void;

	// Copy files
	copy(from: string, to: string, opts?: {
		filter?: (file: string) => boolean;
		replace?: Record<string, string>;
	}): void;

	// Generate manifest
	generateManifest(opts: {
		format: 'esm' | 'cjs';
		relativePath?: string;
	}): void;

	// App configuration
	config: Record<string, any>;
	prerendered: Map<string, string>;
	routes: Route[];
}
```

## Deployment Checklist

### Pre-Deployment

- [ ] Set appropriate adapter
- [ ] Configure environment variables
- [ ] Test production build locally (`npm run preview`)
- [ ] Verify all pages prerender correctly
- [ ] Check bundle size and performance
- [ ] Set up monitoring and error tracking

### Platform-Specific

#### Node.js

- [ ] Configure `ORIGIN` environment variable
- [ ] Set up reverse proxy (nginx, Caddy)
- [ ] Configure process manager (PM2, systemd)
- [ ] Set up SSL/TLS certificates
- [ ] Configure load balancing

#### Static

- [ ] Set correct `trailingSlash` option
- [ ] Add `.nojekyll` for GitHub Pages
- [ ] Configure custom domain
- [ ] Set up CDN
- [ ] Configure caching headers

#### Vercel/Netlify/Cloudflare

- [ ] Connect GitHub repository
- [ ] Configure build command
- [ ] Set environment variables in dashboard
- [ ] Configure custom domain
- [ ] Review platform-specific limits
