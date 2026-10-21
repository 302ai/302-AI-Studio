---
title: "Server-Side Rendering with SvelteKit, Svelte 5 Runes, and Tailwind"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit repository (SSR documentation)"
last_reviewed: 2025-10-28
summary: "Master server-side rendering with Svelte 5 runes constraints, Tailwind CSS loading, FOUC prevention, hydration best practices, and SSR performance optimization."
---

# Server-Side Rendering with SvelteKit, Svelte 5 Runes, and Tailwind

SvelteKit renders pages on the server by default. Understanding how Svelte 5 runes behave during SSR and how to load Tailwind CSS without flash of unstyled content (FOUC) is critical for production applications.

## SSR Fundamentals Review

SvelteKit generates HTML on the server, then "hydrates" on the client.

**SSR flow:**
1. Server runs `+page.server.ts` load function
2. Server renders `+page.svelte` to HTML string
3. Server sends HTML + CSS + JavaScript to browser
4. Browser displays HTML immediately (First Contentful Paint)
5. JavaScript downloads and "hydrates" - attaches event listeners
6. Page becomes fully interactive

**SSR benefits:**
- Fast first contentful paint (FCP)
- SEO-friendly (search engines see content)
- Works without JavaScript
- Better perceived performance

**SSR challenges with Svelte 5:**
- Most runes don't run on server
- CSS must load before HTML renders
- Hydration mismatches cause errors

❌ **Wrong: Client-only code in SSR component**
```svelte
<!-- +page.svelte (renders on server) -->
<script>
  let count = $state(0);
  // ERROR: $state not defined on server

  localStorage.setItem('count', count);
  // ERROR: localStorage not defined on server
</script>
```

✅ **Right: Separate server data from client state**
```ts
// +page.server.ts (runs only on server)
export async function load() {
  return { initialCount: 0 };
}
```

```svelte
<!-- +page.svelte -->
<script>
  import { browser } from '$app/environment';

  let { data } = $props();
  let count = $state(data.initialCount);

  $effect(() => {
    if (browser) {
      localStorage.setItem('count', count.toString());
    }
  });
</script>
```

## Runes and SSR Constraints

Understand which runes work on the server and which don't.

**Rune SSR compatibility:**

| Rune | SSR | Behavior |
|------|-----|----------|
| `$state()` | ❌ No | Not available on server - crashes |
| `$derived()` | ⚠️ Partial | Runs once, doesn't re-run |
| `$effect()` | ❌ No | Skipped entirely on server |
| `$props()` | ✅ Yes | Receives data from load function |
| `$bindable()` | ✅ Yes | Props work normally |

**$state() - client-only:**
```svelte
<script>
  let { data } = $props();

  // ❌ Crashes on server
  // let count = $state(0);

  // ✅ Use data from load function
  // Hydrate as $state on client
  let count = $state(data.count);
</script>
```

**$derived() - runs once on server:**
```svelte
<script>
  let { data } = $props();

  // Runs once on server for initial HTML
  // Becomes reactive on client after hydration
  let total = $derived(
    data.items.reduce((sum, item) => sum + item.price, 0)
  );
</script>

<p>Total: ${total}</p>
```

**$effect() - client-only:**
```svelte
<script>
  import { browser } from '$app/environment';

  let count = $state(0);

  $effect(() => {
    // Only runs on client after hydration
    console.log('Effect ran:', count);

    // Still guard browser APIs
    if (browser) {
      document.title = `Count: ${count}`;
    }
  });
</script>
```

**SSR-safe pattern:**
```ts
// +page.server.ts
export async function load() {
  const user = await db.user.findFirst();
  const posts = await db.post.findMany({ where: { userId: user.id } });

  return {
    user,
    posts,
    timestamp: Date.now()
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  import { browser } from '$app/environment';

  let { data } = $props();

  // Server provides initial data
  let posts = $state(data.posts);
  let selectedPost = $state(null);

  // Client-only interactivity
  function selectPost(post) {
    selectedPost = post;
  }

  // Client-only persistence
  $effect(() => {
    if (browser && selectedPost) {
      localStorage.setItem('lastPost', selectedPost.id);
    }
  });
</script>

{#each posts as post}
  <article onclick={() => selectPost(post)}>
    <h2>{post.title}</h2>
  </article>
{/each}
```

## Data Loading Patterns

Use load functions to fetch data on the server, pass to client as props.

**Server-only load function:**
```ts
// +page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const user = locals.user; // From hooks
  const product = await db.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    throw error(404, 'Product not found');
  }

  return {
    user,
    product,
    relatedProducts: await db.product.findMany({
      where: { categoryId: product.categoryId },
      take: 4
    })
  };
};
```

**Universal load function (runs on server AND client):**
```ts
// +page.ts (no .server suffix)
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  // Use SvelteKit's fetch for SSR + client compatibility
  const response = await fetch(`/api/products/${params.id}`);
  const product = await response.json();

  return { product };
};
```

