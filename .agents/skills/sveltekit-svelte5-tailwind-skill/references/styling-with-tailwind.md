---
title: "Styling with Tailwind CSS v4 in SvelteKit and Svelte 5"
version_anchors: ["Tailwind@4.x", "SvelteKit@2.x", "Svelte@5.x"]
authored: true
origin: self
adapted_from:
  - "tailwindlabs/tailwindcss repository (v4 documentation)"
last_reviewed: 2025-10-28
summary: "Complete Tailwind v4 integration patterns including CSS import strategies, content detection, component styling, dark mode, custom utilities, and common issues."
---

# Styling with Tailwind CSS v4 in SvelteKit and Svelte 5

Tailwind CSS v4 brings a simplified configuration approach and better performance. This guide covers integration patterns specific to SvelteKit and Svelte 5, including content detection for template syntax and SSR considerations.

## Tailwind v4 Setup Complete

Install and configure Tailwind v4 with the new Vite plugin architecture.

**Installation:**
```bash
npm install -D tailwindcss@next @tailwindcss/vite@next
```

**Create `src/app.css`:**
```css
@import "tailwindcss";
```

**Configure `vite.config.js`:**
```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(), // Must be before sveltekit()
    sveltekit()
  ]
});
```

**Import CSS in `src/routes/+layout.svelte`:**
```svelte
<script>
  import '../app.css';
</script>

<slot />
```

❌ **Wrong: Using v3 syntax**
```css
/* app.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

✅ **Right: Using v4 import**
```css
/* app.css */
@import "tailwindcss";
```

**Optional `tailwind.config.js` (v4 works without it):**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}']
};
```

## CSS Import Strategies

Choose the right CSS import location for your needs.

**Strategy 1: Root layout import (recommended)**
```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';
</script>

<slot />
```

**Benefits:**
- Explicit and predictable
- Works correctly with SSR
- HMR-friendly
- CSS available to all routes

**Strategy 2: Vite config only (no import needed)**
```js
// vite.config.js
export default defineConfig({
  plugins: [
    tailwindcss(), // Auto-injects CSS
    sveltekit()
  ]
});
```

**Benefits:**
- Less boilerplate
- Automatic injection

**Drawbacks:**
- Less explicit
- Harder to debug CSS loading issues

❌ **Wrong: Importing in every page**
```svelte
<!-- +page.svelte -->
<script>
  import '../app.css'; // Loaded multiple times
</script>
```

✅ **Right: Import once in root layout**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css'; // Loaded once for entire app
</script>
```

**Custom theme CSS alongside Tailwind:**
```css
/* src/app.css */
@import "tailwindcss";

/* Custom global styles after Tailwind */
:root {
  --brand-primary: #3b82f6;
  --brand-secondary: #8b5cf6;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
}
```

## Content Detection and Purging

Configure Tailwind to detect classes in Svelte's template syntax.

**Basic content configuration:**
```js
// tailwind.config.js
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/**/*.{svelte,js,ts}' // Redundant but explicit
  ]
};
```

**Problem: Dynamic classes in conditionals**

❌ **Wrong: Template literals hide classes from purging**
```svelte
<script>
  let type = $state('primary');
  let color = type === 'primary' ? 'blue' : 'red';
</script>

<!-- This class won't be detected -->
<div class="bg-{color}-500">Bad</div>
```

✅ **Right: Use class: directive with full class names**
```svelte
<script>
  let type = $state('primary');
</script>

<div
  class:bg-blue-500={type === 'primary'}
  class:bg-red-500={type === 'secondary'}
>
  Good
