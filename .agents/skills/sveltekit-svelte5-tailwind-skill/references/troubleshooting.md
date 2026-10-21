---
title: "Systematic Troubleshooting for SvelteKit + Svelte 5 + Tailwind v4"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
last_reviewed: 2025-10-28
summary: "Debug development server issues, build process failures, CSS pipeline problems, Vite configuration errors using systematic approaches, source maps, and browser DevTools."
---

# Systematic Troubleshooting for SvelteKit + Svelte 5 + Tailwind v4

When things go wrong with your integrated stack, a systematic debugging approach saves hours of frustration. This guide teaches you how to isolate problems, use debugging tools effectively, and get help when stuck.

## Systematic Debugging Approach

Follow this methodical process to identify root causes quickly.

**The 5-step debugging process:**

1. **Reproduce** - Can you make the error happen consistently?
2. **Isolate** - Which component/file/action causes it?
3. **Hypothesize** - What might cause this behavior?
4. **Test** - Verify or eliminate each hypothesis
5. **Fix** - Apply solution and confirm

**Example: "Styles not loading"**

```
1. Reproduce:
   - npm run build && npm run preview
   - Open site → No Tailwind styles

2. Isolate:
   - Works in dev (npm run dev)
   - Fails in production
   - CSS file exists in build/

3. Hypothesize:
   - Vite plugin order wrong?
   - CSS not imported correctly?
   - Adapter issue?

4. Test:
   - Check vite.config.js → plugins: [tailwindcss(), sveltekit()] ✅
   - Check +layout.svelte → import '../app.css' ❌ MISSING

5. Fix:
   - Add CSS import to +layout.svelte
   - Rebuild → Works ✅
```

**Binary search debugging:**

When unsure where error occurs, cut code in half repeatedly:

```svelte
<!-- Page with 100 components -->
<script>
  // Test first half
  {#if false}
    <Component1 />
    ... (50 components)
  {/if}

  <!-- Test second half -->
  <Component51 />
  ... (50 components)
</script>
```

If error disappears, problem is in hidden half. Repeat on that section.

❌ **Wrong: Random changes**
```
// Try everything at once
- Change Vite config
- Update packages
- Modify Tailwind config
- Change import paths
// No idea what fixed it
```

✅ **Right: One change at a time**
```
1. Test: Change Vite plugin order → Still broken
2. Test: Clear .svelte-kit cache → Still broken
3. Test: Add CSS import → Fixed! ✅
```

## Dev Server Troubleshooting

Debug development server startup and runtime issues.

**Server won't start:**

```bash
# Error: "Cannot start dev server"

# 1. Check Node version
node --version  # Should be 18+

# 2. Check for port conflicts
lsof -ti:5173  # Shows process using port

# 3. Kill conflicting process
kill -9 $(lsof -ti:5173)

# 4. Clear caches
rm -rf .svelte-kit node_modules/.vite

# 5. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 6. Try again
npm run dev
```

**Server starts but crashes:**

Check console for errors:

❌ **Error: "EADDRINUSE"**
```
Fix: Port already in use
npm run dev -- --port 5174
```

❌ **Error: "EMFILE: too many open files"**
```
Fix: Increase file descriptor limit
ulimit -n 10240
npm run dev
```

❌ **Error: "Cannot find module"**
```
Fix: Missing dependency
npm install
```

**Hot Module Reload not working:**

```js
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  server: {
    watch: {
      // Ignore unnecessary files
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.svelte-kit/**'
      ]
    },

    // Enable HMR
    hmr: {
      overlay: true,
      port: 5173
    }
  }
});
```

**Enable debug logging:**

```bash
# Verbose Vite output
DEBUG=vite:* npm run dev

# SvelteKit debug
DEBUG=kit:* npm run dev

# All debug output
DEBUG=* npm run dev
```

**Check SvelteKit config:**

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

console.log('SvelteKit config loaded');  // Add logging

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter()
  }
};

export default config;
```

## Build Process Debugging

Debug production build failures systematically.

**Build fails:**

```bash
# Step 1: Clean build
rm -rf .svelte-kit build dist
npm run build

# Step 2: Check TypeScript
npx tsc --noEmit

# Step 3: Enable verbose logging
npm run build -- --debug

# Step 4: Check for specific errors
npm run build 2>&1 | tee build.log
grep ERROR build.log
```

**Common build errors:**

**Error 1: "Prerendering failed"**

```ts
// Find which page fails
// +page.ts or +layout.ts
export const prerender = false;  // Disable temporarily

// Then enable one by one to find culprit
```

**Error 2: "Rollup error"**

```bash
# Check for circular dependencies
npm run build -- --debug

# Look for:
# "Circular dependency: src/lib/A.svelte -> src/lib/B.svelte -> src/lib/A.svelte"
```

**Error 3: "Out of memory"**

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Debugging production build:**

```bash
# Build production
npm run build

# Test production build locally
npm run preview

