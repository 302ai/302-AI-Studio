---
title: "Advanced Server-Side Rendering in SvelteKit"
version_anchors: ["SvelteKit@2.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit#4991df5 (SvelteKit SSR, hooks, and load function documentation)"
last_reviewed: 2025-10-28
summary: "Complete guide to advanced SSR in SvelteKit including streaming, server vs universal load, hooks (handle, handleFetch, handleError), and load function patterns"
---

# Advanced Server-Side Rendering in SvelteKit

Complete guide to advanced server-side rendering patterns in SvelteKit 2.x, covering load functions, hooks, streaming, and server-side data handling.

## Load Functions

### Universal vs Server Load

#### Universal Load (`+page.js`, `+layout.js`)

Runs on both server and client.

```js
// src/routes/blog/[slug]/+page.js
export async function load({ params, fetch }) {
	const response = await fetch(`/api/posts/${params.slug}`);
	const post = await response.json();

	return { post };
}
```

**When universal load runs:**
- Server-side during SSR
- Client-side during hydration (reusing SSR data)
- Client-side on navigation

**Use cases:**
- Fetching from external APIs
- No private credentials needed
- Need to return non-serializable data (classes, functions)

#### Server Load (`+page.server.js`, `+layout.server.js`)

Runs only on server.

```js
// src/routes/blog/[slug]/+page.server.js
import * as db from '$lib/server/database';

export async function load({ params }) {
	const post = await db.getPost(params.slug);

	return { post };
}
```

**Use cases:**
- Direct database access
- Using private environment variables
- Server-only operations

**Advantages:**
- Can use any Node.js libraries
- Access to server-side context (cookies, locals)
- Doesn't expose sensitive code to client

### Load Function Execution

```js
// src/routes/blog/[slug]/+page.server.js
import * as db from '$lib/server/database';

export async function load({ params, url, request, locals, platform }) {
	// Available in server load only:
	const user = locals.user;
	const ip = request.headers.get('x-forwarded-for');

	// Common to both:
	const slug = params.slug;
	const query = url.searchParams.get('q');

	return {
		post: await db.getPost(slug),
		user
	};
}
```

### Available Load Parameters

#### Universal Load Event

```typescript
{
	params: Record<string, string>;
	route: { id: string };
	url: URL;
	data?: any;  // From server load
	fetch: typeof fetch;
	setHeaders: (headers: Record<string, string>) => void;
	parent: () => Promise<Record<string, any>>;
	depends: (...deps: string[]) => void;
	untrack: <T>(fn: () => T) => T;
}
```

#### Server Load Event

Extends universal load event with:

```typescript
{
	cookies: Cookies;
	locals: App.Locals;
	platform?: App.Platform;
	request: Request;
	clientAddress: string;
	isDataRequest: boolean;
	isSubRequest: boolean;
}
```

### Using fetch in Load

```js
// Server load
export async function load({ fetch }) {
	// ✅ Can make same-origin requests without full URL
	const res1 = await fetch('/api/posts');

	// ✅ External API
	const res2 = await fetch('https://api.example.com/posts');

	// ✅ Inherits cookies and auth headers
	const res3 = await fetch('/api/user');

	return {
		posts: await res1.json(),
		external: await res2.json(),
		user: await res3.json()
	};
}
```

**Benefits of SvelteKit's fetch:**
- Same-origin requests avoid HTTP overhead on server
- Cookies automatically forwarded
- Responses captured and inlined in HTML
- Consistent behavior server/client

### Parent Data

Access data from parent layouts:

```js
// src/routes/+layout.js
export function load() {
	return { user: { name: 'Alice' } };
}
```

```js
// src/routes/profile/+layout.js
export async function load({ parent }) {
	const { user } = await parent();

	return {
		user,
		posts: await fetchPosts(user.id)
	};
}
```

```js
// src/routes/profile/settings/+page.js
export async function load({ parent }) {
	// Gets data from both parent layouts
	const { user, posts } = await parent();

	return { user, posts };
}
```

**Performance tip:** Call slow operations before `await parent()`:

```js
// ❌ Bad - creates waterfall
export async function load({ parent, params }) {
	const parentData = await parent();  // Wait for parent
	const data = await getData(params);  // Then fetch data
	return { ...parentData, ...data };
}

// ✅ Good - parallel execution
export async function load({ parent, params }) {
	const data = await getData(params);  // Start fetch
	const parentData = await parent();   // Then get parent
	return { ...parentData, ...data };
}
```

## Streaming

Stream promises to the browser for faster perceived performance.

### Basic Streaming

```js
// src/routes/blog/[slug]/+page.server.js
export async function load({ params }) {
	return {
		// Awaited - blocks initial render
		post: await db.getPost(params.slug),

		// Not awaited - streams to browser
		comments: db.getComments(params.slug),

		// Also streams
		relatedPosts: db.getRelatedPosts(params.slug)
	};
}
```

```svelte
<!-- src/routes/blog/[slug]/+page.svelte -->
<script>
	let { data } = $props();
</script>

<!-- Renders immediately -->
<article>
	<h1>{data.post.title}</h1>
	<div>{@html data.post.content}</div>
</article>

<!-- Shows loading state, then content -->
{#await data.comments}
	<p>Loading comments...</p>
{:then comments}
	{#each comments as comment}
		<div class="comment">{comment.text}</div>
	{/each}
{:catch error}
	<p>Failed to load comments: {error.message}</p>
{/await}

<!-- Streams in parallel -->
{#await data.relatedPosts}
	<p>Loading related posts...</p>
{:then posts}
	<ul>
		{#each posts as post}
			<li><a href="/blog/{post.slug}">{post.title}</a></li>
		{/each}
	</ul>
{/await}
```

### Streaming Considerations

**Promise rejection handling:**
```js
export function load({ fetch }) {
	// ❌ Unhandled rejection can crash server
	const dangerous = Promise.reject();

	// ✅ Mark as handled
	const safe = Promise.reject();
	safe.catch(() => {});

	// ✅ SvelteKit fetch handles automatically
	const safeFetch = fetch('/api/data');

	return { dangerous, safe, safeFetch };
}
```

**Platform limitations:**
- AWS Lambda: No streaming support (responses buffered)
- Vercel: Streaming supported
- Cloudflare: Streaming supported
- Nginx: May need `proxy_buffering off;`

**Headers and redirects:**
```js
export function load({ setHeaders }) {
	const slow = slowOperation().then(result => {
		// ❌ Too late - headers already sent
		setHeaders({ 'x-custom': 'value' });
		return result;
	});

	// ✅ Set headers before streaming
	setHeaders({ 'x-custom': 'value' });

	return { slow };
}
```

## Hooks

### Server Hooks (src/hooks.server.js)

#### handle

Intercept every request.

```js
// src/hooks.server.js
export async function handle({ event, resolve }) {
	// Before request handling
	console.log('Request:', event.url.pathname);

	// Modify event
	event.locals.startTime = Date.now();

	// Resolve request
	const response = await resolve(event);

	// After request handling
	const duration = Date.now() - event.locals.startTime;
	response.headers.set('x-response-time', `${duration}ms`);

	return response;
}
```

**Multiple handle functions:**
```js
// src/hooks.server.js
import { sequence } from '@sveltejs/kit/hooks';

async function authHandle({ event, resolve }) {
	// Auth logic
	return resolve(event);
}

async function loggingHandle({ event, resolve }) {
	// Logging logic
	return resolve(event);
}

export const handle = sequence(authHandle, loggingHandle);
```

**Custom route handling:**
```js
export async function handle({ event, resolve }) {
	if (event.url.pathname.startsWith('/custom')) {
		return new Response('Custom response');
	}

	return resolve(event);
}
```

**Transform HTML:**
```js
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			// Inject analytics
			if (done) {
				return html.replace('</body>', `
					<script>/* analytics */</script>
					</body>
				`);
			}
			return html;
		}
	});

	return response;
}
```

**Filter serialized headers:**
```js
export async function handle({ event, resolve }) {
	return resolve(event, {
		filterSerializedResponseHeaders: (name, value) => {
			// Include x- prefixed headers in serialized response
			return name.startsWith('x-');
		}
	});
}
```

**Preload control:**
```js
export async function handle({ event, resolve }) {
	return resolve(event, {
		preload: ({ type, path }) => {
			// Preload JS and CSS, but not fonts
			return type === 'js' || type === 'css';
		}
	});
}
```

#### handleFetch

Modify server-side fetch requests.

```js
// src/hooks.server.js
export async function handleFetch({ request, fetch }) {
	// Rewrite API requests to internal endpoint
	if (request.url.startsWith('https://api.example.com/')) {
		request = new Request(
			request.url.replace('https://api.example.com/', 'http://localhost:9999/'),
			request
		);
	}

	return fetch(request);
}
```

**Forward cookies to subdomain:**
```js
export async function handleFetch({ event, request, fetch }) {
	if (request.url.startsWith('https://api.mydomain.com/')) {
		// Forward parent domain cookie
		const cookie = event.request.headers.get('cookie');
		if (cookie) {
			request.headers.set('cookie', cookie);
		}
	}

	return fetch(request);
}
```

#### handleError

Handle unexpected errors.

```js
// src/hooks.server.js
export async function handleError({ error, event, status, message }) {
	// Log error
	console.error('Error:', {
		message: error.message,
		stack: error.stack,
		url: event.url.pathname,
		status
	});

	// Send to error tracking
	await errorTracker.capture(error, {
		user: event.locals.user,
		url: event.url.href
	});

	// Return safe error info
	return {
		message: 'An error occurred',
		code: generateErrorCode()
	};
}
```

**Type-safe errors:**
```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			code: string;
			timestamp: number;
		}
	}
}
```

```js
// src/hooks.server.js
export async function handleError({ error, event }) {
	return {
		message: 'Internal Error',
		code: generateErrorCode(),
		timestamp: Date.now()
	};
}
```

### Client Hooks (src/hooks.client.js)

#### handleError

```js
// src/hooks.client.js
export async function handleError({ error, event, status, message }) {
	// Log to client-side error service
	console.error('Client error:', error);

	return {
		message: 'Something went wrong',
		code: error.code || 'unknown'
	};
}
```

### Universal Hooks (src/hooks.js)

#### reroute

Translate URLs to different routes.

```js
// src/hooks.js
const translated = {
	'/en/about': '/en/about',
	'/de/ueber-uns': '/de/about',
	'/fr/a-propos': '/fr/about'
};

export function reroute({ url }) {
	if (url.pathname in translated) {
		return translated[url.pathname];
	}
}
```

**Async reroute (SvelteKit 2.18+):**
```js
export async function reroute({ url, fetch }) {
	// Fetch routing data
	const api = new URL('/api/reroute', url);
	api.searchParams.set('pathname', url.pathname);

	const result = await fetch(api).then(r => r.json());
	return result.pathname;
}
```

#### transport

Serialize custom types across server/client boundary.

```js
// src/hooks.js
import { Vector } from '$lib/math';

export const transport = {
	Vector: {
		encode: (value) => {
			if (value instanceof Vector) {
				return [value.x, value.y];
			}
		},
		decode: ([x, y]) => new Vector(x, y)
	}
};
```

```js
// src/routes/+page.server.js
import { Vector } from '$lib/math';

export function load() {
	return {
		position: new Vector(10, 20)  // Automatically serialized
	};
}
```

## Authentication Patterns

### Server-Side Session

```js
// src/hooks.server.js
import * as db from '$lib/server/database';

export async function handle({ event, resolve }) {
	const sessionId = event.cookies.get('sessionid');

	if (sessionId) {
		event.locals.user = await db.getUserFromSession(sessionId);
	}

	return resolve(event);
}
```

```js
// src/routes/profile/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}

	return { user: locals.user };
}
```

### Shared Auth Logic

```js
// src/lib/server/auth.js
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export function requireAuth() {
	const { locals, url } = getRequestEvent();

	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		redirect(307, `/login?redirect=${redirectTo}`);
	}

	return locals.user;
}
```

```js
// src/routes/protected/+page.server.js
import { requireAuth } from '$lib/server/auth';

export function load() {
	const user = requireAuth();

	return { user };
}
```

### JWT Authentication

```js
// src/hooks.server.js
import jwt from 'jsonwebtoken';

export async function handle({ event, resolve }) {
	const token = event.cookies.get('token');

	if (token) {
		try {
			event.locals.user = jwt.verify(token, process.env.JWT_SECRET);
		} catch (err) {
			// Invalid token
			event.cookies.delete('token', { path: '/' });
		}
	}

	return resolve(event);
}
```

## Caching Strategies

### Setting Cache Headers

```js
// src/routes/blog/[slug]/+page.js
export async function load({ fetch, setHeaders, params }) {
	const response = await fetch(`/api/posts/${params.slug}`);
	const post = await response.json();

	// Cache for 1 hour, stale-while-revalidate for 1 day
	setHeaders({
		'cache-control': 'max-age=3600, stale-while-revalidate=86400'
	});

	return { post };
}
```

### Conditional Caching

```js
export async function load({ fetch, setHeaders, url }) {
	const response = await fetch('/api/data');
	const data = await response.json();

	// Only cache successful responses
	if (response.ok) {
		setHeaders({
			'cache-control': 'public, max-age=600'
		});
	}

	return { data };
}
```

### ETag Support

```js
// src/routes/api/data/+server.js
import { createHash } from 'crypto';

export async function GET({ request }) {
	const data = await fetchData();
	const etag = createHash('md5')
		.update(JSON.stringify(data))
		.digest('hex');

	// Check if client has current version
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304 });
	}

	return new Response(JSON.stringify(data), {
		headers: {
			'etag': etag,
			'cache-control': 'max-age=60'
		}
	});
}
```

## Error Handling

### Expected Errors

```js
// src/routes/admin/+layout.server.js
import { error } from '@sveltejs/kit';

export function load({ locals }) {
	if (!locals.user) {
		error(401, 'Not logged in');
	}

	if (!locals.user.isAdmin) {
		error(403, 'Not authorized');
	}

	return { user: locals.user };
}
```

**Custom error data:**
```ts
// src/app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			details?: string;
		}
	}
}
```

```js
error(404, {
	message: 'Post not found',
	details: 'The blog post you requested does not exist'
});
```

### Unexpected Errors

Automatically handled by `handleError` hook.

```js
// src/routes/+page.server.js
export async function load() {
	// This will be caught by handleError
	throw new Error('Database connection failed');
}
```

## Load Invalidation

### Manual Invalidation

```svelte
<script>
	import { invalidate, invalidateAll } from '$app/navigation';

	async function refresh() {
		// Rerun all load functions that depend on this URL
		await invalidate('/api/posts');

		// Or rerun ALL load functions
		await invalidateAll();
	}
</script>

<button onclick={refresh}>Refresh</button>
```

### Dependency Tracking

```js
// src/routes/+page.js
export async function load({ fetch, depends }) {
	// Explicit dependency
	depends('app:posts');

	// Implicit dependency from fetch
	const response = await fetch('/api/posts');

	return {
		posts: await response.json()
	};
}
```

```svelte
<script>
	import { invalidate } from '$app/navigation';

	function refresh() {
		// Rerun load because of explicit dependency
		invalidate('app:posts');
	}
</script>
```

### Conditional Invalidation

```js
import { invalidate } from '$app/navigation';

// Invalidate based on condition
invalidate((url) => url.href.includes('/api/'));
```

## Performance Optimization

### Parallel Load Functions

```js
// ✅ Load functions run in parallel automatically
// src/routes/+layout.server.js
export async function load() {
	return { user: await fetchUser() };
}

// src/routes/blog/+page.server.js
export async function load() {
	return { posts: await fetchPosts() };
}
```

### Preloading

```svelte
<a href="/blog" data-sveltekit-preload-data>Blog</a>

<!-- Preload on hover -->
<a href="/blog" data-sveltekit-preload-data="hover">Blog</a>

<!-- Preload immediately -->
<a href="/blog" data-sveltekit-preload-data="tap">Blog</a>
```

### Avoiding Waterfalls

```js
// ❌ Bad - sequential
export async function load({ parent }) {
	const data1 = await fetchData1();
	const data2 = await fetchData2();
	const parentData = await parent();
	return { data1, data2, ...parentData };
}

// ✅ Good - parallel
export async function load({ parent }) {
	const [data1, data2, parentData] = await Promise.all([
		fetchData1(),
		fetchData2(),
		parent()
	]);
	return { data1, data2, ...parentData };
}
```

## Advanced Patterns

### Request Deduplication

SvelteKit automatically deduplicates fetch requests:

```js
// Both fetch to same URL - only one network request
export async function load({ fetch }) {
	const [posts, featured] = await Promise.all([
		fetch('/api/posts').then(r => r.json()),
		fetch('/api/posts').then(r => r.json())
	]);

	return { posts, featured };
}
```

### Conditional SSR

```js
// src/routes/dashboard/+page.js
export const ssr = false;  // Client-side only
export const prerender = false;
```

### Hybrid Rendering

```js
// src/routes/+layout.js
export const prerender = true;  // Prerender by default

// src/routes/api/+server.js
export const prerender = false;  // But not API routes
```
