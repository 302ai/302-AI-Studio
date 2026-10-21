---
title: "Getting Started with SvelteKit 2, Svelte 5, and Tailwind v4"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
last_reviewed: 2025-10-28
summary: "Zero to working SvelteKit + Svelte 5 + Tailwind v4 app in 10 minutes with verified integration and common setup error fixes."
---

# Getting Started with SvelteKit 2, Svelte 5, and Tailwind v4

Get a working SvelteKit 2, Svelte 5, and Tailwind v4 integration running in under 10 minutes. This guide walks you through the exact setup sequence that prevents common integration errors.

## Prerequisites and Environment Setup

Verify your environment meets these requirements before starting:

**Required versions:**
- Node.js 18.0 or higher
- npm 9.0+ or pnpm 8.0+
- Modern terminal (bash, zsh, or PowerShell)

**Check your versions:**
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

❌ **Wrong: Using outdated Node**
```bash
node --version
# v16.14.0  (Too old - will cause build errors)
```

✅ **Right: Using supported Node version**
```bash
node --version
# v20.10.0  (Perfect for this stack)
```

**Install Node 20 LTS if needed:**
```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from nodejs.org
```

## Create New SvelteKit Project

Use the official SvelteKit scaffolding to initialize your project with Svelte 5 support.

**Create project with recommended settings:**
```bash
npm create svelte@latest my-app
```

**Interactive prompts - choose these options:**
```
┌  Welcome to SvelteKit!
│
◆  Which template would you like?
│  ○ SvelteKit demo app
│  ● Skeleton project  ← Choose this
│
◆  Add type checking with TypeScript?
│  ● Yes, using TypeScript syntax  ← Recommended
│
◆  Add ESLint for code linting?
│  ● Yes  ← Recommended
│
◆  Add Prettier for code formatting?
│  ● Yes  ← Recommended
│
◆  Try the Svelte 5 preview?
│  ● Yes  ← CRITICAL: Must select for Svelte 5
│
└  Project created!
```

**Install dependencies:**
```bash
cd my-app
npm install
```

❌ **Wrong: Skipping the Svelte 5 preview option**
```bash
# This installs Svelte 4 - incompatible with runes
◆  Try the Svelte 5 preview?
│  ○ No
```

✅ **Right: Explicitly enabling Svelte 5**
```bash
# This installs Svelte 5 with runes support
◆  Try the Svelte 5 preview?
│  ● Yes
```

**Verify Svelte 5 installation:**
```bash
cat package.json | grep "svelte"
```

**Expected output:**
```json
"svelte": "^5.0.0",
"@sveltejs/kit": "^2.0.0",
"@sveltejs/vite-plugin-svelte": "^4.0.0"
```

## Install Tailwind CSS v4

Install Tailwind v4 using the `@next` tag and the new Vite plugin.

**Install Tailwind packages:**
```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
```

❌ **Wrong: Installing Tailwind v3**
```bash
npm install -D tailwindcss
# This installs v3.x which uses different config
```

✅ **Right: Installing Tailwind v4**
```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
# The @next tag ensures v4 installation
```

**Verify installation:**
```bash
npm list tailwindcss
```

**Expected output:**
```
my-app@0.0.1 /Users/you/my-app
└── tailwindcss@4.0.0-alpha.x
```

**Create Tailwind CSS file:**
```bash
touch src/app.css
```

**Add Tailwind directives to `src/app.css`:**
```css
@import "tailwindcss";
```

❌ **Wrong: Using v3 directives**
```css
/* v3 syntax - doesn't work in v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

✅ **Right: Using v4 import syntax**
```css
/* v4 simplified syntax */
@import "tailwindcss";
```

## Configure Vite and Tailwind

Configure Vite with the correct plugin order - this is critical for preventing build errors.

**Edit `vite.config.js`:**
```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(), // MUST be before sveltekit()
    sveltekit()
  ]
});
```

❌ **Wrong: Incorrect plugin order**
```js
export default defineConfig({
  plugins: [
    sveltekit(),
    tailwindcss()  // Too late - CSS won't process correctly
  ]
});
```

✅ **Right: Tailwind before SvelteKit**
```js
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes CSS first
    sveltekit()    // Transforms Svelte components second
  ]
});
```

**Create Tailwind config (optional for v4):**
```bash
touch tailwind.config.js
```

**Basic `tailwind.config.js` (minimal for v4):**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}']
};
```

