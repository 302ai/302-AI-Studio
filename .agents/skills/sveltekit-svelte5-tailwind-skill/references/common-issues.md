---
title: "Common Issues with SvelteKit 2, Svelte 5, and Tailwind v4"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
last_reviewed: 2025-10-28
summary: "Quick fixes for module errors, CSS loading issues, Tailwind processing problems, runes SSR errors, HMR failures, TypeScript configuration, build errors, and deployment failures."
---

# Common Issues with SvelteKit 2, Svelte 5, and Tailwind v4

This guide provides immediate solutions to the most frequent errors when integrating SvelteKit 2, Svelte 5, and Tailwind v4. Each issue includes the exact error message, root cause, and step-by-step fix.

## Module and Import Errors

### Error: "Cannot find module '@tailwindcss/vite'"

**Error message:**
```
Error: Cannot find module '@tailwindcss/vite'
```

**Cause:** Tailwind v4 Vite plugin not installed.

❌ **Wrong:**
```bash
npm install -D tailwindcss  # Installs v3, not v4
```

✅ **Fix:**
```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
```

**Verify installation:**
```bash
npm list tailwindcss
# Should show: tailwindcss@4.0.0-alpha.x
```

### Error: "$state is not defined"

**Error message:**
```
ReferenceError: $state is not defined
```

**Cause:** Either running on server (SSR) or Svelte 4 installed instead of Svelte 5.

**Check Svelte version:**
```bash
npm list svelte
```

❌ **Wrong:** Svelte 4 installed
```
svelte@4.2.x
```

✅ **Fix:** Install Svelte 5
```bash
npm install svelte@^5.0.0 @sveltejs/kit@^2.0.0 @sveltejs/vite-plugin-svelte@^4.0.0
```

**If using $state in SSR context:**
```svelte
<!-- ❌ Wrong: Crashes on server -->
<script>
  let count = $state(0);
</script>

<!-- ✅ Right: Hydrate from server data -->
<script>
  let { data } = $props();
  let count = $state(data.initialCount);
</script>
```

```ts
// +page.server.ts
export function load() {
  return { initialCount: 0 };
}
```

### Error: "use:enhance is not a function"

**Error message:**
```
TypeError: use:enhance is not a function
```

**Cause:** Importing `enhance` incorrectly or outdated SvelteKit version.

❌ **Wrong:**
```svelte
<script>
  import { enhance } from '@sveltejs/kit';  // Wrong package
</script>
```

✅ **Fix:**
```svelte
<script>
  import { enhance } from '$app/forms';  // Correct import
</script>

<form method="POST" use:enhance>
  <!-- Form content -->
</form>
```

### Error: "Module not found: $lib/..."

**Error message:**
```
Error: Cannot find module '$lib/components/Button.svelte'
```

**Cause:** Aliases not configured or incorrect path.

**Check `svelte.config.js`:**
```js
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    alias: {
      $components: 'src/lib/components',
      $utils: 'src/lib/utils'
    }
  }
};
```

**Check `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"],
      "$components": ["./src/lib/components"],
      "$components/*": ["./src/lib/components/*"]
    }
  }
}
```

## CSS Loading Issues

### Error: "Tailwind directives not processed"

**Symptoms:**
- `@import "tailwindcss";` appears in browser
- No Tailwind styles applied
- Raw CSS directive visible

**Cause:** Vite plugin order incorrect or CSS not imported.

❌ **Wrong plugin order:**
```js
// vite.config.js
export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss()  // Too late!
  ]
});
```

✅ **Fix plugin order:**
```js
export default defineConfig({
  plugins: [
    tailwindcss(),  // Must be first
    sveltekit()
  ]
});
```

**Verify CSS import in root layout:**
```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';  // Must be present
</script>

<slot />
```

### Error: "CSS not loading in production build"

**Symptoms:**
- Styles work in dev
- No styles after `npm run build`
- White unstyled page

**Cause:** CSS not imported in root layout or plugin order wrong.

**Fix:**
1. Check `src/routes/+layout.svelte`:
```svelte
<script>
  import '../app.css';
</script>
```

2. Rebuild:
```bash
rm -rf .svelte-kit node_modules/.vite
npm install
npm run build
```

3. Test preview:
```bash
npm run preview
```

4. Check build output:
```bash
ls -lh build/client/_app/immutable/assets/*.css
# Should see CSS files
```

### Error: "Flash of Unstyled Content (FOUC)"

**Symptoms:**
- Page shows without styles briefly
- Styles "pop in" after delay

**Cause:** CSS loaded after HTML renders.

❌ **Wrong: CSS in page component**
```svelte
<!-- +page.svelte -->
<script>
  import '../app.css';  // Loads too late
</script>
```

✅ **Fix: CSS in root layout**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css';  // Loads before all pages
</script>
```

**For critical CSS, inline in app.html:**
```html
<!-- src/app.html -->
<head>
  <style>
    body { margin: 0; font-family: system-ui; }
    /* Other critical styles */
  </style>
  %sveltekit.head%