**Using load data in component:**
```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();

  // Server-rendered initially
  // Reactive on client
  let selectedImage = $state(data.product.images[0]);

  function selectImage(image) {
    selectedImage = image;
  }
</script>

<h1>{data.product.name}</h1>
<img src={selectedImage} alt={data.product.name} />

{#each data.product.images as image}
  <button onclick={() => selectImage(image)}>
    <img src={image} alt="" class="h-16 w-16" />
  </button>
{/each}
```

**Streaming data with promises:**
```ts
// +page.server.ts
export async function load() {
  return {
    // Resolved immediately (blocks SSR)
    user: await fetchUser(),

    // Streamed (doesn't block SSR)
    posts: fetchPosts()
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<!-- Rendered immediately -->
<h1>Welcome, {data.user.name}</h1>

<!-- Rendered after promise resolves -->
{#await data.posts}
  <p>Loading posts...</p>
{:then posts}
  {#each posts as post}
    <article>{post.title}</article>
  {/each}
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

## CSS Loading and FOUC Prevention

Ensure Tailwind CSS loads before HTML renders to prevent flash of unstyled content.

**Root layout CSS import (recommended):**
```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css'; // Loaded before any page renders
</script>

<slot />
```

**Why this works:**
- SvelteKit includes CSS in `<head>` before body
- Browser blocks render until CSS loads (no FOUC)
- Works correctly in both dev and production

❌ **Wrong: Importing CSS in pages**
```svelte
<!-- +page.svelte -->
<script>
  import '../app.css'; // Causes FOUC and multiple loads
</script>
```

✅ **Right: Import once in root layout**
```svelte
<!-- +layout.svelte -->
<script>
  import '../app.css';
</script>
```

**Critical CSS inlining (advanced):**
```svelte
<!-- src/app.html -->
<head>
  <style>
    /* Inline critical CSS for above-the-fold content */
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
    }
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
  %sveltekit.head%
</head>
```

**Loading states during hydration:**
```svelte
<script>
  import { browser } from '$app/environment';

  let hydrated = $state(false);

  $effect(() => {
    if (browser) {
      hydrated = true;
    }
  });
</script>

