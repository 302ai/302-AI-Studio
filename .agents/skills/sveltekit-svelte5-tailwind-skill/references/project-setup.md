---
title: "Complete Project Setup for SvelteKit + Svelte 5 + Tailwind v4"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x", "Vite@5.x"]
authored: true
origin: self
last_reviewed: 2025-10-28
summary: "Production-ready project structure, Vite configuration, TypeScript setup, path aliases, and environment variable management for the complete stack."
---

# Complete Project Setup for SvelteKit + Svelte 5 + Tailwind v4

Configure your SvelteKit project for scalability and maintainability. This guide provides battle-tested directory structures, complete Vite configuration, TypeScript setup, and environment variable management.

## Recommended Project Structure

Organize your project to separate concerns and support growth from prototype to production.

**Complete directory structure:**
```
my-app/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/              # Reusable UI components (Tailwind)
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   └── Input.svelte
│   │   │   ├── features/        # Feature-specific components
│   │   │   │   ├── UserProfile.svelte
│   │   │   │   └── ProductCard.svelte
│   │   │   └── layout/          # Layout components
│   │   │       ├── Header.svelte
│   │   │       ├── Footer.svelte
│   │   │       └── Sidebar.svelte
│   │   ├── server/              # Server-only code
│   │   │   ├── db/
│   │   │   │   ├── client.ts
│   │   │   │   └── queries.ts
│   │   │   ├── auth/
│   │   │   │   └── session.ts
│   │   │   └── api/
│   │   │       └── external.ts
│   │   ├── utils/               # Shared utilities
│   │   │   ├── formatting.ts
│   │   │   ├── validation.ts
│   │   │   └── dates.ts
│   │   ├── styles/              # Shared styles
│   │   │   ├── variables.css
│   │   │   └── animations.css
│   │   └── types/               # TypeScript types
│   │       ├── api.ts
│   │       └── models.ts
│   ├── routes/
│   │   ├── (app)/               # Route group with shared layout
│   │   │   ├── dashboard/
│   │   │   │   └── +page.svelte
│   │   │   ├── profile/
│   │   │   │   └── +page.svelte
│   │   │   └── +layout.svelte
│   │   ├── (auth)/              # Auth routes with different layout
│   │   │   ├── login/
│   │   │   │   └── +page.svelte
│   │   │   └── +layout.svelte
│   │   ├── api/                 # API endpoints
│   │   │   └── users/
│   │   │       └── +server.ts
│   │   └── +layout.svelte       # Root layout
│   ├── app.css                  # Tailwind imports
│   ├── app.d.ts                 # Type definitions
│   └── app.html                 # HTML template
├── static/
│   ├── favicon.png
│   ├── robots.txt
│   └── images/
├── tests/
│   ├── unit/
│   └── integration/
├── .env                         # Environment variables (gitignored)
├── .env.example                 # Template for .env
├── svelte.config.js             # SvelteKit configuration
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── package.json
```

❌ **Wrong: Flat structure that doesn't scale**
```
src/
├── lib/
│   ├── Button.svelte
│   ├── UserProfile.svelte
│   ├── database.ts
│   ├── utils.ts
│   └── everything-mixed.ts
└── routes/
    └── +page.svelte
```

✅ **Right: Organized by concern and function**
```
src/
├── lib/
│   ├── components/ui/          # Presentation
│   ├── components/features/    # Business logic
│   ├── server/                 # Backend code
│   └── utils/                  # Pure functions
```

**Directory conventions:**
- `lib/components/ui/` - Reusable, styled-only components accepting props
- `lib/components/features/` - Business logic components using UI components
- `lib/server/` - Server-only code (database, external APIs, secrets)
- `routes/(group)/` - Route groups sharing layouts without affecting URL

## Vite Configuration Deep Dive

Configure Vite for optimal development experience and production builds.

**Complete `vite.config.js`:**
```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(), // Must be before sveltekit()
    sveltekit()
  ],

  // CSS configuration
  css: {
    devSourcemap: true, // Enable CSS source maps in dev
  },

  // Development server
  server: {
    port: 5173,
    strictPort: false, // Try next port if 5173 is taken
    host: true, // Listen on all addresses
    watch: {
      // Prevent watching too many files
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    }
  },

  // Preview server (production build testing)
  preview: {
    port: 4173,
    strictPort: true
  },

  // Build optimizations
  build: {
    sourcemap: true, // Generate source maps for production
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'vendor': ['svelte'],
        }
      }
    }
  },

  // Resolve configuration
  resolve: {
    alias: {
      // Add path aliases (also configure in tsconfig.json)
      $components: path.resolve('./src/lib/components'),
      $utils: path.resolve('./src/lib/utils'),
      $server: path.resolve('./src/lib/server'),
      $styles: path.resolve('./src/lib/styles')
    }
  },

  // Optimizations
  optimizeDeps: {
    include: ['svelte'], // Pre-bundle these dependencies
    exclude: [] // Don't pre-bundle these
  }
});
```

