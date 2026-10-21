---
title: "SvelteKit Configuration Reference"
version_anchors: ["SvelteKit@2.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit#4991df5 (SvelteKit configuration documentation)"
last_reviewed: 2025-10-28
summary: "Complete reference for configuring SvelteKit projects including svelte.config.js, vite.config.js, TypeScript setup, adapter configuration, and build options"
---

# SvelteKit Configuration Reference

Complete reference for configuring SvelteKit 2.x projects, including core configuration files, build options, and integration with adapters.

## svelte.config.js Structure

The primary configuration file for SvelteKit projects lives at the project root.

### Basic Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;
```

### Complete Configuration Options

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Compiler options
	compilerOptions: {
		runes: true  // Enable Svelte 5 runes (default in Svelte 5)
	},

	// Preprocessing
	preprocess: vitePreprocess(),

	// SvelteKit-specific configuration
	kit: {
		// Adapter for deployment
		adapter: adapter({
			out: 'build',
			precompress: true
		}),

		// Application paths
		paths: {
			base: '',           // Base path for the app
			assets: '',         // Where static assets are served from
			relative: true      // Use relative asset paths
		},

		// File locations
		files: {
			assets: 'static',
			hooks: {
				client: 'src/hooks.client',
				server: 'src/hooks.server',
				universal: 'src/hooks'
			},
			lib: 'src/lib',
			params: 'src/params',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			appTemplate: 'src/app.html',
			errorTemplate: 'src/error.html'
		},

		// Application ID
		appDir: '_app',

		// Content Security Policy
		csp: {
			mode: 'auto',
			directives: {
				'script-src': ['self']
			}
		},

		// Environment variables
		env: {
			dir: process.cwd(),
			publicPrefix: 'PUBLIC_'
		},

		// Module resolution
		alias: {
			'$components': 'src/components',
			'$utils': 'src/utils'
		},

		// Prerendering
		prerender: {
			concurrency: 10,
			crawl: true,
			entries: ['*'],
			origin: 'http://localhost'
		},

		// Service worker
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},

		// TypeScript
		typescript: {
			config: (config) => {
				return config;
			}
		},

		// Version management
		version: {
			name: Date.now().toString(),
			pollInterval: 0
		}
	}
};

export default config;
```

## Adapter Configuration

Adapters transform your SvelteKit app for specific deployment targets.

### adapter-auto

Zero-configuration adapter that automatically selects the correct adapter for supported platforms.

```js
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: {
		adapter: adapter()
	}
};
```

**Supported platforms:**
- Cloudflare Pages → `@sveltejs/adapter-cloudflare`
- Netlify → `@sveltejs/adapter-netlify`
- Vercel → `@sveltejs/adapter-vercel`
- Google Cloud Run → `@sveltejs/adapter-node`
- Azure SWA → `svelte-adapter-azure-swa`
- AWS via SST → `svelte-kit-sst`

**When to use:**
- Development and prototyping
- Quick deployments to supported platforms
- Projects without platform-specific configuration needs

**Limitations:**
- Cannot pass configuration options
- Must install specific adapter for advanced features

### adapter-node

For standalone Node.js servers.

```js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
		adapter: adapter({
			// Output directory
			out: 'build',

			// Precompress assets with gzip and brotli
			precompress: true,

			// Environment variable prefix
			envPrefix: ''
		})
	}
};
```

**Environment variables:**
```bash
# Server configuration
PORT=3000
HOST=0.0.0.0
SOCKET_PATH=/tmp/socket

# Request handling
ORIGIN=https://my.site
PROTOCOL_HEADER=x-forwarded-proto
HOST_HEADER=x-forwarded-host
PORT_HEADER=x-forwarded-port

# Client address
ADDRESS_HEADER=True-Client-IP
XFF_DEPTH=3

# Limits
BODY_SIZE_LIMIT=512K
SHUTDOWN_TIMEOUT=30
IDLE_TIMEOUT=60
```

**Deployment:**
```bash
# Build the app
npm run build

# Run the server
node build

# With environment variables
ORIGIN=https://my.site PORT=4000 node build

# With dotenv
node -r dotenv/config build

# Node 20.6+ with --env-file
node --env-file=.env build
```

### adapter-static

For static site generation (SSG).

```js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			// Output directories
			pages: 'build',
			assets: 'build',

			// SPA fallback page
			fallback: undefined,  // Set to '200.html' for SPA mode

			// Precompress files
			precompress: false,

			// Strict mode (all pages must be prerendered)
			strict: true
		})
	}
};
```

**Root layout configuration:**
```js
// src/routes/+layout.js
export const prerender = true;
export const trailingSlash = 'always';  // For hosts that don't render /a.html for /a
```

**GitHub Pages configuration:**
```js
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

### adapter-vercel

For Vercel deployment with edge runtime support.

```js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter({
			// Run on edge runtime
			edge: false,

			// External dependencies (not bundled)
			external: [],

			// Split API routes into individual functions
			split: false
		})
	}
};
```

### adapter-cloudflare

For Cloudflare Pages and Workers.

```js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
	kit: {
		adapter: adapter({
			// Routes to prerender
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};
```

## vite.config.js Integration

SvelteKit uses Vite as its build tool. Configuration extends standard Vite options.

### Basic Vite Configuration

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
```

### Complete Vite Configuration

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	// Development server
	server: {
		port: 5173,
		host: true,
		fs: {
			allow: ['..']
		}
	},

	// Build options
	build: {
		target: 'es2020',
		sourcemap: true
	},

	// Dependency optimization
	optimizeDeps: {
		include: ['some-package'],
		exclude: ['another-package']
	},

	// Path resolution
	resolve: {
		alias: {
			$components: '/src/components'
		}
	},

	// CSS configuration
	css: {
		postcss: './postcss.config.js'
	}
});
```

### SvelteKit + Tailwind Vite Configuration

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss()
	]
});
```

