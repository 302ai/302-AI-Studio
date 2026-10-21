---
title: "Optimize Performance for SvelteKit 2 + Svelte 5 + Tailwind v4 Applications"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "Web performance best practices and Core Web Vitals optimization patterns"
  - "SvelteKit and Tailwind optimization strategies from production deployments"
last_reviewed: 2025-10-28
summary: "Achieve excellent performance scores with bundle optimization, CSS purging, code splitting, image handling, lazy loading, and Core Web Vitals improvements for production deployments."
---

# Optimize Performance for SvelteKit 2 + Svelte 5 + Tailwind v4 Applications

This guide provides actionable strategies to optimize your SvelteKit application for production performance, focusing on bundle size, CSS efficiency, and Core Web Vitals.

## Bundle Size Optimization

Reduce JavaScript bundle sizes for faster load times:

**Analyze your bundle:**
```bash
# Build with analysis
npm run build

# Check bundle sizes
ls -lh .svelte-kit/output/client/_app/immutable/chunks/

# Use bundle analyzer (add to project)
npm install -D rollup-plugin-visualizer
```

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    sveltekit(),
    visualizer({
      emitFile: true,
      filename: 'stats.html'
    })
  ]
};
```

**Tree-shaking optimization:**
```ts
// ❌ WRONG: Import entire library
import _ from 'lodash';

export function formatData(items) {
  return _.sortBy(items, 'name');
}

// ✅ CORRECT: Import only needed functions
import { sortBy } from 'lodash-es';

export function formatData(items) {
  return sortBy(items, 'name');
}

// ✅ BETTER: Use native methods when possible
export function formatData(items) {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
```

**Lazy loading heavy dependencies:**
```svelte
<!-- ❌ WRONG: Load chart library eagerly -->
<script>
  import Chart from 'chart.js/auto';

  let showChart = $state(false);
</script>

<!-- ✅ CORRECT: Load only when needed -->
<script>
  import { browser } from '$app/environment';

  let showChart = $state(false);
  let Chart = $state(null);

  async function loadChart() {
    if (browser && !Chart) {
      const module = await import('chart.js/auto');
      Chart = module.default;
    }
  }

  $effect(() => {
    if (showChart) {
      loadChart();
    }
  });
</script>

<button onclick={() => showChart = true}>
  Show Analytics
</button>

{#if showChart}
  {#if Chart}
    <canvas id="chart"></canvas>
  {:else}
    <div class="animate-pulse bg-gray-200 h-64 rounded"></div>
  {/if}
{/if}
```

**Manual chunk splitting:**
```js
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor code
          'vendor-svelte': ['svelte', '@sveltejs/kit'],

          // Separate UI components
          'ui-components': [
            './src/lib/components/ui/Button.svelte',
            './src/lib/components/ui/Card.svelte',
            './src/lib/components/ui/Input.svelte'
          ],

          // Separate heavy features
          'feature-analytics': [
            './src/lib/components/features/analytics'
          ]
        }
      }
    },
    // Increase chunk size warning limit if needed
    chunkSizeWarningLimit: 600
  }
};
```

**Remove unused code:**
```bash
# Analyze dependencies
npm install -D depcheck
npx depcheck

# Remove unused packages
npm uninstall unused-package-1 unused-package-2
```

## CSS Purging and Minification

Tailwind v4 automatically purges unused CSS, but you can optimize further:

**Content paths configuration:**
```css
/* app.css */
@import "tailwindcss";

/* Specify all paths containing class names */
@source "src/routes/**/*.svelte";
@source "src/lib/**/*.svelte";
@source "src/lib/**/*.ts"; /* For class strings in TypeScript */
```

**Safelist dynamic classes:**
```css
/* app.css */
@import "tailwindcss";

/* Safelist classes generated dynamically */
@utility safe(bg-red-500);
@utility safe(bg-green-500);
@utility safe(bg-blue-500);
@utility safe(text-red-600);
@utility safe(text-green-600);
@utility safe(text-blue-600);
```

```svelte
<!-- Dynamic classes that need safelisting -->
<script>
  let status = $state('success'); // 'success' | 'error' | 'warning'

  const statusColors = {
    success: 'bg-green-500 text-green-600',
    error: 'bg-red-500 text-red-600',
    warning: 'bg-blue-500 text-blue-600'
  };
</script>

<div class={statusColors[status]}>
  Status indicator
</div>
```

**Avoid dynamic class generation:**
```svelte
<!-- ❌ WRONG: Dynamic class generation -->
<script>
  let color = $state('blue');