</head>
```

## Tailwind Processing Errors

### Error: "Content detection missing classes"

**Symptoms:**
- Classes work in dev
- Classes purged in production
- Specific classes randomly missing

**Cause:** Dynamic class names or template literals hide classes from Tailwind.

❌ **Wrong: Template literals**
```svelte
<script>
  let color = $state('blue');
</script>

<div class="bg-{color}-500">  <!-- Won't work -->
  Content
</div>
```

✅ **Fix: Use class: directive**
```svelte
<script>
  let type = $state('primary');
</script>

<div
  class:bg-blue-500={type === 'primary'}
  class:bg-red-500={type === 'danger'}
>
  Content
</div>
```

**Or safelist in `tailwind.config.js`:**
```js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    'bg-blue-500',
    'bg-red-500',
    'bg-green-500',
    {
      pattern: /bg-(red|blue|green)-(400|500|600)/
    }
  ]
};
```

### Error: "Arbitrary values not working"

**Symptoms:**
- `class="w-[200px]"` doesn't work
- Custom values ignored

**Cause:** Syntax error or using template literals.

❌ **Wrong: Template literal in arbitrary value**
```svelte
<script>
  let width = $state(200);
</script>

<div class="w-[{width}px]">  <!-- Won't work -->
```

✅ **Fix: Use inline styles for dynamic values**
```svelte
<script>
  let width = $state(200);
</script>

<div style="width: {width}px" class="bg-blue-500">
  Works!
</div>
```

**Static arbitrary values work fine:**
```svelte
<div class="w-[200px] h-[calc(100vh-4rem)] bg-[#1da1f2]">
  Static values
</div>
```

### Error: "@apply directive doesn't work"

**Symptoms:**
- `@apply` in `<style>` tags doesn't apply classes
- Undefined utility error

**Cause:** Scoped styles prevent `@apply` from working correctly.

❌ **Wrong: @apply in scoped styles**
```svelte
<style>
  .button {
    @apply px-4 py-2 bg-blue-500;  /* Doesn't work */
  }
</style>
```

✅ **Fix: Use utility classes directly**
```svelte
<button class="bg-blue-500 px-4 py-2 text-white">
  Button
</button>
```

**Or move to global CSS:**
```css
/* src/app.css */
@import "tailwindcss";

@layer components {
  .btn {
    @apply px-4 py-2 rounded;
  }
}
```

## Runes SSR Errors

### Error: "localStorage is not defined"

**Error message:**
```
ReferenceError: localStorage is not defined
```

**Cause:** Accessing browser APIs during SSR.

❌ **Wrong:**
```svelte
<script>
  let theme = localStorage.getItem('theme');  // Crashes on server
</script>
```

✅ **Fix: Guard with browser check**
```svelte
<script>
  import { browser } from '$app/environment';

  let theme = $state('light');

  $effect(() => {
    if (browser) {
      theme = localStorage.getItem('theme') || 'light';
    }
  });
</script>
```

### Error: "document is not defined"

**Error message:**
```
ReferenceError: document is not defined
```

**Cause:** Accessing DOM during SSR.

❌ **Wrong:**
```svelte
<script>
  let element = document.getElementById('root');  // Crashes on server
</script>
```

✅ **Fix: Use $effect with browser check**
```svelte
<script>
  import { browser } from '$app/environment';

  let element = $state(null);

  $effect(() => {
    if (browser) {
      element = document.getElementById('root');
    }
  });
</script>
```

### Error: "Hydration mismatch"

**Error message:**
```
Hydration failed because the initial UI does not match what was rendered on the server
```

**Cause:** Server and client render different HTML.

❌ **Wrong: Different output**
```svelte
<script>
  let timestamp = Date.now();  // Different on server and client
</script>

<p>{timestamp}</p>
```

✅ **Fix: Use server data**
```ts
// +page.server.ts
export function load() {
  return { timestamp: Date.now() };
}
```

```svelte
<script>
  let { data } = $props();
</script>