## TypeScript Configuration

SvelteKit generates TypeScript definitions automatically.

### tsconfig.json

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
}
```

### Path Aliases in TypeScript

```json
{
	"compilerOptions": {
		"paths": {
			"$lib": ["./src/lib"],
			"$lib/*": ["./src/lib/*"],
			"$components": ["./src/components"],
			"$components/*": ["./src/components/*"]
		}
	}
}
```

**Corresponding svelte.config.js:**
```js
export default {
	kit: {
		alias: {
			$components: 'src/components'
		}
	}
};
```

## Environment Variables

### Static Variables

Replaced at build time. Available in all code.

```js
// Access in code
import { PUBLIC_API_URL } from '$env/static/public';
import { SECRET_KEY } from '$env/static/private';
```

**File structure:**
```bash
# .env
PUBLIC_API_URL=https://api.example.com
SECRET_KEY=abc123  # Only available server-side
```

### Dynamic Variables

Available at runtime. Useful for containerized deployments.

```js
// Access in code
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

console.log(env.PUBLIC_API_URL);
console.log(privateEnv.SECRET_KEY);  // Server-side only
```

## Build Configuration

### Development

```bash
# Start dev server
npm run dev

# With custom port
npm run dev -- --port 3000

# Expose to network
npm run dev -- --host
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Output Structure

```
build/
├── client/           # Client-side assets
│   ├── _app/
│   │   ├── immutable/
│   │   └── version.json
│   └── index.html
├── server/           # Server-side code
│   └── index.js
├── prerendered/      # Prerendered pages
└── handler.js        # Request handler (adapter-node)
```

## Prerendering Configuration

Control which pages are prerendered at build time.

### Global Prerendering

```js
// src/routes/+layout.js
export const prerender = true;
```

### Per-Route Prerendering

```js
// src/routes/blog/+page.js
export const prerender = true;
```

### Prerender Options in svelte.config.js

```js
export default {
	kit: {
		prerender: {
			// Number of pages to prerender concurrently
			concurrency: 10,

			// Whether to crawl links
			crawl: true,

			// Entry points for prerendering
			entries: ['*', '/sitemap.xml'],

			// Origin for absolute URLs
			origin: 'https://example.com',

			// Handle missing pages
			handleMissingId: 'warn',  // or 'ignore' or 'fail'

			// Handle HTTP errors
			handleHttpError: 'fail'   // or 'warn' or 'ignore'
		}
	}
};
```

## Path Configuration

### Base Path

For serving from a subdirectory:

```js
export default {
	kit: {
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/my-app' : ''
		}
	}
};
```

**Usage in code:**
```svelte
<script>
	import { base } from '$app/paths';
</script>

<a href="{base}/about">About</a>

<style>
	div {
		background: url({base}/logo.png);
	}
</style>
```

### Relative Paths

Use relative paths for static exports:

```js
export default {
	kit: {
		paths: {
			relative: true
		}
	}
};
```

## Integration-Specific Configuration

### SvelteKit + Tailwind CSS Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};
```

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss()
	]
});
```

```css
/* src/app.css */
@import "tailwindcss";
```

### Content Security Policy

```js
export default {
	kit: {
		csp: {
			mode: 'hash',  // or 'nonce' or 'auto'
			directives: {
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline']
			},
			reportOnly: {
				'script-src': ['self'],
				'report-uri': ['/csp-report']
			}
		}
	}
};
```

## Debugging Configuration

### Source Maps

```js
// vite.config.js
export default defineConfig({
	build: {
		sourcemap: true
	}
});
```

### Verbose Logging

```bash
# Enable Vite debug logging
DEBUG=vite:* npm run dev
```

### Type Checking

```bash
# Check types without building
npm run check

# Watch mode
npm run check -- --watch
```

## Common Configuration Patterns

### Monorepo Setup

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

export default {
	kit: {
		adapter: adapter(),
		files: {
			lib: '../../packages/ui/src'
		}
	}
};
```

### Multi-Environment Configuration

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';

const dev = process.env.NODE_ENV === 'development';

export default {
	kit: {
		adapter: adapter(),
		prerender: {
			origin: dev ? 'http://localhost:5173' : 'https://example.com'
		},
		paths: {
			base: dev ? '' : '/app'
		}
	}
};
```

### Custom File Locations

```js
export default {
	kit: {
		files: {
			routes: 'src/pages',
			lib: 'src/shared',
			assets: 'public',
			appTemplate: 'src/template.html'
		}
	}
};
```
