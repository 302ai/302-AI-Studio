---
title: "Svelte 5 Runes in SvelteKit: State, Effects, and SSR Constraints"
version_anchors: ["Svelte@5.x", "SvelteKit@2.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/svelte repository (Svelte 5 runes documentation)"
last_reviewed: 2025-10-28
summary: "Master Svelte 5 runes ($state, $derived, $effect, $props) in SvelteKit with server-side rendering constraints, migration patterns, and common mistakes."
---

# Svelte 5 Runes in SvelteKit: State, Effects, and SSR Constraints

Svelte 5 introduces runes - a new reactivity system that replaces stores and reactive statements. Understanding how runes behave in SvelteKit's server-side rendering environment is critical to avoiding runtime errors.

## Runes Overview for SvelteKit

Runes provide fine-grained reactivity but have strict server-side constraints in SvelteKit.

**The five core runes:**
- `$state()` - Reactive state (client-only)
- `$derived()` - Computed values (works on server, doesn't re-run)
- `$effect()` - Side effects (client-only)
- `$props()` - Component props (works on server)
- `$bindable()` - Two-way binding (works on server)

**Critical SSR constraint:**
Most runes don't run on the server. You must separate server data loading from client reactivity.

❌ **Wrong: Using $state() in SSR context**
```svelte
<!-- +page.svelte (rendered on server) -->
<script>
  // CRASH: $state is not defined on server
  let count = $state(0);
</script>
```

✅ **Right: Load data on server, use runes on client**
```ts
// +page.server.ts
export function load() {
  return { initialCount: 0 };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();
  // Safe: hydrates on client with server data
  let count = $state(data.initialCount);
</script>
```

**Rune server compatibility table:**

| Rune | SSR | Hydration | Use Case |
|------|-----|-----------|----------|
| `$state()` | ❌ No | ✅ Yes | Client-only reactive state |
| `$derived()` | ⚠️ Partial | ✅ Yes | Computed values (doesn't re-run on server) |
| `$effect()` | ❌ No | ✅ Yes | Side effects (client-only) |
| `$props()` | ✅ Yes | ✅ Yes | Component props |
| `$bindable()` | ✅ Yes | ✅ Yes | Two-way binding props |

## State Management with $state()

Use `$state()` for reactive values that change based on user interaction.

**Basic usage (client-only components):**
```svelte
<script>
  let count = $state(0);
  let message = $state('Hello');

  function increment() {
    count++; // Reactivity just works
  }
</script>

<p>{count}</p>
<button onclick={increment}>+1</button>
```

**Object and array state:**
```svelte
<script>
  let user = $state({
    name: 'Alice',
    email: 'alice@example.com'
  });

  let todos = $state([
    { id: 1, text: 'Learn Svelte 5', done: false }
  ]);

  function addTodo(text) {
    todos.push({ id: Date.now(), text, done: false });
  }

  function updateUser(field, value) {
    user[field] = value;
  }
</script>
```

❌ **Wrong: Mutating without reactivity**
```svelte
<script>
  let items = [1, 2, 3]; // Not reactive
  items.push(4); // Won't trigger updates
</script>
```

✅ **Right: Using $state for arrays**
```svelte
<script>
  let items = $state([1, 2, 3]);
  items.push(4); // Triggers re-render
</script>
```

**SSR-safe pattern with load data:**
```ts
// +page.server.ts
export async function load() {
  const user = await db.user.findFirst();
  return { user };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();

  // Hydrate client state from server data
  let user = $state(data.user);

  function updateName(name) {
    user.name = name;
  }
</script>

<input bind:value={user.name} />
```

**Class fields with $state:**
```ts
class Counter {
  count = $state(0);

  increment() {
    this.count++;
  }

  reset() {
    this.count = 0;
  }
}

const counter = new Counter();
```

## Derived Values with $derived()

Use `$derived()` for computed values that automatically update when dependencies change.

**Basic derived values:**
```svelte
<script>
  let count = $state(0);

  // Automatically recalculates when count changes
  let doubled = $derived(count * 2);
  let isEven = $derived(count % 2 === 0);
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<p>{isEven ? 'Even' : 'Odd'}</p>
```

❌ **Wrong: Using Svelte 4 reactive statements**
```svelte
<script>
  let count = $state(0);
  $: doubled = count * 2; // Old syntax - doesn't work with runes
</script>
```

✅ **Right: Using $derived with runes**
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

**Complex derivations:**
```svelte
<script>
  let items = $state([
    { name: 'Apple', price: 1.5, quantity: 2 },
    { name: 'Banana', price: 0.5, quantity: 5 }
  ]);

  let total = $derived(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  let itemCount = $derived(
    items.reduce((sum, item) => sum + item.quantity, 0)
  );

  let average = $derived(itemCount > 0 ? total / itemCount : 0);
</script>

<p>Total: ${total.toFixed(2)}</p>
<p>Items: {itemCount}</p>
<p>Average: ${average.toFixed(2)}</p>
```

**$derived.by() for complex logic:**
```svelte
<script>
  let users = $state([/* ... */]);
  let searchTerm = $state('');

  let filtered = $derived.by(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
</script>
```

**SSR behavior - derived runs once on server:**
```svelte
<script>
  export let data;

  // Runs on server for initial HTML
  // Runs on client after hydration
  let sortedItems = $derived(
    data.items.sort((a, b) => a.name.localeCompare(b.name))
  );
</script>
```

## Side Effects with $effect()

Use `$effect()` for side effects that should run when dependencies change. Always client-only.

**Basic effects:**
```svelte
<script>
  import { browser } from '$app/environment';

  let count = $state(0);

  $effect(() => {
    // Runs on client after hydration
    console.log(`Count changed to ${count}`);
  });

  $effect(() => {
    // Save to localStorage
    if (browser) {
      localStorage.setItem('count', count.toString());
    }
  });
</script>
```

❌ **Wrong: Effect runs on server (crashes)**
```svelte
<script>
  let theme = $state('dark');

  $effect(() => {
    // ERROR: document not defined on server
    document.body.className = theme;
  });
</script>
```

✅ **Right: Guard with browser check**
```svelte
<script>
  import { browser } from '$app/environment';

  let theme = $state('dark');

  $effect(() => {
    if (browser) {
      document.body.className = theme;
    }
  });
</script>
```

**Effect cleanup:**
```svelte
<script>
  let count = $state(0);

  $effect(() => {
    const interval = setInterval(() => {
      count++;
    }, 1000);

    return () => {
      clearInterval(interval); // Cleanup on effect re-run or unmount
    };
  });
</script>
```

**$effect.pre() for pre-update effects:**
```svelte
<script>
  let items = $state([1, 2, 3]);
  let previousLength = 0;

  $effect.pre(() => {
    // Runs before DOM updates
    previousLength = items.length;
  });

  $effect(() => {
    // Runs after DOM updates
    console.log(`Items changed from ${previousLength} to ${items.length}`);
  });
</script>
```

**Effect vs onMount:**
```svelte
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let data = $state(null);

  // ✅ Use $effect when depending on reactive state
  $effect(() => {
    if (browser) {
      fetch(`/api/data?id=${userId}`)
        .then(r => r.json())
        .then(d => data = d);
    }
  });

  // ✅ Use onMount for one-time setup
  onMount(() => {
    const cleanup = setupEventListeners();
    return cleanup;
  });
</script>
```

## Props and Bindings in Routes

Use `$props()` to receive data from load functions or parent components.

**Basic props:**
```svelte
<script>
  let { data, form } = $props();
</script>

<h1>{data.title}</h1>
{#if form?.error}
  <p class="text-red-500">{form.error}</p>
{/if}
```

**Props with defaults:**
```svelte
<script>
  let {
    title = 'Default Title',
    count = 0,
    items = []
  } = $props();
</script>
```

**Destructuring with rest:**
```svelte
<script>
  let { data, ...rest } = $props();
  // rest contains all other props
</script>
```

**$bindable() for two-way binding:**
```svelte
<!-- Counter.svelte -->
<script>
  let { count = $bindable(0) } = $props();
</script>

<button onclick={() => count++}>
  Count: {count}
</button>
```

```svelte
<!-- Parent.svelte -->
<script>
  import Counter from './Counter.svelte';
  let count = $state(0);
</script>

<Counter bind:count />
<p>Parent sees: {count}</p>
```

❌ **Wrong: Mutating props directly**
```svelte
<script>
  let { data } = $props();

  function update() {
    data.count++; // Don't mutate props
  }
</script>
```

✅ **Right: Create local state from props**
```svelte
<script>
  let { data } = $props();
  let count = $state(data.count);

  function update() {
    count++; // Mutate local state
  }
</script>
```

## Server-Side Constraints (Critical!)

Understanding what runs on the server vs client prevents runtime errors.

**Server-side behavior:**
- `+page.svelte` renders on server for initial HTML
- `$state()` is NOT available on server
- `$effect()` does NOT run on server
- `$derived()` runs ONCE on server (doesn't re-run)
- `$props()` works on server

**Client-side hydration:**
1. Server generates HTML without rune reactivity
2. Client receives HTML and JavaScript
3. Svelte "hydrates" - attaches event listeners and initializes runes
4. Runes become reactive on client

**Pattern: Separate server and client concerns**

❌ **Wrong: Client-only code in SSR component**
```svelte
<!-- +page.svelte -->
<script>
  let theme = $state(localStorage.getItem('theme') || 'light');
  // ERROR: localStorage not defined on server
</script>
```

✅ **Right: Guard with browser check or separate components**
```svelte
<!-- +page.svelte -->
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

**Client-only component pattern:**
```svelte
<!-- ClientCounter.svelte -->
<script>
  let { initialCount } = $props();
  let count = $state(initialCount);
</script>

<button onclick={() => count++}>{count}</button>
```

```svelte
<!-- +page.svelte -->
<script>
  export let data;
</script>

{#if browser}
  <ClientCounter initialCount={data.count} />
{:else}
  <p>Loading...</p>
{/if}
```

**Using load functions for server data:**
```ts
// +page.server.ts
export async function load() {
  const user = await db.user.findFirst();
  return { user };
}
```

```svelte
<!-- +page.svelte -->
<script>
  let { data } = $props();

  // Server provides initial data
  // Client makes it reactive
  let user = $state(data.user);
</script>
```

## Migration from Svelte 4 Patterns

Convert Svelte 4 reactive patterns to Svelte 5 runes.

**Stores to $state:**

❌ **Svelte 4: Writable stores**
```svelte
<script>
  import { writable } from 'svelte/store';
  const count = writable(0);
</script>

<button on:click={() => $count++}>
  {$count}
</button>
```

✅ **Svelte 5: $state rune**
```svelte
<script>
  let count = $state(0);
</script>

<button onclick={() => count++}>
  {count}
</button>
```

**Reactive statements to $derived:**

❌ **Svelte 4: Reactive statements**
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;
  $: isEven = count % 2 === 0;
</script>
```

✅ **Svelte 5: $derived rune**
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  let isEven = $derived(count % 2 === 0);
</script>
```

**Lifecycle hooks to $effect:**

❌ **Svelte 4: onMount and afterUpdate**
```svelte
<script>
  import { onMount, afterUpdate } from 'svelte';

  onMount(() => {
    console.log('Mounted');
    return () => console.log('Destroyed');
  });

  afterUpdate(() => {
    console.log('Updated');
  });
</script>
```

✅ **Svelte 5: $effect rune**
```svelte
<script>
  $effect(() => {
    console.log('Mounted or updated');
    return () => console.log('Cleanup');
  });
</script>
```

**Event forwarding to callback props:**

❌ **Svelte 4: Event forwarding**
```svelte
<!-- Button.svelte -->
<button on:click>
  <slot />
</button>
```

✅ **Svelte 5: Callback props**
```svelte
<!-- Button.svelte -->
<script>
  let { onclick, children } = $props();
</script>

<button {onclick}>
  {@render children()}
</button>
```

## Common Runes Mistakes

Avoid these frequent errors when using runes in SvelteKit.

**Mistake 1: Using $state in load functions**

❌ **Wrong:**
```ts
// +page.server.ts
export function load() {
  let count = $state(0); // ERROR: Runes not available in .ts files
  return { count };
}
```

✅ **Right:**
```ts
// +page.server.ts
export function load() {
  return { count: 0 }; // Return plain data
}
```

**Mistake 2: Forgetting browser guards**

❌ **Wrong:**
```svelte
<script>
  let theme = $state(localStorage.getItem('theme'));
  // Crashes on server
</script>
```

✅ **Right:**
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

**Mistake 3: Mutating props**

❌ **Wrong:**
```svelte
<script>
  let { user } = $props();
  user.name = 'Changed'; // Don't mutate props
</script>
```

✅ **Right:**
```svelte
<script>
  let { user } = $props();
  let localUser = $state({ ...user });
  localUser.name = 'Changed'; // Mutate local copy
</script>
```

**Mistake 4: Overusing $derived**

❌ **Wrong: Derived for simple expressions**
```svelte
<script>
  let firstName = $state('John');
  let lastName = $state('Doe');
  let fullName = $derived(`${firstName} ${lastName}`);
</script>

<p>{fullName}</p>
```

✅ **Right: Use template expressions**
```svelte
<script>
  let firstName = $state('John');
  let lastName = $state('Doe');
</script>

<p>{firstName} {lastName}</p>
```

**Mistake 5: Effect dependencies**

❌ **Wrong: Manual dependency tracking**
```svelte
<script>
  let count = $state(0);

  $effect(() => {
    console.log(count); // Automatically tracks count
  }, [count]); // No dependency array in Svelte 5!
</script>
```

✅ **Right: Automatic dependency tracking**
```svelte
<script>
  let count = $state(0);

  $effect(() => {
    console.log(count); // Automatically tracks
  });
</script>
```

**Debugging runes:**
```svelte
<script>
  import { $inspect } from 'svelte';

  let count = $state(0);
  let doubled = $derived(count * 2);

  // Logs to console when values change
  $inspect(count, doubled);
</script>
```

**Checklist for runes in SvelteKit:**
- [ ] Never use `$state()` in `.server.ts` files
- [ ] Guard browser APIs with `if (browser)` check
- [ ] Load data from server, make reactive on client
- [ ] Use `$props()` to receive data from load functions
- [ ] Create local state from props if mutation needed
- [ ] Use `$effect()` only for side effects, not derived values
- [ ] Test SSR explicitly (disable JS in browser)
- [ ] Check console for hydration mismatch warnings

**Next steps:**
- Learn form handling in `forms-and-actions.md`
- Understand data loading in `data-loading.md`
- Configure SSR in `server-rendering.md`
- Migrate from Svelte 4 in `migration-svelte4-to-5.md`
