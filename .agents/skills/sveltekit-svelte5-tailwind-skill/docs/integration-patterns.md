---
title: "SvelteKit + Svelte 5 + Tailwind CSS Integration Patterns"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit#4991df5 (SvelteKit documentation)"
  - "sveltejs/svelte#1b2f7b0 (Svelte 5 documentation)"
  - "tailwindlabs/tailwindcss#91694fb (Tailwind CSS v4 documentation)"
last_reviewed: 2025-10-28
summary: "Complete integration guide combining SvelteKit 2.x, Svelte 5 runes, and Tailwind CSS v4 including configuration strategies, component patterns, styling approaches, build optimization, and deployment"
---

# SvelteKit + Svelte 5 + Tailwind CSS Integration Patterns

Complete guide to integrating SvelteKit 2.x, Svelte 5, and Tailwind CSS v4 in production applications.

## Complete Setup

### Project Initialization

```bash
# Create SvelteKit project
npx sv create my-app
cd my-app

# Install Tailwind CSS v4
npm install tailwindcss@next @tailwindcss/vite@next
```

### Configuration Files

**vite.config.js:**
```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss()
	]
});
```

**svelte.config.js:**
```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};
```

**src/app.css:**
```css
@import "tailwindcss";

@theme {
	--color-primary: #0ea5e9;
	--color-secondary: #8b5cf6;
	--font-sans: Inter, system-ui, sans-serif;
}
```

**src/routes/+layout.svelte:**
```svelte
<script>
	import '../app.css';
</script>

<slot />
```

## Component Patterns

### Reactive Styling with $state

```svelte
<script>
	let isOpen = $state(false);
	let variant = $state('primary');

	let buttonClasses = $derived(
		variant === 'primary' ? 'bg-blue-500 hover:bg-blue-600' :
		variant === 'secondary' ? 'bg-gray-500 hover:bg-gray-600' :
		'bg-red-500 hover:bg-red-600'
	);
</script>

<button
	class="px-4 py-2 rounded text-white {buttonClasses}"
	onclick={() => isOpen = !isOpen}
>
	Toggle
</button>

{#if isOpen}
	<div class="mt-4 p-4 border rounded">
		Content
	</div>
{/if}
```

### Dynamic Classes with $derived

```svelte
<script>
	let count = $state(0);

	let statusClasses = $derived(
		count > 10 ? 'text-green-600 font-bold' :
		count > 5 ? 'text-yellow-600' :
		'text-gray-600'
	);
</script>

<div class="p-4">
	<p class={statusClasses}>Count: {count}</p>
	<button
		class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
		onclick={() => count++}
	>
		Increment
	</button>
</div>
```

### Reusable Component with Props

```svelte
<!-- lib/components/Button.svelte -->
<script>
	let {
		variant = 'primary',
		size = 'md',
		onclick,
		children
	} = $props();

	let baseClasses = 'inline-flex items-center justify-center rounded font-medium transition';

	let variantClasses = $derived(
		variant === 'primary' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
		variant === 'secondary' ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' :
		variant === 'danger' ? 'bg-red-500 hover:bg-red-600 text-white' :
		''
	);

	let sizeClasses = $derived(
		size === 'sm' ? 'px-3 py-1.5 text-sm' :
		size === 'md' ? 'px-4 py-2' :
		size === 'lg' ? 'px-6 py-3 text-lg' :
		''
	);

	let classes = $derived(`${baseClasses} ${variantClasses} ${sizeClasses}`);
</script>

<button class={classes} {onclick}>
	{@render children()}
</button>
```

**Usage:**
```svelte
<script>
	import Button from '$lib/components/Button.svelte';

	let count = $state(0);
</script>

<Button variant="primary" onclick={() => count++}>
	Count: {count}
</Button>

<Button variant="danger" size="lg" onclick={() => count = 0}>
	Reset
</Button>
```

### Form Components with Bindings

```svelte
<!-- lib/components/Input.svelte -->
<script>
	let {
		label,
		value = $bindable(),
		error,
		type = 'text',
		...rest
	} = $props();

	let inputId = $props.id();
</script>

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-gray-700">
			{label}
		</label>
	{/if}

	<input
		id={inputId}
		{type}
		bind:value
		class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500
			{error ? 'border-red-500' : 'border-gray-300'}"
		{...rest}
	/>

	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>
```

**Usage:**
```svelte
<script>
	import Input from '$lib/components/Input.svelte';

	let email = $state('');
	let password = $state('');
	let errors = $state({});

	async function handleSubmit() {
		// Validation
		errors = {};
		if (!email) errors.email = 'Email is required';
		if (!password) errors.password = 'Password is required';

		if (Object.keys(errors).length === 0) {
			// Submit
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<Input
		label="Email"
		type="email"
		bind:value={email}
		error={errors.email}
		placeholder="you@example.com"
	/>

	<Input
		label="Password"
		type="password"
		bind:value={password}
		error={errors.password}
	/>

	<button
		type="submit"
		class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
	>
		Sign In
	</button>
</form>
```