**Import CSS in root layout:**

Edit `src/routes/+layout.svelte`:
```svelte
<script>
  import '../app.css';
</script>

<slot />
```

❌ **Wrong: Importing in individual pages**
```svelte
<!-- +page.svelte -->
<script>
  import '../app.css'; // This loads CSS on every page route
</script>
```

✅ **Right: Import once in root layout**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css'; // Loaded once for entire app
</script>
```

## Verify Integration Works

Test that all three tools work together correctly.

**Start dev server:**
```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Create test page with Tailwind styles:**

Edit `src/routes/+page.svelte`:
```svelte
<script>
  let count = $state(0);

  function increment() {
    count++;
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
  <div class="rounded-lg bg-white p-8 shadow-2xl">
    <h1 class="mb-4 text-3xl font-bold text-gray-800">
      SvelteKit + Svelte 5 + Tailwind v4
    </h1>
    <p class="mb-4 text-gray-600">
      Count: <span class="font-mono text-2xl text-blue-600">{count}</span>
    </p>
    <button
      onclick={increment}
      class="rounded bg-blue-500 px-6 py-2 font-semibold text-white transition hover:bg-blue-600 active:scale-95"
    >
      Increment
    </button>
  </div>
</div>
```

**Open browser:**
```
http://localhost:5173
```

**Verify these work:**
- [ ] Tailwind styles render (gradient background, rounded corners)
- [ ] Svelte 5 runes work (`$state()` updates on button click)
- [ ] Hot Module Reload updates without page refresh
- [ ] No console errors in browser DevTools

**Test production build:**
```bash
npm run build
```

**Expected successful output:**
```
vite v5.x.x building for production...
✓ built in 2.34s
```

❌ **Wrong: Build fails with CSS errors**
```
Error: Could not resolve @tailwindcss/vite
Failed to build
```

✅ **Right: Clean build with no errors**
```
✓ built in 2.34s
.svelte-kit/output/...
```

## Common Setup Errors

### Error: "Cannot find module '@tailwindcss/vite'"

**Cause:** Tailwind v4 package not installed or wrong version.

**Fix:**
```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
```

### Error: "$state is not defined"

**Cause:** Svelte 4 installed instead of Svelte 5.

**Fix:**
```bash
npm install svelte@^5.0.0 @sveltejs/kit@^2.0.0
```

### Error: "Tailwind directives not processed"

**Cause:** Plugin order wrong in `vite.config.js`.

**Fix - check plugin order:**
```js
export default defineConfig({
  plugins: [
    tailwindcss(), // MUST be first
    sveltekit()
  ]
});
```

### Error: "CSS not loading in browser"

**Cause:** CSS not imported in root layout.

**Fix - verify `src/routes/+layout.svelte`:**
```svelte
<script>
  import '../app.css'; // Must be present
</script>

<slot />
```

### Error: "HMR disconnected" or dev server crashes

**Cause:** File watching conflicts between Tailwind and Vite.

**Fix - add to `vite.config.js`:**
```js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
});
```

### Error: TypeScript errors with runes

**Cause:** TypeScript config not extending SvelteKit generated config.

**Fix - verify `tsconfig.json`:**
```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

## Next Steps

Now that your integration is working:

1. **Learn Svelte 5 runes** - Read `svelte5-runes.md` to understand `$state()`, `$derived()`, and SSR constraints
2. **Configure your project** - See `project-setup.md` for complete configuration options
3. **Style components** - Check `styling-with-tailwind.md` for Tailwind patterns in Svelte
4. **Build forms** - Read `forms-and-actions.md` for progressive enhancement with runes
5. **Deploy your app** - See `deployment-guide.md` for platform-specific configuration

**Quick reference checklist:**
- ✅ Node 18+ installed
- ✅ SvelteKit project created with Svelte 5 enabled
- ✅ Tailwind v4 installed with `@next` tag
- ✅ Vite config has plugins in correct order
- ✅ CSS imported in root layout
- ✅ Dev server running without errors
- ✅ Test page renders with Tailwind styles
- ✅ Production build completes successfully

**Troubleshooting:** If anything doesn't work, see `common-issues.md` for specific error solutions.