</div>
```

**Safelisting dynamic classes:**
```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: [
    'bg-red-500',
    'bg-green-500',
    'bg-blue-500',
    {
      pattern: /bg-(red|green|blue)-(400|500|600)/,
      variants: ['hover', 'focus']
    }
  ]
};
```

**Svelte-specific content patterns:**
```js
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './src/routes/**/*.{svelte,js,ts}',  // Routes
    './src/lib/**/*.{svelte,js,ts}'      // Components
  ]
};
```

**Content detection for Svelte control blocks:**

Tailwind v4 correctly detects classes in:
- `{#if}` blocks
- `{#each}` blocks
- `{#await}` blocks
- `{@html}` (use with caution)

```svelte
<!-- All these classes are detected -->
{#if condition}
  <div class="bg-blue-500">If block</div>
{:else}
  <div class="bg-red-500">Else block</div>
{/if}

{#each items as item}
  <div class="border p-4">{item}</div>
{/each}
```

## Component Styling Patterns

Style reusable components with Tailwind utilities.

**Base component pattern:**
```svelte
<!-- Button.svelte -->
<script>
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    onclick,
    children
  } = $props();

  let baseClasses = 'rounded font-semibold transition';

  let variantClasses = $derived({
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
  }[variant]);

  let sizeClasses = $derived({
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }[size]);
</script>

<button
  {onclick}
  {disabled}
  class="{baseClasses} {variantClasses} {sizeClasses}"
  class:opacity-50={disabled}
  class:cursor-not-allowed={disabled}
>
  {@render children()}
</button>
```

**Using the component:**
```svelte
<script>
  import Button from '$components/ui/Button.svelte';
</script>

<Button variant="primary" size="lg">
  Click me
</Button>
```

❌ **Wrong: Using @apply for component styles**
```svelte
<style>
  .btn {
    @apply px-4 py-2 rounded bg-blue-500 text-white;
  }
</style>

<button class="btn">Button</button>
```

✅ **Right: Using utility classes directly**
```svelte
<button class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
  Button
</button>
```

**Prop-based styling with runes:**
```svelte
<!-- Card.svelte -->
<script>
  let {
    elevated = false,
    bordered = true,
    padding = 'md',
    children
  } = $props();

  let classes = $derived(`
    ${elevated ? 'shadow-lg' : 'shadow'}
    ${bordered ? 'border border-gray-200' : ''}
    ${padding === 'sm' ? 'p-2' : padding === 'md' ? 'p-4' : 'p-6'}
    rounded bg-white
  `.trim());
</script>

<div class={classes}>
  {@render children()}
</div>
```

**Class composition helper:**
```ts
// src/lib/utils/classes.ts
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
```

```svelte
<script>
  import { cn } from '$lib/utils/classes';

  let { variant, active } = $props();

  let classes = $derived(cn(
    'px-4 py-2 rounded',
    variant === 'primary' && 'bg-blue-500',
    variant === 'secondary' && 'bg-gray-500',
    active && 'ring-2 ring-blue-300'
  ));
</script>

<button class={classes}>Button</button>
```

## Arbitrary Values in Templates

Use Tailwind's arbitrary value syntax in Svelte templates.

**Basic arbitrary values:**
```svelte
<!-- Colors -->
<div class="bg-[#1da1f2]">Twitter blue</div>
<div class="text-[oklch(0.5_0.2_180)]">Custom color</div>

<!-- Spacing -->
<div class="p-[13px] m-[2.5rem]">Custom spacing</div>

<!-- Sizes -->
<div class="w-[calc(100%-2rem)] h-[50vh]">Calc width</div>
```

**Arbitrary values with CSS variables:**
```css
/* app.css */
@import "tailwindcss";

:root {
  --sidebar-width: 250px;
  --header-height: 64px;
}
```

```svelte
<div class="w-[var(--sidebar-width)] h-[var(--header-height)]">
  Layout element
</div>
```

**Dynamic arbitrary values with runes:**
```svelte
<script>
  let width = $state(250);
  let height = $state(64);
</script>

<!-- Don't use template literals for arbitrary values -->
<!-- Safelist or use inline styles instead -->
<div style="width: {width}px; height: {height}px">
  Dynamic sizing
</div>
```

❌ **Wrong: Template literal in arbitrary value**
```svelte
<div class="w-[{width}px]">Won't work</div>
```

✅ **Right: Use inline styles for truly dynamic values**
```svelte
<div style="width: {width}px" class="bg-blue-500">Works</div>
```

## Dark Mode Implementation

Implement dark mode with Tailwind's class strategy.

**Configure dark mode:**
```js
// tailwind.config.js
export default {
  darkMode: 'class', // or 'media' for system preference
  content: ['./src/**/*.{html,js,svelte,ts}']
};
```

**Dark mode toggle component:**
```svelte
<!-- DarkModeToggle.svelte -->
<script>
  import { browser } from '$app/environment';

  let darkMode = $state(false);

  $effect(() => {
    if (browser) {
      // Load preference
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      darkMode = stored === 'dark' || (!stored && prefersDark);

      // Apply class
      document.documentElement.classList.toggle('dark', darkMode);
    }
  });

  function toggle() {
    darkMode = !darkMode;
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }
</script>

<button
  onclick={toggle}
  class="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
  aria-label="Toggle dark mode"
>
  {#if darkMode}
    <span class="text-2xl">☀️</span>
  {:else}
    <span class="text-2xl">🌙</span>
  {/if}
</button>
```

**Using dark mode classes:**
```svelte
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 class="text-3xl font-bold dark:text-blue-400">
    Title
  </h1>
  <p class="text-gray-600 dark:text-gray-400">
    Description
  </p>
</div>
```

**Dark mode with CSS variables:**
```css
/* app.css */
@import "tailwindcss";

:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
}

:root.dark {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
}
```

```svelte
<div class="bg-[var(--bg-primary)] text-[var(--text-primary)]">
  Theme-aware content
</div>
```

## Custom Utilities and Plugins

Extend Tailwind with custom utilities and plugins.

**Custom utilities in CSS:**
```css
/* app.css */
@import "tailwindcss";

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

**Using custom utilities:**
```svelte
<p class="text-balance">
  This text will balance across lines
</p>

<div class="scrollbar-hide overflow-y-auto">
  Content without scrollbar
</div>
```

**Theme customization:**
```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          900: '#1e3a8a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      spacing: {
        18: '4.5rem',
        88: '22rem'
      }
    }
  }
};
```

**Custom plugin:**
```js
// tailwind.config.js
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.card': {
          padding: '1rem',
          borderRadius: '0.5rem',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }
      });
    })
  ]
};
```

## Responsive Design Best Practices

Use Tailwind's responsive modifiers effectively.

**Mobile-first approach:**
```svelte
<div class="
  p-4 md:p-6 lg:p-8
  text-base md:text-lg lg:text-xl
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
  Responsive content
