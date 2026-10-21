---
title: "Data Loading Patterns with SvelteKit and Svelte 5 Runes"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit repository (data loading documentation)"
last_reviewed: 2025-10-28
summary: "Master SvelteKit load functions with server vs client execution, passing data to Svelte 5 runes, reactive patterns, streaming, error handling, and caching strategies."
---

# Data Loading Patterns with SvelteKit and Svelte 5 Runes

SvelteKit's load functions fetch data before pages render. Understanding how to combine server-side data loading with Svelte 5's reactive runes enables powerful patterns for real-time, interactive applications.

## Load Function Fundamentals

Load functions run before pages render, providing data as props.

**Server load function:**
```ts
// src/routes/products/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const product = await db.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    throw error(404, 'Product not found');
  }

  return {
    product,
    user: locals.user // From hooks
  };
};
```

**Accessing data in component:**
```svelte
<!-- src/routes/products/[id]/+page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>{data.product.name}</h1>
<p>${data.product.price}</p>

{#if data.user}
  <p>Hello, {data.user.name}</p>
{/if}
```

❌ **Wrong: Fetching in component**
```svelte
<script>
  let product = $state(null);

  async function loadProduct() {
    const res = await fetch(`/api/products/${id}`);
    product = await res.json();
  }

  loadProduct(); // Runs after SSR, causes FOUC
</script>
```

✅ **Right: Loading in load function**
```ts
// +page.server.ts
export async function load({ params }) {
  const product = await fetchProduct(params.id);
  return { product }; // Available immediately in SSR
}
```

**Load function parameters:**
```ts
export async function load({
  params,      // Route parameters
  url,         // URL object
  route,       // Route info
  fetch,       // SvelteKit's fetch
  setHeaders,  // Set response headers
  parent,      // Parent layout data
  depends,     // Dependency tracking
  locals       // Server-only (from hooks)
}) {
  return { /* data */ };
}
```

## Server vs Client Load Functions

Choose between server-only and universal load functions based on needs.

**Server load (`+page.server.ts`):**
- Runs only on server
- Has access to database, env vars, secrets
- Can use `locals` from hooks
- Returns data to client

```ts
// +page.server.ts
import { PRIVATE_API_KEY } from '$env/static/private';

export async function load() {
  const data = await fetch('https://api.example.com/data', {
    headers: { 'Authorization': `Bearer ${PRIVATE_API_KEY}` }
  });

  return { data: await data.json() };
}
```

**Universal load (`+page.ts`):**
- Runs on server during SSR
- Runs on client during navigation
- No access to server-only data
- Can use SvelteKit's `fetch` for both

```ts
// +page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  // Works on server AND client
  const response = await fetch(`/api/products/${params.id}`);
  return { product: await response.json() };
};
```

❌ **Wrong: Using server-only code in universal load**
```ts
// +page.ts (NOT .server.ts)
import { db } from '$lib/server/db';

export async function load() {
  return { data: await db.query() }; // ERROR: db not available on client
}
```

✅ **Right: Use API endpoint or server load**
```ts
// +page.server.ts
import { db } from '$lib/server/db';

export async function load() {
  return { data: await db.query() }; // Works - server-only
}
```

**When to use each:**

| Use Case | Function Type |
|----------|--------------|
| Database queries | `+page.server.ts` |
| Private API keys | `+page.server.ts` |
| Session/auth data | `+page.server.ts` |
| Public API calls | `+page.ts` |
| Client-side navigation | `+page.ts` |
| Shared logic | `+page.ts` |

## Passing Data to Rune State

Transform load function data into reactive Svelte 5 state.

**Basic pattern:**
```ts
// +page.server.ts
export async function load() {
  return {
    items: await db.items.findMany(),
    count: 10
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();

  // Make load data reactive
  let items = $state(data.items);
  let count = $state(data.count);

  function addItem(item) {
    items = [...items, item]; // Reactive update
  }

  function increment() {
    count++; // Reactive update
  }
</script>
```

**Deep reactivity with objects:**
```svelte
<script>
  let { data } = $props();

  let user = $state(data.user);

  function updateEmail(email) {
    user.email = email; // Deep reactivity works
  }
</script>

<input bind:value={user.email} />
```

**Derived values from load data:**
```svelte
<script>
  let { data } = $props();

  let items = $state(data.items);
  let filter = $state('all');

  let filteredItems = $derived(
    filter === 'all'
      ? items
      : items.filter(item => item.status === filter)
  );

  let total = $derived(
    filteredItems.reduce((sum, item) => sum + item.price, 0)
  );
</script>

<select bind:value={filter}>
  <option value="all">All</option>
  <option value="active">Active</option>
  <option value="completed">Completed</option>
</select>

<p>Total: ${total}</p>

{#each filteredItems as item}
  <div>{item.name} - ${item.price}</div>
{/each}
```

