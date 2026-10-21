---
title: "Routing Patterns with SvelteKit 2 and Svelte 5"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit repository (routing documentation)"
last_reviewed: 2025-10-28
summary: "File-based routing, layout composition with Svelte 5 snippets, dynamic routes, loading states with runes, error handling, and nested layouts in SvelteKit."
---

# Routing Patterns with SvelteKit 2 and Svelte 5

SvelteKit's file-based routing combined with Svelte 5's new snippet system provides powerful patterns for building complex layouts. This guide covers routing fundamentals through advanced composition patterns.

## File-Based Routing Basics

SvelteKit uses filesystem-based routing where files create routes automatically.

**Basic route structure:**
```
src/routes/
├── +page.svelte          → /
├── about/
│   └── +page.svelte      → /about
├── blog/
│   ├── +page.svelte      → /blog
│   └── [slug]/
│       └── +page.svelte  → /blog/my-post
└── api/
    └── users/
        └── +server.ts    → /api/users
```

**Route files:**
- `+page.svelte` - Page component
- `+page.ts` - Universal load function
- `+page.server.ts` - Server-only load function
- `+layout.svelte` - Shared layout
- `+error.svelte` - Error page
- `+server.ts` - API endpoint

❌ **Wrong: React-style routing**
```svelte
<!-- ❌ No route configuration files -->
<Router>
  <Route path="/" component={Home} />
</Router>
```

✅ **Right: File-based routing**
```
src/routes/+page.svelte → Creates / route automatically
```

**Example page:**
```svelte
<!-- src/routes/products/+page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>Products</h1>
<ul>
  {#each data.products as product}
    <li>
      <a href="/products/{product.id}">{product.name}</a>
    </li>
  {/each}
</ul>
```

```ts
// src/routes/products/+page.server.ts
export async function load() {
  const products = await db.product.findMany();
  return { products };
}
```

## Layout Composition with Snippets

Use Svelte 5 snippets for flexible layout composition.

**Basic layout:**
```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '../app.css';

  let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow">
    <div class="mx-auto max-w-7xl px-4">
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/blog">Blog</a>
    </div>
  </nav>

  <main class="mx-auto max-w-7xl px-4 py-8">
    {@render children()}
  </main>

  <footer class="bg-gray-800 py-8 text-white">
    <p class="text-center">&copy; 2024 My Site</p>
  </footer>
</div>
```

**Nested layouts:**
```
src/routes/
├── +layout.svelte          # Root layout (nav, footer)
└── (app)/
    ├── +layout.svelte      # App layout (sidebar)
    ├── dashboard/
    │   └── +page.svelte
    └── settings/
        └── +page.svelte
```

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script>
  let { children, data } = $props();
</script>

<div class="flex">
  <aside class="w-64 bg-gray-100">
    <nav class="p-4">
      <a href="/dashboard" class="block py-2">Dashboard</a>
      <a href="/settings" class="block py-2">Settings</a>
    </nav>
  </aside>

  <div class="flex-1">
    {@render children()}
  </div>
</div>
```

**Named snippets for flexible layouts:**
```svelte
<!-- +layout.svelte -->
<script>
  let { children, header, sidebar } = $props();
</script>

