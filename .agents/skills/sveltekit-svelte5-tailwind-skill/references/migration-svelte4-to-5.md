---
title: "Migrate SvelteKit Applications from Svelte 4 to Svelte 5"
version_anchors: ["SvelteKit@2.x", "Svelte@4.x→5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/svelte GitHub repository (Svelte 5 migration guide and breaking changes)"
  - "Community migration experiences from SvelteKit projects"
last_reviewed: 2025-10-28
summary: "Upgrade existing SvelteKit applications from Svelte 4 to Svelte 5 with complete migration paths for stores, reactive statements, slots, events, and lifecycle hooks with testing strategies."
---

# Migrate SvelteKit Applications from Svelte 4 to Svelte 5

Svelte 5 introduces a new reactivity system with runes, replacing stores and reactive statements. This guide walks you through migrating your SvelteKit application safely and incrementally.

## Migration Overview

Understand the scope and approach before starting:

**Major changes in Svelte 5:**
- **Runes replace stores:** `$state()`, `$derived()`, `$effect()` replace writable/derived stores
- **Props syntax changed:** `$props()` replaces `export let`
- **Slots become snippets:** `<slot>` replaced by `{@render children()}`
- **Events now callbacks:** Event forwarding replaced by explicit callback props
- **Lifecycle changes:** `onMount()` and effects work differently

**Migration philosophy:**
```
Svelte 5 supports BOTH old and new syntax during transition period.
You can migrate incrementally - not all at once.
```

**Time estimates:**
- Small app (10-20 components): 2-4 hours
- Medium app (50-100 components): 1-2 days
- Large app (200+ components): 3-5 days

**Recommended approach:**
1. Update dependencies
2. Run build to identify breaking changes
3. Fix critical errors (stores in components)
4. Migrate one feature at a time
5. Test thoroughly after each migration
6. Deploy incrementally if possible

## Breaking Changes Checklist

Review and understand all breaking changes:

**Reactivity system:**
- [x] `export let` props → `$props()`
- [x] Reactive statements `$:` → `$derived()` or `$effect()`
- [x] Stores in components → Runes (`$state()`, `$derived()`)
- [x] Component state → `$state()` instead of `let` + reassignment

**Component API:**
- [x] `<slot>` → `{@render children()}`
- [x] Named slots → Named snippet props
- [x] `$$props` → Destructured `$props()`
- [x] `$$restProps` → Rest parameters in `$props()`

**Event handling:**
- [x] Event forwarding removed
- [x] Component events → Callback props
- [x] `createEventDispatcher` → Direct function props

**Lifecycle:**
- [x] `beforeUpdate` removed
- [x] `afterUpdate` removed
- [x] Effects timing changed
- [x] `onMount` still works but `$effect()` recommended

**Bindings:**
- [x] `bind:this` syntax changed slightly
- [x] Two-way binding requires `$bindable()`
- [x] Store subscriptions auto-unsubscribe

**TypeScript:**
- [x] Component typing changed
- [x] Props interfaces defined separately
- [x] Event types now function types

## Stores to Runes Migration

Convert writable and derived stores to runes:

**Writable store migration:**
```ts
// ❌ Before (Svelte 4)
// src/lib/stores/counter.ts
import { writable } from 'svelte/store';

export const count = writable(0);

// Component usage
<script>
  import { count } from '$lib/stores/counter';

  function increment() {
    $count += 1;
  }
</script>

<p>Count: {$count}</p>
<button on:click={increment}>+1</button>

// ✅ After (Svelte 5)
// Remove store file entirely, use runes in component

<script>
  let count = $state(0);

  function increment() {
    count += 1;
  }
</script>

<p>Count: {count}</p>
<button onclick={increment}>+1</button>
```

**Derived store migration:**
```ts
// ❌ Before (Svelte 4)
// src/lib/stores/derived.ts
import { writable, derived } from 'svelte/store';

export const count = writable(0);
export const doubled = derived(count, $count => $count * 2);

// ✅ After (Svelte 5)
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

**Shared state across components (context pattern):**
```ts
// ❌ Before (Svelte 4)
// src/lib/stores/user.ts
import { writable } from 'svelte/store';

export const user = writable(null);

// ✅ After (Svelte 5)
// src/lib/contexts/user.svelte.ts
import { getContext, setContext } from 'svelte';

const USER_KEY = Symbol('user');

export class UserState {
  user = $state(null);

  setUser(newUser) {
    this.user = newUser;
  }

  clearUser() {
    this.user = null;
  }
}

export function setUserContext(initialUser = null) {
  const userState = new UserState();
  userState.user = initialUser;
  setContext(USER_KEY, userState);
  return userState;
}

export function getUserContext() {
  return getContext(USER_KEY);
}

// Usage in layout:
// +layout.svelte
<script>
  import { setUserContext } from '$lib/contexts/user.svelte';

  export let data;
  const userState = setUserContext(data.user);
</script>

// Usage in child component:
<script>
  import { getUserContext } from '$lib/contexts/user.svelte';

  const userState = getUserContext();
</script>

<p>Welcome {userState.user?.name}</p>
```

**Custom stores migration:**
```ts
// ❌ Before (Svelte 4)
// src/lib/stores/custom.ts
import { writable } from 'svelte/store';

function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();

// ✅ After (Svelte 5)
// src/lib/states/counter.svelte.ts
export class CounterState {
  value = $state(0);

  increment() {
    this.value += 1;
  }

  decrement() {
    this.value -= 1;
  }

  reset() {
    this.value = 0;
  }
}

// Usage:
<script>
  import { CounterState } from '$lib/states/counter.svelte';

  const counter = new CounterState();
</script>

<p>{counter.value}</p>
<button onclick={() => counter.increment()}>+</button>
```

## Reactive Statements to $derived

Convert `$:` reactive statements to `$derived()`:

**Simple derived values:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  let count = 0;
  $: doubled = count * 2;
  $: quadrupled = doubled * 2;
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<p>Quadrupled: {quadrupled}</p>

<!-- ✅ After (Svelte 5) -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);
  let quadrupled = $derived(doubled * 2);
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
<p>Quadrupled: {quadrupled}</p>
```

**Conditional derived values:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  let age = 0;
  $: status = age < 18 ? 'minor' : 'adult';
  $: canVote = age >= 18;
</script>

<!-- ✅ After (Svelte 5) -->
<script>
  let age = $state(0);
  let status = $derived(age < 18 ? 'minor' : 'adult');
  let canVote = $derived(age >= 18);
</script>
```

**Reactive statements with side effects:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  let searchTerm = '';
  let results = [];

  $: {
    // Side effect: fetch when searchTerm changes
    if (searchTerm) {
      fetch(`/api/search?q=${searchTerm}`)
        .then(r => r.json())
        .then(data => results = data);
    }
  }
</script>

<!-- ✅ After (Svelte 5) -->
<script>
  import { untrack } from 'svelte';

  let searchTerm = $state('');
  let results = $state([]);

  $effect(() => {
    // Effect runs when searchTerm changes
    if (searchTerm) {
      fetch(`/api/search?q=${searchTerm}`)
        .then(r => r.json())
        .then(data => results = data);
    }
  });
</script>
```

**Complex filtering/sorting:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  let items = [];
  let filter = '';
  let sortBy = 'name';

  $: filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  $: sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date') return b.date - a.date;
  });