</script>
<div class="bg-{color}-500">Bad pattern</div>

<!-- ✅ CORRECT: Full class names with conditionals -->
<script>
  let color = $state('blue');
</script>
<div
  class:bg-blue-500={color === 'blue'}
  class:bg-red-500={color === 'red'}
  class:bg-green-500={color === 'green'}
>
  Good pattern
</div>
```

**Production CSS optimization:**
```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss(), sveltekit()],
  css: {
    devSourcemap: true, // Dev only
  },
  build: {
    cssMinify: 'lightningcss', // Faster than default
    cssCodeSplit: true // Split CSS per route
  }
};
```

**Check CSS bundle size:**
```bash
npm run build

# Look for CSS files
find .svelte-kit/output -name "*.css" -exec ls -lh {} \;

# Typical sizes:
# - Small app: 10-30 KB
# - Medium app: 30-60 KB
# - Large app: 60-100 KB
# If >150 KB, investigate unused classes
```

## Code Splitting Strategies

Split code effectively across routes and components:

**Route-based splitting (automatic):**
```
routes/
├── +page.svelte              → index.[hash].js
├── about/+page.svelte        → about.[hash].js
├── dashboard/+page.svelte    → dashboard.[hash].js
└── settings/+page.svelte     → settings.[hash].js
```

**Component lazy loading:**
```svelte
<!-- Dashboard.svelte -->
<script>
  import { browser } from '$app/environment';

  let activeTab = $state('overview');
  let components = $state({});

  async function loadComponent(name: string) {
    if (!components[name] && browser) {
      switch(name) {
        case 'analytics':
          components[name] = (await import('./DashboardAnalytics.svelte')).default;
          break;
        case 'reports':
          components[name] = (await import('./DashboardReports.svelte')).default;
          break;
        case 'settings':
          components[name] = (await import('./DashboardSettings.svelte')).default;
          break;
      }
    }
  }

  $effect(() => {
    loadComponent(activeTab);
  });
</script>

<nav class="tabs">
  <button onclick={() => activeTab = 'overview'}>Overview</button>
  <button onclick={() => activeTab = 'analytics'}>Analytics</button>
  <button onclick={() => activeTab = 'reports'}>Reports</button>
</nav>

<div class="tab-content">
  {#if activeTab === 'overview'}
    <p>Overview content (inline)</p>
  {:else if components[activeTab]}
    <svelte:component this={components[activeTab]} />
  {:else}
    <div class="h-64 bg-gray-100 animate-pulse rounded"></div>
  {/if}
</div>
```

**Preload critical routes:**
```svelte
<!-- +layout.svelte -->
<script>
  import { preloadData } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Preload likely next routes
    preloadData('/dashboard');
    preloadData('/profile');
  });
</script>

<nav>
  <!-- These routes are preloaded on mount -->
  <a href="/dashboard" class="nav-link">Dashboard</a>
  <a href="/profile" class="nav-link">Profile</a>
</nav>
```

**Conditional loading for authenticated routes:**
```svelte
<!-- +layout.svelte -->
<script>
  import { preloadData } from '$app/navigation';

  export let data;

  $effect(() => {
    if (data.user) {
      // Only preload when user is logged in
      preloadData('/dashboard');
      preloadData('/settings');
    }
  });
</script>
```

## Image Optimization

Optimize images for web delivery:

**Responsive images:**
```svelte
<!-- ❌ WRONG: Single large image -->
<img src="/images/hero-4k.jpg" alt="Hero" class="w-full" />

<!-- ✅ CORRECT: Responsive with modern formats -->
<picture>
  <!-- WebP for modern browsers -->
  <source
    type="image/webp"
    srcset="
      /images/hero-400.webp 400w,
      /images/hero-800.webp 800w,
      /images/hero-1200.webp 1200w,
      /images/hero-1600.webp 1600w
    "
    sizes="(max-width: 640px) 400px,
           (max-width: 1024px) 800px,
           (max-width: 1536px) 1200px,
           1600px"
  />

  <!-- JPEG fallback -->
  <img
    src="/images/hero-800.jpg"
    srcset="
      /images/hero-400.jpg 400w,
      /images/hero-800.jpg 800w,
      /images/hero-1200.jpg 1200w
    "
    sizes="(max-width: 640px) 400px,
           (max-width: 1024px) 800px,
           1200px"
    alt="Hero image"
    loading="lazy"
    decoding="async"
    class="w-full h-auto"
  />