# Check build output size
ls -lh build/client/_app/immutable/
du -sh build/

# Analyze bundle
npm install -D rollup-plugin-visualizer
```

```js
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    visualizer({ open: true })  // Opens bundle analysis
  ]
});
```

**Testing build without dev server:**

```bash
# Build
npm run build

# Test with simple HTTP server
npx serve build

# Or with Node
node build/index.js
```

## CSS Pipeline Debugging

Debug Tailwind CSS processing issues step-by-step.

**CSS not processing:**

```bash
# 1. Verify Tailwind v4 installed
npm list tailwindcss
# Should show: tailwindcss@4.0.0-alpha.x

# 2. Check Vite plugin order
cat vite.config.js | grep -A 5 "plugins:"
# Should see: tailwindcss() before sveltekit()

# 3. Check CSS file exists
cat src/app.css
# Should contain: @import "tailwindcss";

# 4. Check CSS imported
grep -r "import.*app.css" src/routes/
# Should find in +layout.svelte

# 5. Test in isolation
echo '<div class="text-red-500">Test</div>' > src/routes/+page.svelte
npm run dev
# Visit localhost:5173 - text should be red
```

**CSS works in dev, not production:**

```bash
# Build and check output
npm run build
ls -lh build/client/_app/immutable/assets/*.css

# Should see CSS file(s)
# If missing:

# 1. Check adapter configuration
cat svelte.config.js | grep adapter

# 2. Rebuild from scratch
rm -rf .svelte-kit build node_modules/.vite
npm install
npm run build

# 3. Check production preview
npm run preview
# Open browser and check if CSS loads
```

**Tailwind classes purged incorrectly:**

```bash
# 1. Check content configuration
cat tailwind.config.js

# Should include:
# content: ['./src/**/*.{html,js,svelte,ts}']

# 2. Build with debug
npm run build -- --debug 2>&1 | grep -i tailwind

# 3. Check for dynamic classes
grep -r "class=.*{" src/
# Look for template literals in class attributes

# 4. Add to safelist if needed
```

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    'bg-red-500',  // Add classes that are being purged
    'bg-blue-500'
  ]
};
```

**CSS source maps:**

```js
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  css: {
    devSourcemap: true  // Enable CSS source maps in dev
  },

  build: {
    sourcemap: true  // Enable in production
  }
});
```

**Inspect processed CSS:**

```bash
# After build, check generated CSS
cat build/client/_app/immutable/assets/*.css | head -50

# Should see Tailwind utilities, not @import statement
```

## Vite Configuration Issues

Debug Vite configuration problems systematically.

**Test Vite config validity:**

```bash
# Check syntax
node -c vite.config.js

# If error: Fix syntax first
```

**Common config issues:**

**Issue 1: Plugin order**

❌ **Wrong:**
```js
plugins: [sveltekit(), tailwindcss()]
```

✅ **Right:**
```js
plugins: [tailwindcss(), sveltekit()]
```

**Test:**
```bash
# Swap order and rebuild
npm run build

# Check if CSS processes correctly
```

**Issue 2: Resolve aliases**

```js
// vite.config.js
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  resolve: {
    alias: {
      $components: path.resolve('./src/lib/components'),
      $utils: path.resolve('./src/lib/utils')
    }
  }
});
```

**Test aliases:**

```svelte
<!-- Try importing with alias -->
<script>
  import Button from '$components/Button.svelte';
  import { format } from '$utils/format';
</script>
```

**Issue 3: Server configuration**

```js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  server: {
    port: 5173,
    host: true,  // Listen on all addresses
    strictPort: false,  // Try next port if busy

    // File watching
    watch: {
      usePolling: false,  // Set to true if HMR not working
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
});
```

**Debug Vite with logging:**

```js
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  logLevel: 'info',  // 'silent' | 'error' | 'warn' | 'info'

  // Custom logger
  customLogger: {
    info(msg) {
      console.log('[Vite Info]', msg);
    },
    warn(msg) {
      console.warn('[Vite Warn]', msg);
    },
    error(msg) {
      console.error('[Vite Error]', msg);
    }
  }
});
```

## Using Source Maps Effectively

Enable and use source maps for debugging.

**Enable source maps:**

```js
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  build: {
    sourcemap: true  // Generate .map files
  },

  css: {
    devSourcemap: true  // CSS source maps in dev
  }
});
```

**Using source maps in DevTools:**

```
1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Enable "Enable JavaScript source maps"
4. Enable "Enable CSS source maps"
5. Reload page
```

**Find original source:**

```
DevTools → Sources → webpack://
└── src/
    ├── routes/
    │   └── +page.svelte  ← Original source
    └── lib/
        └── components/
```

**Set breakpoints in original code:**

```svelte
<!-- +page.svelte -->
<script>
  function handleClick() {
    debugger;  // Debugger statement
    console.log('Clicked');
  }
</script>

<button onclick={handleClick}>Click</button>
```

**Step through code:**