</script>

<!-- ✅ After (Svelte 5) -->
<script>
  let items = $state([]);
  let filter = $state('');
  let sortBy = $state('name');

  let filteredItems = $derived(
    items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    )
  );

  let sortedItems = $derived(
    [...filteredItems].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'date') return b.date - a.date;
      return 0;
    })
  );
</script>
```

## Slots and Snippets Migration

Convert slot-based composition to snippets:

**Basic slot migration:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- Card.svelte -->
<div class="card">
  <slot />
</div>

<!-- Usage -->
<Card>
  <p>Card content</p>
</Card>

<!-- ✅ After (Svelte 5) -->
<!-- Card.svelte -->
<script>
  let { children } = $props();
</script>

<div class="card">
  {@render children()}
</div>

<!-- Usage (same) -->
<Card>
  <p>Card content</p>
</Card>
```

**Named slots migration:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- Modal.svelte -->
<div class="modal">
  <header>
    <slot name="header" />
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <slot name="footer" />
  </footer>
</div>

<!-- Usage -->
<Modal>
  <h2 slot="header">Title</h2>
  <p>Content</p>
  <div slot="footer">
    <button>Close</button>
  </div>
</Modal>

<!-- ✅ After (Svelte 5) -->
<!-- Modal.svelte -->
<script>
  let { header, children, footer } = $props();