## Layout Patterns

### Responsive Grid Layout

```svelte
<!-- routes/+layout.svelte -->
<script>
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<a href="/" class="text-xl font-bold text-blue-600">
						My App
					</a>
				</div>

				<!-- Desktop Nav -->
				<div class="hidden md:flex items-center space-x-4">
					<a
						href="/about"
						class="px-3 py-2 rounded-md text-sm font-medium
							{page.url.pathname === '/about' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					>
						About
					</a>
					<a
						href="/contact"
						class="px-3 py-2 rounded-md text-sm font-medium
							{page.url.pathname === '/contact' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					>
						Contact
					</a>
				</div>

				<!-- Mobile Menu Button -->
				<button
					class="md:hidden p-2"
					onclick={() => mobileMenuOpen = !mobileMenuOpen}
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>

			<!-- Mobile Nav -->
			{#if mobileMenuOpen}
				<div class="md:hidden py-2 space-y-1">
					<a
						href="/about"
						class="block px-3 py-2 rounded-md text-base font-medium
							{page.url.pathname === '/about' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					>
						About
					</a>
					<a
						href="/contact"
						class="block px-3 py-2 rounded-md text-base font-medium
							{page.url.pathname === '/contact' ? 'bg-gray-100' : 'hover:bg-gray-50'}"
					>
						Contact
					</a>
				</div>
			{/if}
		</nav>
	</header>

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="bg-white border-t mt-auto">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<p class="text-center text-sm text-gray-600">
				© 2025 My App. All rights reserved.
			</p>
		</div>
	</footer>
</div>
```

### Dashboard Layout with Sidebar

```svelte
<!-- routes/dashboard/+layout.svelte -->
<script>
	import { page } from '$app/state';

	let { children } = $props();
	let sidebarOpen = $state(true);

	const navItems = [
		{ href: '/dashboard', label: 'Overview', icon: '📊' },
		{ href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
		{ href: '/dashboard/settings', label: 'Settings', icon: '⚙️' }
	];
</script>

<div class="flex h-screen bg-gray-100">
	<!-- Sidebar -->
	<aside
		class="bg-gray-900 text-white transition-all duration-300
			{sidebarOpen ? 'w-64' : 'w-20'}"
	>
		<div class="p-4">
			<button
				onclick={() => sidebarOpen = !sidebarOpen}
				class="text-white hover:bg-gray-800 p-2 rounded"
			>
				☰
			</button>
		</div>

		<nav class="px-2 space-y-1">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center px-4 py-3 rounded hover:bg-gray-800
						{page.url.pathname === item.href ? 'bg-gray-800' : ''}"
				>
					<span class="text-xl">{item.icon}</span>
					{#if sidebarOpen}
						<span class="ml-3">{item.label}</span>
					{/if}
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 overflow-auto p-8">
		{@render children()}
	</main>
</div>
```

## Form Handling with SvelteKit Actions

```svelte
<!-- routes/contact/+page.svelte -->
<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold mb-6">Contact Us</h1>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="space-y-6"
	>
		<div>
			<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
				Name
			</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div>
			<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
				Email
			</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
			/>
			{#if form?.errors?.email}
				<p class="mt-1 text-sm text-red-600">{form.errors.email}</p>
			{/if}
		</div>

		<div>
			<label for="message" class="block text-sm font-medium text-gray-700 mb-1">
				Message
			</label>
			<textarea
				id="message"
				name="message"
				rows="4"
				required
				class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>

		{#if form?.success}
			<div class="p-4 bg-green-50 border border-green-200 rounded">
				<p class="text-green-800">Message sent successfully!</p>
			</div>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
				disabled:bg-gray-400 disabled:cursor-not-allowed"
		>
			{submitting ? 'Sending...' : 'Send Message'}
		</button>
	</form>
</div>
```

```js
// routes/contact/+page.server.js
import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const name = data.get('name');
		const message = data.get('message');

		// Validation
		if (!email || !email.includes('@')) {
			return fail(400, {
				errors: { email: 'Valid email required' }
			});
		}

		// Send email (implementation depends on your email service)
		try {
			await sendEmail({ email, name, message });
			return { success: true };
		} catch (error) {
			return fail(500, {
				errors: { general: 'Failed to send message' }
			});
		}
	}
};
```

## Data Loading Patterns

### Loading with Skeleton UI