<div class="min-h-screen">
  {#if header}
    <header class="bg-white shadow">
      {@render header()}
    </header>
  {/if}

  <div class="flex">
    {#if sidebar}
      <aside class="w-64">
        {@render sidebar()}
      </aside>
    {/if}

    <main class="flex-1">
      {@render children()}
    </main>
  </div>
</div>
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

{#snippet header()}
  <h1>Custom Header</h1>
{/snippet}

{#snippet sidebar()}
  <nav>Sidebar content</nav>
{/snippet}

<div>Main content</div>
```

❌ **Wrong: Svelte 4 slot syntax**
```svelte
<!-- ❌ Old syntax doesn't work in Svelte 5 -->
<slot name="header" />
<slot />
```

✅ **Right: Svelte 5 snippet syntax**
```svelte
{#if header}
  {@render header()}
{/if}
{@render children()}
```

## Dynamic Routes and Parameters

Create dynamic routes with route parameters.

**Single parameter:**
```
src/routes/blog/[slug]/+page.svelte → /blog/hello-world
```

```ts
// +page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const post = await db.post.findUnique({
    where: { slug: params.slug }
  });

  return { post };
};
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<article>
  <h1>{data.post.title}</h1>
  <div>{@html data.post.content}</div>
</article>
```

**Multiple parameters:**
```
src/routes/[category]/[product]/+page.svelte
→ /electronics/laptop-15
```

```ts
export const load: PageServerLoad = async ({ params }) => {
  const { category, product } = params;

  return {
    category: await db.category.findUnique({ where: { slug: category } }),
    product: await db.product.findUnique({ where: { slug: product } })
  };
};
```

**Optional parameters:**
```
src/routes/blog/[[page]]/+page.svelte
→ /blog (page is undefined)
→ /blog/2 (page is "2")
```

```ts
export const load: PageServerLoad = async ({ params }) => {
  const page = Number(params.page) || 1;
  const posts = await db.post.findMany({
    skip: (page - 1) * 10,
    take: 10
  });

  return { posts, page };
};
```

**Rest parameters:**
```
src/routes/docs/[...path]/+page.svelte
→ /docs/guide/getting-started (path is "guide/getting-started")
→ /docs/api/reference/types (path is "api/reference/types")
```

```ts
export const load: PageServerLoad = async ({ params }) => {
  const segments = params.path.split('/');
  const doc = await findDoc(segments);

  return { doc };
};
```

## Loading States with Runes

Handle loading states reactively with Svelte 5 runes.

**Navigation loading indicator:**
```svelte
<!-- +layout.svelte -->
<script>
  import { navigating } from '$app/stores';
</script>

{#if $navigating}
  <div class="fixed left-0 top-0 h-1 w-full bg-blue-500">
    <div class="h-full animate-pulse bg-blue-600"></div>
  </div>
{/if}

{@render children()}
```

**Page-level loading:**
```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
  let loading = $state(false);

  async function loadMore() {
    loading = true;
    const response = await fetch('/api/posts?page=2');
    const newPosts = await response.json();
    data.posts = [...data.posts, ...newPosts];
    loading = false;
  }
</script>

{#each data.posts as post}
  <article>{post.title}</article>
{/each}

<button onclick={loadMore} disabled={loading}>
  {loading ? 'Loading...' : 'Load More'}
</button>
```

**Streaming data with loading states:**
```ts
// +page.server.ts
export async function load() {
  return {
    // Immediate data
    user: await fetchUser(),

    // Streamed data
    posts: fetchPosts(),
    comments: fetchComments()
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>Welcome, {data.user.name}</h1>

{#await data.posts}
  <div class="space-y-4">
    {#each Array(3) as _}
      <div class="h-24 animate-pulse rounded bg-gray-200"></div>
    {/each}
  </div>
{:then posts}
  {#each posts as post}
    <article class="rounded border p-4">
      <h2>{post.title}</h2>
    </article>
  {/each}
{/await}
```

**Optimistic navigation:**
```svelte
<script>
  import { goto, beforeNavigate } from '$app/navigation';

  let saving = $state(false);

  async function saveAndNavigate(url) {
    saving = true;

    try {
      await saveChanges();
      await goto(url);
    } catch (error) {
      saving = false;
      alert('Save failed');
    }
  }

  beforeNavigate((navigation) => {
    if (hasUnsavedChanges && !confirm('Discard changes?')) {
      navigation.cancel();
    }
  });
</script>

<button onclick={() => saveAndNavigate('/dashboard')}>
  {saving ? 'Saving...' : 'Save & Continue'}
</button>
```

## Error Handling in Routes

Handle errors gracefully with error pages.

**Error page:**
```svelte
<!-- src/routes/+error.svelte -->
<script>
  import { page } from '$app/stores';
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-gray-900">
      {$page.status}
    </h1>

    <p class="mt-2 text-xl text-gray-600">
      {$page.error?.message || 'Something went wrong'}
    </p>

    <a
      href="/"
      class="mt-4 inline-block rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
    >
      Go Home
    </a>
  </div>
</div>
```

**Throwing errors in load functions:**
```ts
// +page.server.ts
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const product = await db.product.findUnique({
    where: { id: params.id }
  });

  if (!product) {
    throw error(404, {
      message: 'Product not found',
      details: `No product with ID ${params.id}`
    });
  }

  if (!product.published) {
    throw error(403, 'This product is not available');
  }

  return { product };
};
```

**Nested error pages:**
```
src/routes/
├── +error.svelte           # Root error page
└── (app)/
    ├── +error.svelte       # App-specific error page
    └── dashboard/
        └── +page.svelte
```

**Error recovery:**
```svelte
<!-- +page.svelte -->
<script>
  import { invalidate } from '$app/navigation';

  let { data } = $props();
  let error = $state(null);

  async function retry() {
    error = null;
    try {
      await invalidate('/api/data');
    } catch (err) {
      error = err.message;
    }
  }
</script>

{#if error}
  <div class="rounded border border-red-500 bg-red-50 p-4">
    <p class="text-red-700">{error}</p>
    <button onclick={retry} class="mt-2 text-sm text-red-600">
      Try Again
    </button>
  </div>
{:else}
  <!-- Normal content -->
{/if}
```

## Nested Layouts Best Practices

Organize complex applications with nested layouts.

**Layout hierarchy:**
```
(marketing)/
├── +layout.svelte      # Marketing layout
├── +page.svelte        # Landing page
└── pricing/
    └── +page.svelte    # Pricing page

(app)/
├── +layout.svelte      # App layout
├── dashboard/
│   └── +page.svelte
└── settings/
    ├── +layout.svelte  # Settings sublayout
    ├── profile/
    │   └── +page.svelte
    └── billing/
        └── +page.svelte
```

**Shared data in layouts:**
```ts
// (app)/+layout.server.ts
export async function load({ locals }) {
  return {
    user: locals.user  // Available to all child routes
  };
}
```

```svelte
<!-- (app)/dashboard/+page.svelte -->
<script>
  let { data } = $props();
</script>

<h1>Welcome, {data.user.name}</h1>
```

**Layout groups (don't affect URL):**
```
(marketing)/about/+page.svelte → /about
(app)/dashboard/+page.svelte   → /dashboard
```

**Breaking out of layouts:**
```ts
// +page.ts
export const layout = false;  // Don't use parent layout
```

## Route Organization Strategies

Structure large applications maintainably.

**Feature-based organization:**
```
src/routes/
├── (marketing)/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── features/
│   └── pricing/
├── (app)/
│   ├── +layout.svelte
│   ├── dashboard/
│   ├── projects/
│   └── settings/
└── (auth)/
    ├── +layout.svelte
    ├── login/
    └── signup/
```

**API organization:**
```
src/routes/api/
├── users/
│   ├── +server.ts          # GET/POST /api/users
│   └── [id]/
│       └── +server.ts      # GET/PUT/DELETE /api/users/:id
├── posts/
│   └── +server.ts
└── auth/
    ├── login/
    │   └── +server.ts
    └── logout/
        └── +server.ts
```

**Shared components:**
```
src/lib/
├── components/
│   ├── marketing/
│   │   ├── Hero.svelte
│   │   └── Testimonials.svelte
│   ├── app/
│   │   ├── Sidebar.svelte
│   │   └── Dashboard.svelte
│   └── shared/
│       ├── Button.svelte
│       └── Modal.svelte
```

**Route guards:**
```ts
// (app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return { user: locals.user };
}
```

**Checklist for routing:**
- [ ] Use file-based routing
- [ ] Layouts for shared UI
- [ ] Dynamic routes for parameters
- [ ] Error pages for failures
- [ ] Loading states for async data
- [ ] Route guards for auth
- [ ] Snippets instead of slots
- [ ] Organize by feature

**Next steps:**
- Load data in `data-loading.md`
- Handle forms in `forms-and-actions.md`
- Style routes in `styling-with-tailwind.md`