</script>

<div class="modal">
  <header>
    {@render header()}
  </header>
  <main>
    {@render children()}
  </main>
  <footer>
    {@render footer()}
  </footer>
</div>

<!-- Usage -->
<Modal>
  {#snippet header()}
    <h2>Title</h2>
  {/snippet}

  <p>Content</p>

  {#snippet footer()}
    <button>Close</button>
  {/snippet}
</Modal>
```

**Slot props (pass data to slots):**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- List.svelte -->
<script>
  export let items = [];
</script>

<ul>
  {#each items as item}
    <li>
      <slot {item} />
    </li>
  {/each}
</ul>

<!-- Usage -->
<List {items} let:item>
  <span>{item.name}</span>
</List>

<!-- ✅ After (Svelte 5) -->
<!-- List.svelte -->
<script>
  let { items, children } = $props();
</script>

<ul>
  {#each items as item}
    <li>
      {@render children(item)}
    </li>
  {/each}
</ul>

<!-- Usage -->
<List {items}>
  {#snippet children(item)}
    <span>{item.name}</span>
  {/snippet}
</List>
```

**Optional slots/snippets:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<div class="card">
  {#if $$slots.header}
    <header><slot name="header" /></header>
  {/if}
  <slot />
</div>

<!-- ✅ After (Svelte 5) -->
<script>
  let { header, children } = $props();
</script>

<div class="card">
  {#if header}
    <header>{@render header()}</header>
  {/if}
  {@render children()}
</div>
```

## Event Handling Changes

Migrate from event forwarding to callback props:

**Component events:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- Button.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('click', { timestamp: Date.now() });
  }
</script>

<button on:click={handleClick}>
  <slot />
</button>

<!-- Usage -->
<Button on:click={handleCustomClick}>
  Click me
</Button>

<!-- ✅ After (Svelte 5) -->
<!-- Button.svelte -->
<script>
  let { onclick, children } = $props();

  function handleClick(event) {
    onclick?.({ timestamp: Date.now(), originalEvent: event });
  }
</script>

<button onclick={handleClick}>
  {@render children()}
</button>

<!-- Usage -->
<Button onclick={handleCustomClick}>
  Click me
</Button>
```

**Multiple event types:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- Input.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  export let value = '';
  const dispatch = createEventDispatcher();

  function handleInput(e) {
    value = e.target.value;
    dispatch('input', value);
  }

  function handleFocus() {
    dispatch('focus');
  }
</script>

<input
  {value}
  on:input={handleInput}
  on:focus={handleFocus}
/>

<!-- ✅ After (Svelte 5) -->
<!-- Input.svelte -->
<script>
  let { value = $bindable(''), oninput, onfocus } = $props();

  function handleInput(e) {
    value = e.target.value;
    oninput?.(value);
  }

  function handleFocus() {
    onfocus?.();
  }
</script>

<input
  bind:value
  oninput={handleInput}
  onfocus={handleFocus}
/>
```

**Event forwarding removed:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<!-- Button.svelte -->
<button on:click>
  <slot />
</button>

<!-- ✅ After (Svelte 5) -->
<!-- Button.svelte -->
<script>
  let { onclick, children } = $props();
</script>

<button {onclick}>
  {@render children()}
</button>
```

## Component Lifecycle Updates

Migrate lifecycle hooks to effects:

**onMount migration:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  import { onMount } from 'svelte';

  let data = null;

  onMount(async () => {
    const response = await fetch('/api/data');
    data = await response.json();
  });
</script>

<!-- ✅ After (Svelte 5) - onMount still works -->
<script>
  import { onMount } from 'svelte';

  let data = $state(null);

  onMount(async () => {
    const response = await fetch('/api/data');
    data = await response.json();
  });
</script>

<!-- ✅ Better (Svelte 5) - use $effect -->
<script>
  let data = $state(null);

  $effect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(result => data = result);
  });
</script>
```

**beforeUpdate/afterUpdate removed:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  import { beforeUpdate, afterUpdate } from 'svelte';

  let count = 0;

  beforeUpdate(() => {
    console.log('About to update:', count);
  });

  afterUpdate(() => {
    console.log('Just updated:', count);
  });
</script>

<!-- ✅ After (Svelte 5) -->
<script>
  let count = $state(0);

  // Use $effect.pre for beforeUpdate equivalent
  $effect.pre(() => {
    console.log('About to update:', count);
  });

  // Use $effect for afterUpdate equivalent
  $effect(() => {
    console.log('Just updated:', count);
  });
</script>
```

**Cleanup in effects:**
```svelte
<!-- ❌ Before (Svelte 4) -->
<script>
  import { onMount, onDestroy } from 'svelte';

  let interval;

  onMount(() => {
    interval = setInterval(() => {
      console.log('tick');
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<!-- ✅ After (Svelte 5) -->
<script>
  $effect(() => {
    const interval = setInterval(() => {
      console.log('tick');
    }, 1000);

    // Return cleanup function
    return () => {
      clearInterval(interval);
    };
  });
</script>
```

## Testing Your Migration

Verify everything works correctly:

**Component testing:**
```typescript
// ❌ Before (Svelte 4 tests)
import { render, fireEvent } from '@testing-library/svelte';
import Counter from './Counter.svelte';

test('increments counter', async () => {
  const { getByText } = render(Counter);
  const button = getByText('+1');

  await fireEvent.click(button);

  expect(getByText('Count: 1')).toBeInTheDocument();
});

// ✅ After (Svelte 5 tests - mostly unchanged)
import { render, fireEvent } from '@testing-library/svelte';
import Counter from './Counter.svelte';

test('increments counter', async () => {
  const { getByText } = render(Counter);
  const button = getByText('+1');

  await fireEvent.click(button);

  expect(getByText('Count: 1')).toBeInTheDocument();
});
```

**Testing callback props:**
```typescript
// Testing Svelte 5 components with callbacks
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import Button from './Button.svelte';

test('calls onclick callback', async () => {
  const onclick = vi.fn();
  const { getByRole } = render(Button, {
    props: { onclick, title: 'Click me' }
  });

  const button = getByRole('button');
  await fireEvent.click(button);

  expect(onclick).toHaveBeenCalledOnce();
});
```

**Manual testing checklist:**
- [ ] All pages render without errors
- [ ] Forms submit correctly
- [ ] Client-side navigation works
- [ ] SSR renders correctly (disable JS in browser)
- [ ] Rune state updates UI
- [ ] Effects run at correct times
- [ ] No hydration mismatches
- [ ] Production build succeeds
- [ ] Bundle size similar or smaller

## Gradual Migration Strategy

Migrate incrementally for large applications:

**Phase 1: Update dependencies (30 minutes)**
```bash
# Update to latest SvelteKit 2 and Svelte 5
npm install svelte@latest @sveltejs/kit@latest

# Update related packages
npm update @sveltejs/adapter-auto
npm update @sveltejs/vite-plugin-svelte

# Run build to see what breaks
npm run build
```

**Phase 2: Fix critical errors (1-2 hours)**
```bash
# Common errors to fix immediately:
# 1. $: syntax in <script context="module"> - move to regular script
# 2. Store auto-subscriptions in SSR components - wrap in browser check
# 3. Event forwarding - replace with callback props
```

**Phase 3: Migrate by feature (1-3 days)**
```
Priority order:
1. Shared state (stores → context + runes)
2. Reusable UI components (slots → snippets)
3. Form components (events → callbacks)
4. Page components (reactive statements → $derived)
5. Layout components last (after children migrated)
```

**Phase 4: Test thoroughly (1 day)**
```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Manual testing
npm run dev # Test development
npm run build && npm run preview # Test production
```

**Migration tracking:**
```typescript
// Create migration-status.md in your repo
# Migration Status

## Completed
- [x] Authentication components
- [x] Dashboard page
- [x] Settings page

## In Progress
- [ ] Blog feature (3/10 components)

## Not Started
- [ ] Admin panel
- [ ] Analytics dashboard
```

## Troubleshooting Migration Issues

Common problems and solutions:

**Issue: "$state is not defined on server"**
```svelte
<!-- ❌ Problem: Using $state in SSR -->
<script>
  let count = $state(0); // Crashes on server
</script>

<!-- ✅ Solution: Check for browser context -->
<script>
  import { browser } from '$app/environment';

  let count = $state(0);

  $effect(() => {
    if (browser) {
      // Client-only effect
      console.log('Count:', count);
    }
  });
</script>
```

**Issue: "Cannot access 'X' before initialization"**
```svelte
<!-- ❌ Problem: Circular dependency in $derived -->
<script>
  let a = $derived(b + 1);
  let b = $derived(a + 1); // Error!
</script>

<!-- ✅ Solution: One must be $state -->
<script>
  let a = $state(0);
  let b = $derived(a + 1);
</script>
```

**Issue: "Children is not a function"**
```svelte
<!-- ❌ Problem: Forgetting to render children -->
<script>
  let { children } = $props();
</script>

<div>
  {children} <!-- Wrong! -->
</div>

<!-- ✅ Solution: Use {@render} -->
<div>
  {@render children()}
</div>
```

**Issue: Effects running too many times**
```svelte
<!-- ❌ Problem: Effect depends on too many signals -->
<script>
  let a = $state(0);
  let b = $state(0);

  $effect(() => {
    // Runs whenever a OR b changes
    console.log(a, b);
  });
</script>

<!-- ✅ Solution: Use untrack for conditional dependencies -->
<script>
  import { untrack } from 'svelte';

  let a = $state(0);
  let b = $state(0);

  $effect(() => {
    console.log(a); // Tracks a
    if (a > 5) {
      console.log(untrack(() => b)); // Doesn't track b
    }
  });
</script>
```

**Issue: Form actions not triggering rune updates**
```svelte
<!-- ❌ Problem: ActionData doesn't auto-update runes -->
<script>
  let { form } = $props(); // ActionData from server
  let localMessage = $state('');

  // form.message doesn't trigger rune update
</script>

<!-- ✅ Solution: Use $effect to sync -->
<script>
  let { form } = $props();
  let localMessage = $state('');

  $effect(() => {
    if (form?.message) {
      localMessage = form.message;
    }
  });
</script>
```

## Migration Decision Matrix

**Should you migrate now?**

| Factor | Migrate Now | Wait |
|--------|-------------|------|
| **Project maturity** | Active development | Stable production |
| **Team size** | 1-3 developers | Large team (>10) |
| **Test coverage** | Good (>70%) | Poor (<30%) |
| **Breaking changes** | Few components affected | Many components affected |
| **Svelte usage** | Moderate | Heavy store/slot usage |
| **Timeline** | 1-2 weeks available | Tight deadline |

**Decision rule:**
- **Migrate if:** In active development, good test coverage, small-medium codebase
- **Wait if:** Production deadline within 2 weeks, poor test coverage, very large codebase
- **Test first:** Always test in separate branch before merging

The migration from Svelte 4 to 5 modernizes your reactivity system and component API. Take it incrementally, test thoroughly, and leverage Svelte 5's backwards compatibility during the transition period.