```svelte
<!-- routes/blog/[slug]/+page.svelte -->
<script>
	let { data } = $props();
</script>

<article class="max-w-4xl mx-auto prose lg:prose-xl">
	<!-- Post (loaded immediately) -->
	<h1>{data.post.title}</h1>
	<div>{@html data.post.content}</div>

	<!-- Comments (streamed) -->
	<h2>Comments</h2>
	{#await data.comments}
		<!-- Skeleton -->
		<div class="space-y-4">
			{#each Array(3) as _}
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
					<div class="h-3 bg-gray-200 rounded w-3/4"></div>
				</div>
			{/each}
		</div>
	{:then comments}
		<div class="space-y-4">
			{#each comments as comment}
				<div class="p-4 bg-gray-50 rounded">
					<p class="font-medium">{comment.author}</p>
					<p class="text-gray-700">{comment.text}</p>
				</div>
			{/each}
		</div>
	{:catch error}
		<p class="text-red-600">Failed to load comments</p>
	{/await}
</article>
```

```js
// routes/blog/[slug]/+page.server.js
export async function load({ params }) {
	return {
		post: await db.getPost(params.slug),     // Awaited
		comments: db.getComments(params.slug)     // Streamed
	};
}
```

### Infinite Scroll

```svelte
<!-- routes/posts/+page.svelte -->
<script>
	import { invalidate } from '$app/navigation';

	let { data } = $props();
	let loading = $state(false);

	async function loadMore() {
		loading = true;
		const nextPage = data.page + 1;
		await fetch(`/api/posts?page=${nextPage}`);
		await invalidate('/api/posts');
		loading = false;
	}

	$effect(() => {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && !loading) {
				loadMore();
			}
		});

		const trigger = document.getElementById('load-more-trigger');
		if (trigger) observer.observe(trigger);

		return () => observer.disconnect();
	});
</script>

<div class="max-w-4xl mx-auto space-y-4">
	{#each data.posts as post}
		<article class="p-6 bg-white rounded shadow">
			<h2 class="text-2xl font-bold mb-2">{post.title}</h2>
			<p class="text-gray-700">{post.excerpt}</p>
			<a
				href="/posts/{post.slug}"
				class="text-blue-500 hover:underline"
			>
				Read more
			</a>
		</article>
	{/each}

	<div id="load-more-trigger" class="py-8 text-center">
		{#if loading}
			<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
		{:else}
			<p class="text-gray-500">Scroll for more</p>
		{/if}
	</div>
</div>
```

## Dark Mode Integration

```svelte
<!-- lib/components/ThemeToggle.svelte -->
<script>
	import { browser } from '$app/environment';

	let darkMode = $state(false);

	// Initialize from localStorage
	$effect(() => {
		if (browser) {
			const stored = localStorage.getItem('theme');
			darkMode = stored === 'dark';
			document.documentElement.classList.toggle('dark', darkMode);
		}
	});

	function toggle() {
		darkMode = !darkMode;
		if (browser) {
			localStorage.setItem('theme', darkMode ? 'dark' : 'light');
			document.documentElement.classList.toggle('dark', darkMode);
		}
	}
</script>

<button
	onclick={toggle}
	class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
	aria-label="Toggle dark mode"
>
	{#if darkMode}
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
			<path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
		</svg>
	{:else}
		<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
			<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
		</svg>
	{/if}
</button>
```

**Usage in layout:**
```svelte
<!-- routes/+layout.svelte -->
<script>
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
	<header class="border-b border-gray-200 dark:border-gray-700">
		<nav class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
			<a href="/" class="text-xl font-bold">My App</a>
			<ThemeToggle />
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>
```

## Build Optimization

### Production Configuration

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [
		sveltekit(),
		tailwindcss({
			optimize: mode === 'production'
		})
	],

	build: {
		cssCodeSplit: true,
		cssMinify: 'lightningcss',
		sourcemap: mode !== 'production'
	}
}));
```

### Code Splitting

```js
// routes/dashboard/+page.svelte
<script>
	import { onMount } from 'svelte';

	let Chart;

	onMount(async () => {
		// Lazy load heavy library
		const module = await import('$lib/Chart.svelte');
		Chart = module.default;
	});
</script>

{#if Chart}
	<Chart data={chartData} />
{:else}
	<p>Loading chart...</p>
{/if}
```

## Deployment Patterns

### Environment-Specific Styling

```js
// tailwind.config.js
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: process.env.NODE_ENV === 'production'
					? '#0ea5e9'
					: '#ef4444'  // Different color in dev
			}
		}
	}
};
```

### Static Export for CDN

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			precompress: true
		}),
		prerender: {
			entries: ['*']
		}
	}
};
```

## Complete Example: Blog Application

```
src/
├── lib/
│   ├── components/
│   │   ├── Button.svelte
│   │   ├── Input.svelte
│   │   └── Card.svelte
│   └── server/
│       └── database.js
├── routes/
│   ├── blog/
│   │   ├── [slug]/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.js
│   │   ├── +page.svelte
│   │   └── +page.server.js
│   ├── +layout.svelte
│   └── +page.svelte
├── app.css
└── app.html
```

This integration provides:
- ✅ Full SSR with SvelteKit
- ✅ Reactive components with Svelte 5 runes
- ✅ Utility-first styling with Tailwind CSS v4
- ✅ Optimized build pipeline
- ✅ Production-ready deployment