{#if !hydrated}
  <!-- Server-rendered, no interactivity -->
  <div class="cursor-wait">
    Content loading...
  </div>
{:else}
  <!-- Fully interactive -->
  <div class="cursor-pointer" onclick={handleClick}>
    Click me
  </div>
{/if}
```

**Preloading fonts to prevent FOIT:**
```svelte
<!-- +layout.svelte -->
<svelte:head>
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
</svelte:head>
```

## Hydration Best Practices

Ensure server-rendered HTML matches client-hydrated HTML.

**Hydration mismatch causes:**
1. Using browser APIs directly
2. Date/time rendering without normalization
3. Random values
4. Conditionals based on client-only state

❌ **Wrong: Hydration mismatch**
```svelte
<script>
  // Server renders nothing, client renders date
  // MISMATCH
  let now = new Date().toLocaleString();
</script>

<p>{now}</p>
```

✅ **Right: Server and client match**
```svelte
<script>
  import { browser } from '$app/environment';

  let { data } = $props(); // Server provides timestamp
  let now = $state(data.timestamp);

  $effect(() => {
    if (browser) {
      // Update only after hydration
      now = Date.now();
    }
  });
</script>

<p>{new Date(now).toLocaleString()}</p>
```

**Suppressing hydration warnings:**
```svelte
<!-- Only when intentional mismatch is acceptable -->
<div data-sveltekit-preload-data="off">
  {new Date().toLocaleString()}
</div>
```

**Client-only components:**
```svelte
<!-- ClientOnly.svelte -->
<script>
  import { browser } from '$app/environment';
  let { children } = $props();
</script>

{#if browser}
  {@render children()}
{/if}
```

```svelte
<!-- +page.svelte -->
<script>
  import ClientOnly from '$components/ClientOnly.svelte';
  import InteractiveMap from '$components/InteractiveMap.svelte';
</script>

<ClientOnly>
  <InteractiveMap />
</ClientOnly>
```

**Testing for hydration issues:**
```bash
# Run build
npm run build

# Preview production build
npm run preview

# Open browser with DevTools
# Check console for hydration warnings
```

## Streaming SSR Considerations

Stream slow data without blocking initial page render.

**Streaming pattern:**
```ts
// +page.server.ts
export async function load() {
  return {
    // Fast data (blocks SSR)
    user: await db.user.findFirst(),

    // Slow data (streamed)
    analytics: fetchAnalytics(), // Promise, not awaited
    recommendations: fetchRecommendations()
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<!-- Rendered immediately -->
<header>
  <h1>Welcome, {data.user.name}</h1>
</header>

<!-- Rendered after promise resolves -->
<aside>
  {#await data.analytics}
    <div class="animate-pulse">Loading analytics...</div>
  {:then analytics}
    <AnalyticsDashboard {analytics} />
  {/await}
</aside>

<main>
  {#await data.recommendations}
    <div class="grid grid-cols-3 gap-4">
      {#each Array(6) as _}
        <div class="h-48 animate-pulse bg-gray-200"></div>
      {/each}
    </div>
  {:then recommendations}
    {#each recommendations as item}
      <ProductCard {item} />
    {/each}
  {/await}
</main>
```

**Tailwind classes in loading states:**
```svelte
{#await data.posts}
  <!-- Skeleton loader with Tailwind -->
  <div class="space-y-4">
    {#each Array(3) as _}
      <div class="animate-pulse space-y-2 rounded border p-4">
        <div class="h-4 w-3/4 rounded bg-gray-300"></div>
        <div class="h-4 w-1/2 rounded bg-gray-300"></div>
      </div>
    {/each}
  </div>
{:then posts}
  {#each posts as post}
    <article class="rounded border p-4">
      <h2 class="text-xl font-bold">{post.title}</h2>
      <p class="text-gray-600">{post.excerpt}</p>
    </article>
  {/each}
{/await}
```

## Server vs Client Components

Organize code by where it runs.

**Server-only code (`lib/server/`):**
```ts
// src/lib/server/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL);
```

```ts
// src/lib/server/auth.ts
import { PRIVATE_API_KEY } from '$env/static/private';

export async function verifyToken(token: string) {
  // Server-only logic
  return fetch('https://api.example.com/verify', {
    headers: { 'Authorization': `Bearer ${PRIVATE_API_KEY}` }
  });
}
```

**Client-friendly utilities (`lib/utils/`):**
```ts
// src/lib/utils/format.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

**Component organization:**
```
src/lib/components/
├── ui/              # Universal components (work on server)
│   ├── Button.svelte
│   └── Card.svelte
├── client/          # Client-only components
│   ├── Chart.svelte
│   └── InteractiveMap.svelte
└── server/          # Server-rendered only
    └── Analytics.svelte
```

**Enforcing server-only imports:**
```ts
// vite.config.js
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    conditions: ['browser', 'module', 'import']
  },
  ssr: {
    noExternal: [] // Force SSR for certain packages
  }
});
```

## SSR Performance Optimization

Optimize server-side rendering for faster Time to First Byte (TTFB).

**Parallel data fetching:**
```ts
// +page.server.ts
export async function load() {
  // ❌ Sequential (slow)
  // const user = await fetchUser();
  // const posts = await fetchPosts();

  // ✅ Parallel (fast)
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts()
  ]);

  return { user, posts };
}
```

**Caching expensive operations:**
```ts
// +page.server.ts
import { setHeaders } from '@sveltejs/kit';

export async function load({ setHeaders }) {
  const data = await expensiveOperation();

  // Cache for 1 hour
  setHeaders({
    'cache-control': 'public, max-age=3600'
  });

  return { data };
}
```

**Lazy-loading components:**
```svelte
<script>
  let { data } = $props();
  let showMap = $state(false);
</script>

<button onclick={() => showMap = true}>
  Show Map
</button>

{#if showMap}
  {#await import('$components/client/Map.svelte')}
    <p>Loading map...</p>
  {:then { default: Map }}
    <Map location={data.location} />
  {/await}
{/if}
```

**Prerendering static pages:**
```ts
// +page.ts
export const prerender = true;

export function load() {
  return {
    staticContent: 'This page is pre-rendered at build time'
  };
}
```

**Selective SSR:**
```ts
// +page.ts
export const ssr = false; // Disable SSR for this page

// Or enable SSR by default (default behavior)
export const ssr = true;
```

## Common SSR Errors

**Error 1: "$state is not defined"**

❌ **Cause:**
```svelte
<script>
  let count = $state(0); // Used in SSR context
</script>
```

✅ **Fix:**
```svelte
<script>
  let { data } = $props();
  let count = $state(data.count); // Hydrate from server data
</script>
```

**Error 2: "localStorage is not defined"**

❌ **Cause:**
```svelte
<script>
  let theme = localStorage.getItem('theme'); // Runs on server
</script>
```

✅ **Fix:**
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

**Error 3: "Hydration mismatch"**

❌ **Cause:**
```svelte
<p>{Math.random()}</p> <!-- Different on server and client -->
```

✅ **Fix:**
```svelte
<script>
  let { data } = $props();
</script>

<p>{data.randomValue}</p> <!-- Consistent -->
```

**Error 4: "CSS not loading"**

❌ **Cause:**
```js
// vite.config.js
plugins: [sveltekit(), tailwindcss()] // Wrong order
```

✅ **Fix:**
```js
plugins: [tailwindcss(), sveltekit()] // Correct order
```

**Debugging SSR issues:**
```bash
# Check server-side logs
npm run build
node build/index.js

# Test without JavaScript
# 1. Open DevTools
# 2. Disable JavaScript in settings
# 3. Reload page
# 4. Verify content still renders
```

**SSR checklist:**
- [ ] Load functions fetch data on server
- [ ] No `$state()` in SSR components
- [ ] Guard browser APIs with `if (browser)`
- [ ] CSS imported in root layout
- [ ] No hydration mismatch warnings
- [ ] Test with JavaScript disabled
- [ ] Server and client HTML match
- [ ] Streaming used for slow data

**Next steps:**
- Learn data loading patterns in `data-loading.md`
- Understand runes constraints in `svelte5-runes.md`
- Optimize performance in `performance-optimization.md`
- Deploy with SSR in `deployment-guide.md`
