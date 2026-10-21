---
title: "Svelte 5 API Reference"
version_anchors: ["Svelte@5.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/svelte#1b2f7b0 (Svelte 5 runes and template syntax documentation)"
last_reviewed: 2025-10-28
summary: "Complete API reference for Svelte 5 including runes ($state, $derived, $effect, $props), template syntax, component lifecycle, and reactivity patterns"
---

# Svelte 5 API Reference

Complete API reference for Svelte 5, covering the new runes-based reactivity system, template syntax, and component patterns.

## Core Runes

Runes are Svelte 5's new reactive primitives, prefixed with `$`.

### $state

Creates reactive state that triggers UI updates when changed.

**Basic usage:**
```svelte
<script>
	let count = $state(0);
</script>

<button onclick={() => count++}>
	clicks: {count}
</button>
```

**Deep reactivity:**
```js
let user = $state({
	name: 'Alice',
	settings: {
		theme: 'dark'
	}
});

// Mutations trigger updates
user.settings.theme = 'light';
user.name = 'Bob';
```

**Arrays:**
```js
let todos = $state([
	{ done: false, text: 'learn Svelte 5' }
]);

// Array methods work reactively
todos.push({ done: false, text: 'build an app' });
todos[0].done = true;
```

**Class fields:**
```js
class Counter {
	count = $state(0);
	doubled = $derived(this.count * 2);

	increment = () => {
		this.count++;
	}
}
```

**Important:** Destructuring breaks reactivity:
```js
let user = $state({ name: 'Alice' });
let { name } = user;  // ❌ Not reactive!

// Use object access instead
user.name;  // ✅ Reactive
```

### $state.raw

For non-reactive objects. Can only be reassigned, not mutated.

```js
let person = $state.raw({
	name: 'Heraclitus',
	age: 49
});

// ❌ Has no effect
person.age += 1;

// ✅ Works - full reassignment
person = {
	name: 'Heraclitus',
	age: 50
};
```

**When to use:**
- Large arrays/objects that won't be mutated
- Performance optimization (avoids proxy overhead)
- Objects from external libraries

### $state.snapshot

Takes a static snapshot of reactive state.

```js
let counter = $state({ count: 0 });

function save() {
	// Logs plain object, not Proxy
	console.log($state.snapshot(counter));

	// Useful for structuredClone
	const copy = structuredClone($state.snapshot(counter));
}
```

### $state.eager

Updates UI immediately, even during async operations.

```svelte
<script>
	let pathname = $state('/');
</script>

<nav>
	<!-- Updates immediately on click, before navigation completes -->
	<a href="/" aria-current={$state.eager(pathname) === '/' ? 'page' : null}>
		home
	</a>
</nav>
```

**Use sparingly** - only for user feedback during async operations.

### $derived

Computes reactive values from other reactive sources.

**Basic usage:**
```js
let count = $state(0);
let doubled = $derived(count * 2);
```

**Important rules:**
- No side effects allowed in $derived
- Cannot use $state mutations
- Automatically updates when dependencies change

**Complex derivations with $derived.by:**
```js
let numbers = $state([1, 2, 3]);

let total = $derived.by(() => {
	let sum = 0;
	for (const n of numbers) {
		sum += n;
	}
	return sum;
});
```

**Dependency tracking:**
```js
let count = $state(0);
let large = $derived(count > 10);

// Only updates when `large` value changes (not on every count change)
```

**Overriding derived values (optimistic UI):**
```js
let { post, like } = $props();
let likes = $derived(post.likes);

async function onclick() {
	// Temporarily override
	likes += 1;

	try {
		await like();
	} catch {
		// Roll back on error
		likes -= 1;
	}
}
```

**With objects and arrays:**
```js
let items = $state([/* ... */]);
let index = $state(0);

// Mutations to `selected` affect `items`
let selected = $derived(items[index]);
```

**Destructuring:**
```js
function stuff() { return { a: 1, b: 2, c: 3 } }

// All variables become reactive
let { a, b, c } = $derived(stuff());
```

### $effect

Runs side effects when reactive dependencies change. Runs only in the browser.

**Basic usage:**
```svelte
<script>
	let size = $state(50);
	let color = $state('#ff3e00');
	let canvas;

	$effect(() => {
		const context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Re-runs when color or size change
		context.fillStyle = color;
		context.fillRect(0, 0, size, size);
	});
</script>

<canvas bind:this={canvas} width="100" height="100"></canvas>
```

**Lifecycle:**
- Runs after component mounts (after DOM is ready)
- Runs in microtask after state changes
- Batched (multiple changes = one effect run)

**Cleanup with teardown functions:**
```js
let count = $state(0);
let milliseconds = $state(1000);

$effect(() => {
	const interval = setInterval(() => {
		count += 1;
	}, milliseconds);

	// Cleanup runs:
	// - Before effect re-runs
	// - When component is destroyed
	return () => {
		clearInterval(interval);
	};
});
```

**Dependency tracking:**
```js
let color = $state('#ff3e00');
let size = $state(50);

$effect(() => {
	// Depends on `color` only
	context.fillStyle = color;

	// ❌ Not tracked - inside setTimeout
	setTimeout(() => {
		context.fillRect(0, 0, size, size);
	}, 0);
});
```

**Object vs property dependencies:**
```js
let state = $state({ value: 0 });

// ❌ Runs once only (state object never reassigned)
$effect(() => {
	state;
});

// ✅ Runs when state.value changes
$effect(() => {
	state.value;
});
```

**Conditional dependencies:**
```js
let condition = $state(true);
let color = $state('#ff3e00');

$effect(() => {
	if (condition) {
		// Only depends on `color` when condition is true
		confetti({ colors: [color] });
	} else {
		confetti();
	}
});
```

### $effect.pre

Runs before DOM updates. Rare use case.

```js
let div = $state();
let messages = $state([]);

$effect.pre(() => {
	if (!div) return;

	messages.length;  // Track array length

	// Check if should autoscroll before DOM updates
	if (div.offsetHeight + div.scrollTop > div.scrollHeight - 20) {
		tick().then(() => {
			div.scrollTo(0, div.scrollHeight);
		});
	}
});
```

### $effect.tracking

Tells you if code is running in a tracking context.

```js
console.log('in setup:', $effect.tracking());  // false

$effect(() => {
	console.log('in effect:', $effect.tracking());  // true
});
```

**Use case:** Library abstractions that behave differently during reactivity tracking.

### $effect.root

Advanced: Creates non-tracked scope with manual cleanup.

```js
const destroy = $effect.root(() => {
	$effect(() => {
		// This effect won't auto-cleanup
	});

	return () => {
		// Manual cleanup
	};
});

// Later...
destroy();
```

**When to use:**
- Creating effects outside component initialization
- Manual effect lifecycle control
- Library abstractions

### When NOT to use $effect

❌ **Don't synchronize state:**
```js
// BAD
let count = $state(0);
let doubled = $state();

$effect(() => {
	doubled = count * 2;
});
```

✅ **Use $derived instead:**
```js
// GOOD
let count = $state(0);
let doubled = $derived(count * 2);
```

❌ **Don't link two-way state:**
```js
// BAD
let spent = $state(0);
let left = $state(100);

$effect(() => {
	left = 100 - spent;
});

$effect(() => {
	spent = 100 - left;
});
```

✅ **Use callbacks or bindings:**
```js
// GOOD
let spent = $state(0);
let left = $derived(100 - spent);

function updateLeft(newLeft) {
	spent = 100 - newLeft;
}
```

## Props Rune

### $props

Receives component props.

**Basic usage:**
```svelte
<script>
	let { adjective } = $props();
</script>

<p>this component is {adjective}</p>
```

**Fallback values:**
```js
let { adjective = 'happy' } = $props();
```

**Renaming props:**
```js
let { super: trouper = 'lights' } = $props();
```

**Rest props:**
```js
let { a, b, c, ...others } = $props();
```

**Type safety (TypeScript):**
```svelte
<script lang="ts">
	interface Props {
		adjective: string;
		count?: number;
	}

	let { adjective, count = 0 }: Props = $props();
</script>
```

**Type safety (JSDoc):**
```svelte
<script>
	/** @type {{ adjective: string, count?: number }} */
	let { adjective, count = 0 } = $props();
</script>
```

**Updating props:**
- Can temporarily reassign props
- Cannot mutate props (unless `$bindable`)
- Mutations on plain objects have no effect
- Mutations on reactive proxies show warnings

```svelte
<script>
	let { count } = $props();
</script>

<!-- ✅ Temporary override works -->
<button onclick={() => count++}>
	{count}
</button>
```

### $bindable

Makes props bindable from parent.

```svelte
<!-- Child.svelte -->
<script>
	let { value = $bindable() } = $props();
</script>

<input bind:value />
```

```svelte
<!-- Parent.svelte -->
<script>
	let value = $state('');
</script>

<Child bind:value />
```

### $props.id

Generates component-unique IDs (consistent during SSR hydration).

```svelte
<script>
	const uid = $props.id();
</script>

<form>
	<label for="{uid}-firstname">First Name:</label>
	<input id="{uid}-firstname" type="text" />

	<label for="{uid}-lastname">Last Name:</label>
	<input id="{uid}-lastname" type="text" />
</form>
```

## Template Syntax

### Expressions

```svelte
<h1>{title}</h1>
<p>{user.name}</p>
<div>{1 + 1}</div>
```

### Conditionals

```svelte
{#if condition}
	<p>Truthy</p>
{:else if other}
	<p>Other</p>
{:else}
	<p>Falsy</p>
{/if}
```

### Each Loops

```svelte
{#each items as item, index}
	<div>{index}: {item.name}</div>
{/each}

{#each items as item (item.id)}
	<div>{item.name}</div>
{/each}
```

### Await Blocks

```svelte
{#await promise}
	<p>Loading...</p>
{:then value}
	<p>Value: {value}</p>
{:catch error}
	<p>Error: {error.message}</p>
{/await}
```

### Key Blocks

```svelte
{#key value}
	<!-- Recreates when value changes -->
	<Component />
{/key}
```

### Snippets (Svelte 5)

Reusable template fragments.

```svelte
{#snippet figure(image)}
	<figure>
		<img src={image.src} alt={image.caption} />
		<figcaption>{image.caption}</figcaption>
	</figure>
{/snippet}

{@render figure(image)}
```

**With parameters:**
```svelte
{#snippet row(item, index)}
	<tr>
		<td>{index + 1}</td>
		<td>{item.name}</td>
	</tr>
{/snippet}

<table>
	{#each items as item, i}
		{@render row(item, i)}
	{/each}
</table>
```

## Bindings

### Input Bindings

```svelte
<input bind:value={name} />
<input type="number" bind:value={age} />
<input type="checkbox" bind:checked={accepted} />
<input type="radio" bind:group={selected} value="a" />
<textarea bind:value={text} />
<select bind:value={selected}>
	<option value="a">A</option>
</select>
```

### Element Bindings

```svelte
<div bind:clientWidth={width} bind:clientHeight={height}>
	{width} x {height}
</div>
```

### Component Bindings

```svelte
<Component bind:value={state} />
```

### Function Bindings (Svelte 5)

```svelte
<input
	bind:value={() => value, updateValue}
/>
```

## Lifecycle

Svelte 5 uses runes instead of lifecycle functions.

### Component initialization

```js
let data = $state(loadData());
```

### After mount

```js
import { onMount } from 'svelte';

onMount(() => {
	// Runs after component is in the DOM
	return () => {
		// Cleanup
	};
});
```

**Or with $effect:**
```js
let mounted = $state(false);

$effect(() => {
	mounted = true;
});
```

### Before update / After update

Use `$effect.pre` and `$effect`:

```js
$effect.pre(() => {
	// Before DOM updates
});

$effect(() => {
	// After DOM updates
});
```

### On destroy

```js
$effect(() => {
	return () => {
		// Cleanup when component is destroyed
	};
});
```

## Context API

### setContext / getContext

```js
// Parent.svelte
import { setContext } from 'svelte';

let user = $state({ name: 'Alice' });
setContext('user', user);
```

```js
// Child.svelte
import { getContext } from 'svelte';

let user = getContext('user');
```

### Reactive context

```js
// Parent
let count = $state(0);
setContext('count', () => count);

// Child
let getCount = getContext('count');
let count = $derived(getCount());
```

## Stores (Legacy Compatibility)

Svelte 5 runes replace stores, but stores still work.

```js
import { writable, derived, readable } from 'svelte/store';

const count = writable(0);
const doubled = derived(count, $count => $count * 2);
```

**Auto-subscription in components:**
```svelte
<script>
	import { count } from './stores.js';
</script>

<p>{$count}</p>
```

## Component Communication Patterns

### Parent → Child (Props)

```svelte
<!-- Parent -->
<Child message="Hello" count={5} />
```

### Child → Parent (Callbacks)

```svelte
<!-- Parent -->
<script>
	let value = $state('');

	function handleChange(newValue) {
		value = newValue;
	}
</script>

<Child onchange={handleChange} />
```

```svelte
<!-- Child -->
<script>
	let { onchange } = $props();
</script>

<input oninput={(e) => onchange(e.target.value)} />
```

### Two-way Binding

```svelte
<!-- Parent -->
<script>
	let value = $state('');
</script>

<Child bind:value />
```

```svelte
<!-- Child -->
<script>
	let { value = $bindable() } = $props();
</script>

<input bind:value />
```

## Special Elements

### <svelte:self>

Recursive component rendering.

```svelte
<script>
	let { tree } = $props();
</script>

<div>
	{tree.name}
	{#if tree.children}
		{#each tree.children as child}
			<svelte:self tree={child} />
		{/each}
	{/if}
</div>
```

### <svelte:component>

Dynamic component rendering.

```svelte
<svelte:component this={Component} prop={value} />
```

### <svelte:element>

Dynamic element rendering.

```svelte
<svelte:element this={tag} class="dynamic">
	Content
</svelte:element>
```

### <svelte:window>

Window event listeners.

```svelte
<svelte:window
	on:keydown={handleKeydown}
	bind:innerWidth={width}
/>
```

### <svelte:document>

Document event listeners.

```svelte
<svelte:document on:click={handleClick} />
```

### <svelte:body>

Body event listeners.

```svelte
<svelte:body on:mouseenter={handleMouseenter} />
```

### <svelte:head>

Add elements to document head.

```svelte
<svelte:head>
	<title>My App</title>
	<meta name="description" content="..." />
</svelte:head>
```

### <svelte:options>

Component compiler options.

```svelte
<svelte:options immutable={true} />
<svelte:options accessors={true} />
```

## TypeScript Support

### Component types

```svelte
<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import MyComponent from './MyComponent.svelte';

	type Props = ComponentProps<typeof MyComponent>;
</script>
```

### Generic components

```svelte
<script lang="ts" generics="T">
	let { items }: { items: T[] } = $props();
</script>

{#each items as item}
	<div>{item}</div>
{/each}
```