❌ **Wrong: Mutating data prop directly**
```svelte
<script>
  let { data } = $props();

  function addItem(item) {
    data.items.push(item); // Don't mutate props
  }
</script>
```

✅ **Right: Create local state from props**
```svelte
<script>
  let { data } = $props();
  let items = $state(data.items);

  function addItem(item) {
    items = [...items, item]; // Mutate local state
  }
</script>
```

## Reactive Data Patterns

Combine load data with runes for reactive, real-time experiences.

**Optimistic updates:**
```svelte
<script>
  import { invalidate } from '$app/navigation';

  let { data } = $props();
  let items = $state(data.items);
  let pendingItem = $state(null);

  async function addItem(text) {
    // Show immediately
    const temp = { id: 'temp', text, pending: true };
    pendingItem = temp;

    // Save to server
    const response = await fetch('/api/items', {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    const saved = await response.json();

    // Replace temp with saved
    items = [...items, saved];
    pendingItem = null;

    // Refresh server data
    await invalidate('/api/items');
  }
</script>

{#each items as item}
  <div>{item.text}</div>
{/each}

{#if pendingItem}
  <div class="opacity-50">{pendingItem.text} (saving...)</div>
{/if}
```

**Real-time synchronization:**
```svelte
<script>
  import { invalidate } from '$app/navigation';
  import { browser } from '$app/environment';

  let { data } = $props();

  $effect(() => {
    if (browser) {
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        invalidate('api:items');
      }, 5000);

      return () => clearInterval(interval);
    }
  });
</script>

<h2>Live Items ({data.items.length})</h2>
{#each data.items as item}
  <div>{item.name}</div>
{/each}
```

**Dependency tracking:**
```ts
// +page.server.ts
export async function load({ depends }) {
  depends('api:items'); // Track dependency

  return {
    items: await db.items.findMany()
  };
}
```

```svelte
<script>
  import { invalidate } from '$app/navigation';

  async function refresh() {
    // Re-runs any load function depending on 'api:items'
    await invalidate('api:items');
  }
</script>

<button onclick={refresh}>Refresh</button>
```

**Pagination with runes:**
```svelte
<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { data } = $props();

  let currentPage = $derived(
    Number($page.url.searchParams.get('page')) || 1
  );

  let totalPages = $derived(
    Math.ceil(data.totalCount / data.pageSize)
  );

  async function goToPage(page) {
    await goto(`?page=${page}`);
  }
</script>

{#each data.items as item}
  <div>{item.name}</div>
{/each}

<nav class="flex gap-2">
  {#each Array(totalPages) as _, i}
    <button
      onclick={() => goToPage(i + 1)}
      class:bg-blue-500={currentPage === i + 1}
      class="rounded px-3 py-1"
    >
      {i + 1}
    </button>
  {/each}
</nav>
```

## Streaming Data

Load slow data without blocking page render.

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

<!-- Renders immediately -->
<header>
  <h1>Welcome, {data.user.name}</h1>
</header>