<p>{data.timestamp}</p>
```

## Hot Module Reload Problems

### Error: "HMR disconnected" or dev server crashes

**Symptoms:**
- Dev server crashes on file save
- HMR disconnects repeatedly
- "Connection closed" errors

**Cause:** File watching conflicts or too many files watched.

**Fix: Configure Vite watch:**
```js
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  server: {
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.svelte-kit/**'
      ],
      usePolling: false  // Set to true if still having issues
    },
    fs: {
      strict: false  // Allow serving files from project root
    }
  }
});
```

**Increase file watcher limits (macOS/Linux):**
```bash
# Check current limit
ulimit -n

# Increase (temporary)
ulimit -n 10240

# Permanent (add to ~/.zshrc or ~/.bashrc)
echo "ulimit -n 10240" >> ~/.zshrc
```

### Error: "Port 5173 is already in use"

**Error message:**
```
Error: Port 5173 is already in use
```

**Fix 1: Kill existing process**
```bash
# Find process on port 5173
lsof -ti:5173

# Kill process
kill -9 $(lsof -ti:5173)
```

**Fix 2: Use different port**
```bash
# Run on different port
npm run dev -- --port 5174
```

**Fix 3: Configure in vite.config.js:**
```js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  server: {
    port: 5173,
    strictPort: false  // Try next port if 5173 is taken
  }
});
```

## TypeScript Configuration Errors

### Error: "Cannot find name '$state'"

**Error message:**
```
Cannot find name '$state'. Did you mean 'state'?
```

**Cause:** TypeScript not recognizing Svelte 5 runes.

**Fix: Check tsconfig.json:**
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ESNext"
  }
}
```

**Ensure Svelte 5 installed:**
```bash
npm list svelte
# Must be 5.x
```

### Error: "Type 'PageData' does not satisfy constraint"

**Cause:** Type mismatch between load function and component.

**Fix: Use generated types:**
```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // data is now properly typed
</script>
```

**In load function:**
```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    items: [],
    count: 0
  };
};
```

## Build and Production Errors

### Error: "Build failed with errors"

**Symptoms:**
- `npm run build` fails
- Vague error messages

**Debugging steps:**

1. **Clear caches:**
```bash
rm -rf .svelte-kit node_modules/.vite
npm install
npm run build
```

2. **Check for TypeScript errors:**
```bash
npx tsc --noEmit
```

3. **Enable verbose logging:**
```bash
npm run build -- --debug
```

4. **Check specific error:**
```bash
# Look at full error stack
npm run build 2>&1 | tee build-error.log
```

### Error: "Prerendering failed"

**Error message:**
```
Error: Prerendering failed
```

**Cause:** Accessing browser APIs or external data during prerender.

❌ **Wrong: Browser API in prerendered page**
```svelte
<script>
  let width = window.innerWidth;  // Crashes during prerender
</script>
```

✅ **Fix: Disable prerender or guard**
```ts
// +page.ts
export const prerender = false;

// Or guard with browser check
```

```svelte
<script>
  import { browser } from '$app/environment';

  let width = $state(0);

  $effect(() => {
    if (browser) {
      width = window.innerWidth;
    }
  });
</script>
```

## Deployment Failures

### Error: "Cannot find module './handler.js'"

**Symptoms:**
- Build succeeds locally
- Deployment fails

**Cause:** Missing adapter or incorrect configuration.

**Fix: Install correct adapter:**
```bash
# For Vercel
npm install -D @sveltejs/adapter-vercel

# For Cloudflare
npm install -D @sveltejs/adapter-cloudflare

# For Node
npm install -D @sveltejs/adapter-node
```

**Update svelte.config.js:**
```js
import adapter from '@sveltejs/adapter-vercel';  // Change based on platform

export default {
  kit: {
    adapter: adapter()
  }
};
```

### Error: "Environment variables not working"

**Symptoms:**
- Variables work locally
- Undefined in production

**Fix:**

1. **Check prefix:**
```ts
// ✅ Public variables need PUBLIC_ prefix
import { PUBLIC_API_URL } from '$env/static/public';

// ❌ Private variables can't be accessed on client
import { PRIVATE_KEY } from '$env/static/private';  // Server only
```

2. **Set in platform:**
- Vercel: Settings → Environment Variables
- Cloudflare: Settings → Environment Variables
- Node: Pass via CLI or .env file

3. **Rebuild after adding variables**

## Quick Troubleshooting Checklist

When something doesn't work:

**1. Check Vite config:**
```js
// ✅ Correct order
plugins: [tailwindcss(), sveltekit()]

// ❌ Wrong order
plugins: [sveltekit(), tailwindcss()]
```

**2. Check CSS import:**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css';  // Must be present
</script>
```

**3. Clear caches:**
```bash
rm -rf .svelte-kit node_modules/.vite
npm install
```

**4. Check versions:**
```bash
npm list svelte sveltekit tailwindcss
```

**5. Test production build:**
```bash
npm run build
npm run preview
```

**6. Check browser console:**
- Open DevTools (F12)
- Look for errors
- Check Network tab for failed requests

**7. Disable JavaScript test:**
- DevTools → Settings → Disable JavaScript
- Reload page
- Verify SSR works

**Common fixes:**
- [ ] Vite plugin order correct
- [ ] CSS imported in root layout
- [ ] Browser checks for client-only code
- [ ] Correct Svelte 5 version installed
- [ ] TypeScript extends SvelteKit config
- [ ] Environment variables set correctly
- [ ] Adapter matches deployment platform
- [ ] Build completes without errors

**Next steps:**
- Systematic debugging in `troubleshooting.md`
- Performance checks in `performance-optimization.md`
- Best practices in `best-practices.md`