```
1. Set breakpoint in DevTools
2. Trigger action
3. Use step controls:
   - Step over (F10)
   - Step into (F11)
   - Step out (Shift+F11)
```

## Browser DevTools Strategies

Use browser tools to debug effectively.

**Console debugging:**

```svelte
<script>
  let { data } = $props();

  // Log component mount
  console.log('Component mounted:', data);

  // $inspect for runes
  import { $inspect } from 'svelte';
  let count = $state(0);
  $inspect(count);  // Logs changes automatically

  // Conditional logging
  $effect(() => {
    if (count > 10) {
      console.warn('Count exceeds 10:', count);
    }
  });
</script>
```

**Network tab debugging:**

```
1. Open DevTools → Network tab
2. Reload page
3. Check for:
   - Failed requests (red)
   - Slow requests (> 1s)
   - CSS files loading
   - API calls returning data
```

**Filter network requests:**
```
- CSS: Filter by "css"
- JS: Filter by "js"
- API: Filter by "xhr" or "fetch"
- Images: Filter by "img"
```

**Check response:**

```
1. Click on request
2. Preview tab: See response data
3. Response tab: See raw response
4. Headers tab: See headers
5. Timing tab: See load times
```

**Performance profiling:**

```
1. DevTools → Performance tab
2. Click Record
3. Perform action
4. Stop recording
5. Analyze:
   - Long tasks
   - Layout shifts
   - Paint times
```

**Elements tab for CSS:**

```
1. Inspect element
2. Styles pane shows:
   - Applied styles
   - Computed styles
   - Source file (with source maps)
3. Click source file to jump to code
```

**Test SSR:**

```
1. DevTools → Settings
2. Check "Disable JavaScript"
3. Reload page
4. Verify content renders
5. Check for hydration issues
```

## Common Integration Gotchas

Watch for these subtle integration issues.

**Gotcha 1: Async in runes**

❌ **Doesn't work:**
```svelte
<script>
  let data = $state(null);

  // Won't work - $state runs immediately
  async function load() {
    data = await fetch('/api');
  }
  load();
</script>
```

✅ **Works:**
```ts
// +page.server.ts
export async function load() {
  return { data: await fetch('/api') };
}
```

**Gotcha 2: Class: directive order**

Order matters with `class:` directive:

```svelte
<!-- Base classes first, then conditionals -->
<div
  class="rounded p-4"
  class:bg-blue-500={active}
  class:bg-gray-200={!active}
>
```

**Gotcha 3: Tailwind @layer**

```css
/* app.css */
@import "tailwindcss";

/* ❌ Won't work: @layer after @import */
/* @layer components { ... } */

/* ✅ Works: Define in tailwind.config.js */
```

**Gotcha 4: SvelteKit fetch**

Always use SvelteKit's `fetch` in load functions:

```ts
// +page.ts
export async function load({ fetch }) {  // Use this fetch
  const res = await fetch('/api/data');
  return { data: await res.json() };
}
```

**Gotcha 5: Environment variables**

```ts
// ❌ Won't work: Private var on client
import { PRIVATE_KEY } from '$env/static/private';
// Can only use on server

// ✅ Works: Public var on client
import { PUBLIC_API_URL } from '$env/static/public';
```

## Getting Help Effectively

When stuck, ask for help the right way.

**Before asking:**

1. **Search existing issues:**
   - GitHub: `is:issue repo:sveltejs/kit <your error>`
   - Stack Overflow: `[sveltekit] <your error>`
   - Discord: Search history

2. **Create minimal reproduction:**
   ```bash
   npm create svelte@latest repro
   # Add only code needed to reproduce
   ```

3. **Gather info:**
   - Error messages (full stack trace)
   - Package versions
   - Config files
   - Steps to reproduce

**Good issue template:**

```markdown
## Description
CSS not loading in production build

## Steps to Reproduce
1. npm run build
2. npm run preview
3. Open http://localhost:4173

## Expected Behavior
Tailwind styles should be visible

## Actual Behavior
Page is unstyled

## Environment
- SvelteKit: 2.0.0
- Svelte: 5.0.0
- Tailwind: 4.0.0-alpha.25
- Node: 20.10.0
- OS: macOS 14.0

## Reproduction
https://github.com/user/repro

## Config Files
[Paste vite.config.js]
[Paste svelte.config.js]
```

**Where to ask:**

- **GitHub Issues**: Bugs, feature requests
- **Discord**: Quick questions, community help
- **Stack Overflow**: Detailed problems, searchable solutions
- **Reddit r/sveltejs**: General discussion

**Checklist before asking:**
- [ ] Searched existing issues
- [ ] Created minimal reproduction
- [ ] Included all relevant info
- [ ] Tested on latest versions
- [ ] Cleared caches and rebuilt
- [ ] Checked docs for solution

**Next steps:**
- Fix common issues in `common-issues.md`
- Optimize performance in `performance-optimization.md`
- Follow best practices in `best-practices.md`