❌ **Wrong: Minimal config missing optimizations**
```js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
  // Missing: source maps, aliases, optimizations
});
```

✅ **Right: Full config for development and production**
```js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  css: { devSourcemap: true },
  build: { sourcemap: true },
  resolve: { alias: { /* ... */ } }
});
```

**Plugin order is critical:**
```js
// ✅ Correct order
plugins: [
  tailwindcss(), // 1. Process CSS first
  sveltekit()    // 2. Transform Svelte components
]

// ❌ Wrong order causes CSS processing failures
plugins: [
  sveltekit(),
  tailwindcss()  // Too late!
]
```

## TypeScript Configuration

Configure TypeScript for type safety across the entire stack.

**Complete `tsconfig.json`:**
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    // Module resolution
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ESNext",

    // Type checking
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,

    // Svelte and SvelteKit
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,

    // Path mapping (sync with vite.config.js)
    "baseUrl": ".",
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"],
      "$components": ["./src/lib/components"],
      "$components/*": ["./src/lib/components/*"],
      "$utils": ["./src/lib/utils"],
      "$utils/*": ["./src/lib/utils/*"],
      "$server": ["./src/lib/server"],
      "$server/*": ["./src/lib/server/*"],
      "$styles": ["./src/lib/styles"],
      "$styles/*": ["./src/lib/styles/*"]
    }
  },
  "include": [
    "src/**/*.d.ts",
    "src/**/*.ts",
    "src/**/*.js",
    "src/**/*.svelte"
  ],
  "exclude": [
    "node_modules",
    ".svelte-kit",
    "dist",
    "build"
  ]
}
```

❌ **Wrong: Not extending SvelteKit's generated config**
```json
{
  "compilerOptions": {
    "strict": true
    // Missing SvelteKit-specific settings
  }
}
```

✅ **Right: Extending SvelteKit's base config**
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    // Your customizations here
  }
}
```

**Type definitions in `src/app.d.ts`:**
```ts
// See https://svelte.dev/docs/kit/types
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
    interface PageData {
      user?: App.Locals['user'];
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
```

## Path Aliases and Module Resolution

Configure path aliases for cleaner imports across your project.

**Configure in both `vite.config.js` and `tsconfig.json`:**

**`vite.config.js` aliases:**
```js
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $components: path.resolve('./src/lib/components'),
      $utils: path.resolve('./src/lib/utils'),
      $server: path.resolve('./src/lib/server'),
      $styles: path.resolve('./src/lib/styles')
    }
  }
});
```

**`tsconfig.json` paths (must match):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "$components": ["./src/lib/components"],
      "$components/*": ["./src/lib/components/*"],
      "$utils": ["./src/lib/utils"],
      "$utils/*": ["./src/lib/utils/*"],
      "$server": ["./src/lib/server"],
      "$server/*": ["./src/lib/server/*"],
      "$styles": ["./src/lib/styles"],
      "$styles/*": ["./src/lib/styles/*"]
    }
  }
}
```

**Using aliases in your code:**

❌ **Wrong: Relative imports that break on refactoring**
```svelte
<script>
  import Button from '../../../lib/components/ui/Button.svelte';
  import { formatDate } from '../../../lib/utils/dates';
</script>
```

✅ **Right: Absolute imports with aliases**
```svelte
<script>
  import Button from '$components/ui/Button.svelte';
  import { formatDate } from '$utils/dates';
</script>
```

**Built-in SvelteKit aliases (always available):**
- `$lib` - Resolves to `src/lib`
- `$app/environment` - SvelteKit environment utilities
- `$app/forms` - Form action utilities
- `$app/navigation` - Navigation utilities
- `$app/state` - State management
- `$app/stores` - Page stores

## Environment Variables Setup

Manage configuration and secrets properly across environments.

**Create `.env` file (gitignored):**
```bash
# Public variables (exposed to client)
PUBLIC_API_URL=http://localhost:3000/api
PUBLIC_SITE_NAME=My Awesome App
PUBLIC_ANALYTICS_ID=UA-XXXXXXXXX

# Private variables (server-only)
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
PRIVATE_API_KEY=sk_live_abc123xyz
SESSION_SECRET=super-secret-session-key-change-this
```

**Create `.env.example` template (committed to git):**
```bash
# Public variables
PUBLIC_API_URL=http://localhost:3000/api
PUBLIC_SITE_NAME=
PUBLIC_ANALYTICS_ID=