</div>
```

**Responsive layout patterns:**
```svelte
<!-- Stack on mobile, sidebar on desktop -->
<div class="flex flex-col md:flex-row">
  <aside class="w-full md:w-64 md:flex-shrink-0">
    Sidebar
  </aside>
  <main class="flex-1">
    Content
  </main>
</div>
```

**Container queries (Tailwind v4):**
```svelte
<div class="@container">
  <div class="@md:grid @md:grid-cols-2 @lg:grid-cols-3">
    Container-responsive grid
  </div>
</div>
```

**Responsive utilities with runes:**
```svelte
<script>
  import { browser } from '$app/environment';

  let isMobile = $state(false);

  $effect(() => {
    if (browser) {
      const checkMobile = () => {
        isMobile = window.innerWidth < 768;
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  });
</script>

{#if isMobile}
  <MobileNav />
{:else}
  <DesktopNav />
{/if}
```

## Animations with Tailwind

Use built-in animations and create custom transitions.

**Built-in animations:**
```svelte
<div class="animate-spin">⏳</div>
<div class="animate-bounce">⬇️</div>
<div class="animate-pulse">Loading...</div>
```

**Custom animations:**
```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out'
      }
    }
  }
};
```

```svelte
<div class="animate-slide-in">
  Slides in from left
</div>
```

**Transition utilities:**
```svelte
<button class="
  transition-all duration-200
  bg-blue-500 hover:bg-blue-600
  scale-100 hover:scale-105
  shadow-md hover:shadow-lg
">
  Hover me
</button>
```

**Svelte transitions with Tailwind classes:**
```svelte
<script>
  import { fade, slide } from 'svelte/transition';

  let visible = $state(true);
</script>

{#if visible}
  <div
    transition:fade
    class="rounded bg-blue-500 p-4 text-white"
  >
    Fades in/out
  </div>
{/if}
```

## Common Styling Issues

**Issue 1: Classes not applying**

❌ **Cause: Plugin order wrong**
```js
plugins: [sveltekit(), tailwindcss()] // Wrong order
```

✅ **Fix:**
```js
plugins: [tailwindcss(), sveltekit()] // Correct order
```

**Issue 2: FOUC (Flash of Unstyled Content)**

❌ **Cause: CSS not loaded before render**

✅ **Fix: Import in root layout**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css'; // Ensure CSS loads first
</script>
```

**Issue 3: Purged classes**

❌ **Cause: Dynamic class names**
```svelte
<div class="bg-{color}-500">Won't work</div>
```

✅ **Fix: Use safelist or class: directive**
```js
// tailwind.config.js
safelist: ['bg-red-500', 'bg-blue-500']
```

**Issue 4: SSR hydration mismatch**

❌ **Cause: Client-only dark mode**
```svelte
<script>
  let dark = localStorage.getItem('dark');
</script>
```

✅ **Fix: Match server and client**
```svelte
<script>
  import { browser } from '$app/environment';
  let dark = $state(false);

  $effect(() => {
    if (browser) {
      dark = localStorage.getItem('dark') === 'true';
    }
  });
</script>
```

**Debugging checklist:**
- [ ] Vite plugin order correct (Tailwind before SvelteKit)
- [ ] CSS imported in root layout
- [ ] Content paths include all files
- [ ] Dynamic classes safelisted
- [ ] No template literals in class names
- [ ] Browser checks for client-only code
- [ ] Build completes without errors
- [ ] Styles work in production build

**Next steps:**
- Learn component patterns in `styling-patterns.md`
- Migrate from v3 in `tailwind-v4-migration.md`
- Optimize production in `performance-optimization.md`
- Handle SSR styling in `server-rendering.md`