</picture>
```

**Image component for consistent handling:**
```svelte
<!-- OptimizedImage.svelte -->
<script lang="ts">
  interface ImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
  }

  let {
    src,
    alt,
    width,
    height,
    priority = false,
    className = ''
  }: ImageProps = $props();

  // Generate srcset for different sizes
  const sizes = [400, 800, 1200, 1600];
  const srcsetWebp = sizes.map(w =>
    `${src.replace(/\.[^.]+$/, '')}-${w}.webp ${w}w`
  ).join(', ');
  const srcsetJpg = sizes.map(w =>
    `${src.replace(/\.[^.]+$/, '')}-${w}.jpg ${w}w`
  ).join(', ');

  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
</script>

<picture>
  <source type="image/webp" srcset={srcsetWebp} />
  <img
    {src}
    {alt}
    {width}
    {height}
    {loading}
    fetchpriority={fetchPriority}
    decoding="async"
    class={className}
  />
</picture>
```

**Blur placeholder for better UX:**
```svelte
<script>
  let loaded = $state(false);
  let imgSrc = $props().src;
</script>

<div class="relative overflow-hidden">
  <!-- Tiny blurred placeholder (inline data URI) -->
  <img
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Cimage filter='url(%23b)' x='0' y='0' height='100%25' width='100%25' href='data:image/png;base64,...'/%3E%3C/svg%3E"
    alt=""
    class="absolute inset-0 w-full h-full object-cover blur-xl"
    class:opacity-0={loaded}
    class:opacity-100={!loaded}
    aria-hidden="true"
  />

  <!-- Actual image -->
  <img
    {src}
    onload={() => loaded = true}
    alt="Product"
    loading="lazy"
    decoding="async"
    class="relative w-full h-full object-cover transition-opacity duration-300"
    class:opacity-0={!loaded}
    class:opacity-100={loaded}
  />
</div>
```

## Font Loading Best Practices

Optimize web font loading:

**Preload critical fonts:**
```svelte
<!-- +layout.svelte -->
<svelte:head>
  <!-- Preload primary font -->
  <link
    rel="preload"
    href="/fonts/inter-var.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />

  <!-- Preload display font if above-the-fold -->
  <link
    rel="preload"
    href="/fonts/playfair-display.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</svelte:head>
```

**Font display strategy:**
```css
/* app.css */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap; /* Show fallback immediately */
  font-style: normal;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-display.woff2') format('woff2');
  font-weight: 400 700;
  font-display: optional; /* Skip if not cached */
  font-style: normal;
}
```

**System font fallback:**
```css
/* tailwind.config.js or app.css @theme block */
@theme {
  --font-sans: Inter, system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;
}
```

**Variable fonts for better performance:**
```css
/* ✅ Use variable fonts to reduce requests */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-weight: 100 900; /* All weights in one file */
  font-display: swap;
}
```

## Lazy Loading Patterns

Load content progressively:

**Intersection Observer for lazy loading:**
```svelte
<!-- LazySection.svelte -->
<script>
  import { onMount } from 'svelte';

  let visible = $state(false);
  let element: HTMLElement;

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Load 100px before entering viewport
    );

    observer.observe(element);

    return () => observer.disconnect();
  });
</script>

<div bind:this={element} class="min-h-[400px]">
  {#if visible}
    <slot />
  {:else}
    <div class="h-full bg-gray-100 animate-pulse rounded"></div>
  {/if}
</div>
```

**Usage example:**
```svelte
<script>
  import LazySection from '$lib/components/LazySection.svelte';
  import HeavyComponent from '$lib/components/HeavyComponent.svelte';
</script>

<!-- Above the fold - loads immediately -->
<header>...</header>
<main>
  <section>Critical content</section>

  <!-- Below the fold - lazy loaded -->
  <LazySection>
    <HeavyComponent />
  </LazySection>
</main>
```

**Lazy load images in lists:**
```svelte
<script>
  let products = $props().products;
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  {#each products as product}
    <div class="card">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        decoding="async"
        class="w-full h-48 object-cover rounded"
      />
      <h3>{product.name}</h3>
      <p>{product.price}</p>
    </div>
  {/each}
</div>
```

## Preloading and Prefetching

Optimize navigation performance:

**Preload data for likely routes:**
```svelte
<!-- Navigation.svelte -->
<script>
  import { preloadData, preloadCode } from '$app/navigation';

  function handleMouseEnter(path: string) {
    // Preload route data on hover
    preloadData(path);
  }
</script>

<nav>
  <a
    href="/dashboard"
    onmouseenter={() => handleMouseEnter('/dashboard')}
    class="nav-link"
  >
    Dashboard
  </a>
  <a
    href="/profile"
    onmouseenter={() => handleMouseEnter('/profile')}
    class="nav-link"
  >
    Profile
  </a>
</nav>
```

**Prefetch on idle:**
```svelte
<script>
  import { onMount } from 'svelte';
  import { preloadData } from '$app/navigation';

  onMount(() => {
    // Wait for idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadData('/about');
        preloadData('/contact');
      });
    } else {
      // Fallback for Safari
      setTimeout(() => {
        preloadData('/about');
        preloadData('/contact');
      }, 1000);
    }
  });