<!-- Renders when promise resolves -->
{#await data.analytics}
  <div class="animate-pulse">Loading analytics...</div>
{:then analytics}
  <Analytics {analytics} />
{:catch error}
  <p class="text-red-500">Failed to load analytics</p>
{/await}
```

**Multiple streaming sources:**
```svelte
<script>
  let { data } = $props();
</script>

<div class="grid grid-cols-2 gap-4">
  <section>
    {#await data.userStats}
      <Skeleton />
    {:then stats}
      <UserStats {stats} />
    {/await}
  </section>

  <section>
    {#await data.activityFeed}
      <Skeleton />
    {:then feed}
      <ActivityFeed {feed} />
    {/await}
  </section>
</div>
```

**Combining blocking and streaming:**
```ts
export async function load() {
  // Critical data - blocks render
  const user = await db.user.findFirst();

  // Non-critical - streams
  const stats = db.stats.findMany();
  const feed = db.feed.findMany({ take: 10 });

  return {
    user,
    stats,
    feed
  };
}
```

## Error Handling

Handle errors in load functions gracefully.

**Throwing errors:**
```ts
// +page.server.ts
import { error } from '@sveltejs/kit';

export async function load({ params }) {
  const product = await db.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    throw error(404, {
      message: 'Product not found',
      details: `No product with ID ${params.id}`
    });
  }

  return { product };
}
```

**Error page:**
```svelte
<!-- +error.svelte -->
<script>
  import { page } from '$app/stores';
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold">{$page.status}</h1>
    <p class="text-xl text-gray-600">{$page.error.message}</p>

    {#if $page.error.details}
      <p class="text-sm text-gray-500">{$page.error.details}</p>
    {/if}

    <a href="/" class="mt-4 inline-block text-blue-500">
      Go home
    </a>
  </div>
</div>
```

**Handling errors in streaming:**
```svelte
<script>
  let { data } = $props();
</script>

{#await data.slowData}
  <p>Loading...</p>
{:then result}
  <DataDisplay {result} />
{:catch error}
  <div class="rounded border border-red-500 bg-red-50 p-4">
    <p class="text-red-700">Error: {error.message}</p>
    <button onclick={() => location.reload()}>
      Retry
    </button>
  </div>
{/await}
```

**Redirects:**
```ts
// +page.server.ts
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return { user: locals.user };
}
```

## TypeScript Data Types

Type load function data properly.

**Defining types:**
```ts
// +page.server.ts
import type { PageServerLoad } from './$types';

type Product = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
};

export const load: PageServerLoad = async ({ params }) => {
  const product: Product = await db.product.findUnique({
    where: { id: params.id }
  });

  return { product };
};
```

**Using types in component:**
```svelte
<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // data.product is fully typed
  let price = $state(data.product.price);
</script>
```

**Shared types:**
```ts
// src/lib/types/models.ts
export type User = {
  id: string;
  name: string;
  email: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
};
```

```ts
// +page.server.ts
import type { PageServerLoad } from './$types';
import type { User, Product } from '$lib/types/models';

export const load: PageServerLoad = async () => {
  const user: User = await fetchUser();
  const products: Product[] = await fetchProducts();

  return { user, products };
};
```

## Caching and Invalidation

Cache data and invalidate when stale.

**Cache control headers:**
```ts
// +page.server.ts
export async function load({ setHeaders }) {
  const data = await fetchData();

  setHeaders({
    'cache-control': 'public, max-age=60' // Cache for 1 minute
  });

  return { data };
}
```

**Manual invalidation:**
```svelte
<script>
  import { invalidate, invalidateAll } from '$app/navigation';

  async function refresh() {
    // Invalidate specific URL
    await invalidate('/api/products');

    // Or invalidate everything
    await invalidateAll();
  }
</script>

<button onclick={refresh}>Refresh</button>
```

**Invalidation after mutations:**
```svelte
<script>
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';

  let { data } = $props();

  const handleSubmit = enhance(() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        // Refresh data after successful form submission
        await invalidate('api:items');
      }
    };
  });
</script>

<form method="POST" use:handleSubmit>
  <!-- Form fields -->
</form>
```

**Conditional revalidation:**
```ts
// +page.server.ts
export async function load({ depends, url }) {
  depends('api:products');

  const fresh = url.searchParams.get('fresh') === 'true';

  if (fresh) {
    // Bypass cache
    return { products: await fetchProducts() };
  }

  // Use cached data
  return { products: getCachedProducts() };
}
```

## Common Data Loading Mistakes

**Mistake 1: Fetching in component instead of load**

❌ **Wrong:**
```svelte
<script>
  let items = $state([]);

  async function loadItems() {
    const res = await fetch('/api/items');
    items = await res.json();
  }

  loadItems(); // Runs after SSR
</script>
```

✅ **Right:**
```ts
// +page.server.ts
export async function load() {
  return { items: await fetchItems() };
}
```

**Mistake 2: Not using SvelteKit's fetch**

❌ **Wrong:**
```ts
// +page.ts
export async function load() {
  const res = await fetch('/api/data'); // Wrong fetch
  return { data: await res.json() };
}
```

✅ **Right:**
```ts
// +page.ts
export async function load({ fetch }) {
  const res = await fetch('/api/data'); // SvelteKit's fetch
  return { data: await res.json() };
}
```

**Mistake 3: Waterfalls**

❌ **Wrong:**
```ts
export async function load() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id); // Waits for user
  return { user, posts };
}
```

✅ **Right:**
```ts
export async function load({ params }) {
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts(params.userId) // Parallel
  ]);
  return { user, posts };
}
```

**Checklist:**
- [ ] Use load functions for data fetching
- [ ] Choose server vs universal load appropriately
- [ ] Create local state from load data
- [ ] Use streaming for slow data
- [ ] Handle errors with error pages
- [ ] Type data with TypeScript
- [ ] Set cache headers appropriately
- [ ] Invalidate after mutations
- [ ] Avoid waterfalls with Promise.all

**Next steps:**
- Learn runes in `svelte5-runes.md`
- Handle forms in `forms-and-actions.md`
- Optimize caching in `performance-optimization.md`
- Deploy with data loading in `deployment-guide.md`