# Private variables (never commit actual values!)
DATABASE_URL=postgresql://user:pass@host:port/db
PRIVATE_API_KEY=
SESSION_SECRET=
```

**Add to `.gitignore`:**
```
.env
.env.*
!.env.example
```

**Using environment variables in code:**

❌ **Wrong: Using private variables in client code**
```svelte
<!-- +page.svelte (runs on client) -->
<script>
  import { PRIVATE_API_KEY } from '$env/static/private';
  // ERROR: Private env vars not available in client code
</script>
```

✅ **Right: Private variables only in server code**
```ts
// +page.server.ts (runs on server)
import { PRIVATE_API_KEY } from '$env/static/private';
import { PUBLIC_API_URL } from '$env/static/public';

export async function load() {
  const response = await fetch(PUBLIC_API_URL, {
    headers: {
      'Authorization': `Bearer ${PRIVATE_API_KEY}`
    }
  });
  return { data: await response.json() };
}
```

**Environment variable types:**

| Import | Where | When Available | Use Case |
|--------|-------|----------------|----------|
| `$env/static/private` | Server only | Build time | API keys, secrets |
| `$env/static/public` | Anywhere | Build time | Public config |
| `$env/dynamic/private` | Server only | Runtime | Dynamic config |
| `$env/dynamic/public` | Anywhere | Runtime | Runtime config |

**Type definitions in `src/app.d.ts`:**
```ts
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
```

## Development vs Production Config

Configure different behaviors for development and production environments.

**Conditional configuration in `svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.env.NODE_ENV === 'development';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),

    // Development-specific settings
    ...(dev && {
      csp: {
        mode: 'auto',
        directives: {
          'default-src': ['self']
        }
      }
    }),

    // Production-specific settings
    ...(!dev && {
      prerender: {
        entries: ['*'],
        crawl: true
      }
    }),

    alias: {
      $components: 'src/lib/components',
      $utils: 'src/lib/utils',
      $server: 'src/lib/server',
      $styles: 'src/lib/styles'
    }
  }
};

export default config;
```

**Tailwind configuration for environments:**
```js
// tailwind.config.js
const production = process.env.NODE_ENV === 'production';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  // Production optimizations
  ...(production && {
    // Additional purge patterns for production
    safelist: []
  }),

  theme: {
    extend: {}
  },

  plugins: []
};
```

**Runtime environment detection:**
```svelte
<script>
  import { dev } from '$app/environment';

  // Only runs in development
  $effect(() => {
    if (dev) {
      console.log('Development mode - debug logging enabled');
    }
  });
</script>

{#if dev}
  <div class="fixed bottom-0 right-0 bg-yellow-500 p-2 text-xs">
    DEV MODE
  </div>
{/if}
```

## Configuration Validation

Validate your setup to catch issues early.

**Create validation script `src/lib/server/validate-env.ts`:**
```ts
import { PRIVATE_API_KEY, DATABASE_URL } from '$env/static/private';
import { PUBLIC_API_URL } from '$env/static/public';

export function validateEnvironment() {
  const required = {
    PRIVATE_API_KEY,
    DATABASE_URL,
    PUBLIC_API_URL
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return true;
}
```

**Run validation in `src/hooks.server.ts`:**
```ts
import { validateEnvironment } from '$lib/server/validate-env';
import type { Handle } from '@sveltejs/kit';

// Validate on startup
validateEnvironment();

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};
```

**Verify configuration checklist:**
```bash
# 1. Check Vite config syntax
npx vite --help

# 2. Check TypeScript config
npx tsc --noEmit

# 3. Check Tailwind processes correctly
npm run dev
# Visit app and inspect CSS in DevTools

# 4. Check environment variables load
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# 5. Check production build
npm run build
npm run preview
```

❌ **Wrong: Deploying without validation**
```bash
git push
# Fails in production due to missing env vars
```

✅ **Right: Validate before deployment**
```bash
npm run build  # Catches config errors
npm run preview  # Tests production build locally
# Then deploy
```

**Configuration testing checklist:**
- [ ] Dev server starts without errors
- [ ] TypeScript compiles without errors
- [ ] Tailwind styles render correctly
- [ ] Path aliases resolve in imports
- [ ] Environment variables load correctly
- [ ] Production build completes successfully
- [ ] Preview server runs production build
- [ ] Source maps work in DevTools

**Next steps:**
- Learn about Svelte 5 runes in `svelte5-runes.md`
- Configure styling patterns in `styling-with-tailwind.md`
- Set up forms in `forms-and-actions.md`
- Optimize for production in `performance-optimization.md`