</script>
```

**Instant navigation with prefetch:**
```svelte
<!-- Use data-sveltekit-preload-data for automatic prefetch -->
<a
  href="/dashboard"
  data-sveltekit-preload-data="hover"
  class="nav-link"
>
  Dashboard
</a>

<!-- Or preload on viewport entry -->
<a
  href="/profile"
  data-sveltekit-preload-data="viewport"
  class="nav-link"
>
  Profile
</a>
```

## Lighthouse Score Optimization

Target 90+ scores across all categories:

**Performance optimizations:**
```svelte
<!-- +layout.svelte -->
<svelte:head>
  <!-- Resource hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://api.example.com" />

  <!-- Critical CSS inline if needed -->
  <style>
    /* Critical above-the-fold styles */
    body { margin: 0; font-family: system-ui, sans-serif; }
  </style>
</svelte:head>
```

**Avoid layout shifts:**
```svelte
<!-- ❌ WRONG: No dimensions, causes CLS -->
<img src="/banner.jpg" alt="Banner" />

<!-- ✅ CORRECT: Fixed aspect ratio prevents shifts -->
<img
  src="/banner.jpg"
  alt="Banner"
  width="1200"
  height="400"
  class="w-full h-auto"
/>
```

**Optimize third-party scripts:**
```svelte
<svelte:head>
  <!-- ❌ WRONG: Blocking third-party script -->
  <script src="https://analytics.example.com/script.js"></script>

  <!-- ✅ CORRECT: Async loading -->
  <script async src="https://analytics.example.com/script.js"></script>

  <!-- ✅ BETTER: Defer to after page load -->
  <script defer src="https://analytics.example.com/script.js"></script>
</svelte:head>
```

## Core Web Vitals Checklist

Optimize for Google's performance metrics:

**Largest Contentful Paint (LCP < 2.5s):**
- [ ] Preload hero images
- [ ] Use CDN for static assets
- [ ] Optimize server response time
- [ ] Remove render-blocking resources
- [ ] Use SSR for critical content

**First Input Delay (FID < 100ms):**
- [ ] Minimize main-thread JavaScript
- [ ] Code split large bundles
- [ ] Defer non-critical JS
- [ ] Use web workers for heavy computation
- [ ] Lazy load below-the-fold content

**Cumulative Layout Shift (CLS < 0.1):**
- [ ] Set width/height on images
- [ ] Reserve space for dynamic content
- [ ] Avoid inserting content above existing content
- [ ] Use CSS transforms instead of layout properties
- [ ] Preload fonts with font-display: swap

**Testing Core Web Vitals:**
```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=http://localhost:4173

# Or use Lighthouse in Chrome DevTools
# 1. npm run build && npm run preview
# 2. Open DevTools > Lighthouse > Analyze
# 3. Check all Web Vitals metrics
```

**Monitor in production:**
```ts
// src/routes/+layout.svelte
<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  onMount(() => {
    if (browser && 'web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFID, onLCP }) => {
        onCLS(console.log);
        onFID(console.log);
        onLCP(console.log);
      });
    }
  });
</script>
```

## Performance Monitoring

Track performance in production:

**Basic performance tracking:**
```ts
// src/lib/performance.ts
export function measurePerformance() {
  if (typeof window === 'undefined') return;

  // Navigation timing
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart);

  // Resource timing
  const resources = performance.getEntriesByType('resource');
  console.log('Total resources:', resources.length);

  // Mark custom events
  performance.mark('app-interactive');
}
```

**Integration with analytics:**
```svelte
<!-- +layout.svelte -->
<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  onMount(() => {
    if (browser) {
      // Send performance metrics to analytics
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Send to your analytics service
          console.log(entry.name, entry.duration);
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  });
</script>
```

Follow these optimization strategies to achieve excellent performance scores and provide users with fast, responsive experiences in your SvelteKit application.
