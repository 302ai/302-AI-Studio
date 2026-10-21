---
title: "Advanced Styling Patterns with Tailwind CSS v4 and Svelte 5"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "Community styling patterns from production Svelte applications"
  - "Tailwind CSS advanced patterns and component design strategies"
last_reviewed: 2025-10-28
summary: "Master advanced Tailwind CSS patterns in Svelte 5 including component variants, conditional styling with runes, dynamic themes, reusable utilities, and design system integration."
---

# Advanced Styling Patterns with Tailwind CSS v4 and Svelte 5

This guide covers advanced patterns for building maintainable, scalable styling systems with Tailwind CSS v4 and Svelte 5 runes.

## Component Styling Strategies

Build reusable components with consistent styling:

**Variant-based component pattern:**
```svelte
<!-- Button.svelte -->
<script lang="ts">
  type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
  type Size = 'sm' | 'md' | 'lg';

  interface ButtonProps {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    fullWidth?: boolean;
    children: import('svelte').Snippet;
    onclick?: (event: MouseEvent) => void;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    children,
    onclick
  }: ButtonProps = $props();

  // Base styles applied to all variants
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant-specific styles
  const variantClasses: Record<Variant, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500'
  };

  // Size-specific styles
  const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Computed class string
  const classes = $derived([
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed'
  ].filter(Boolean).join(' '));
</script>

<button
  class={classes}
  {disabled}
  {onclick}
  type="button"
>
  {@render children()}
</button>
```

**Usage example:**
```svelte
<script>
  import Button from '$lib/components/ui/Button.svelte';
</script>

<div class="flex gap-2">
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger">Delete</Button>
  <Button variant="ghost">Cancel</Button>
</div>

<div class="mt-4">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>

<div class="mt-4">
  <Button fullWidth variant="primary">Full Width</Button>
</div>
```

**Compound component pattern:**
```svelte
<!-- Card.svelte -->
<script>
  let { children } = $props();
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden">
  {@render children()}
</div>

<!-- CardHeader.svelte -->
<script>
  let { children } = $props();
</script>

<div class="px-6 py-4 border-b border-gray-200">
  {@render children()}
</div>

<!-- CardBody.svelte -->
<script>
  let { children } = $props();
</script>

<div class="px-6 py-4">
  {@render children()}
</div>

<!-- CardFooter.svelte -->
<script>
  let { children } = $props();
</script>

<div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
  {@render children()}
</div>

<!-- Usage -->
<script>
  import Card from '$lib/components/ui/Card.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardBody from '$lib/components/ui/CardBody.svelte';
  import CardFooter from '$lib/components/ui/CardFooter.svelte';
</script>

<Card>
  <CardHeader>
    <h2 class="text-xl font-bold">Card Title</h2>
  </CardHeader>
  <CardBody>
    <p class="text-gray-600">Card content goes here</p>
  </CardBody>
  <CardFooter>
    <button class="btn">Action</button>
  </CardFooter>
</Card>
```

**Decision rule:** Use variant props for styling variations within a single component. Use compound components when different sections have distinct layouts and semantic meaning.

## Conditional Classes with Runes

Leverage Svelte 5 runes for reactive styling:

**Boolean conditions with class: directive:**
```svelte
<script>
  let isActive = $state(false);
  let isLoading = $state(false);
  let hasError = $state(false);
</script>

<!-- ✅ CORRECT: Use class: for boolean conditions -->
<button
  class="btn"
  class:bg-blue-600={isActive}
  class:bg-gray-400={!isActive}
  class:animate-pulse={isLoading}
  class:ring-2={isActive}
  class:ring-blue-500={isActive}
  class:border-red-500={hasError}
  onclick={() => isActive = !isActive}
>
  Toggle State
</button>
```

**Multiple state conditions:**
```svelte
<script>
  type Status = 'idle' | 'loading' | 'success' | 'error';
  let status = $state<Status>('idle');

  const statusClasses = $derived({
    idle: 'bg-gray-200 text-gray-700',
    loading: 'bg-blue-500 text-white animate-pulse',
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white'
  }[status]);
</script>

<div class="badge {statusClasses}">
  {status}
</div>
```

**Complex conditional styling:**
```svelte
<script>
  let priority = $state<'low' | 'medium' | 'high'>('medium');
  let completed = $state(false);
  let archived = $state(false);

  const cardClasses = $derived([
    'p-4 rounded-lg border-2 transition-all',
    // Priority-based border
    priority === 'high' && !archived && 'border-red-500',
    priority === 'medium' && !archived && 'border-yellow-500',
    priority === 'low' && !archived && 'border-gray-300',
    // Completion state
    completed && 'opacity-60 line-through',
    // Archived state
    archived && 'bg-gray-100 border-gray-400'
  ].filter(Boolean).join(' '));
</script>

<div class={cardClasses}>
  <h3>Task: {priority} priority</h3>
  <div class="mt-2 flex gap-2">
    <button onclick={() => completed = !completed}>
      {completed ? 'Undo' : 'Complete'}
    </button>
    <button onclick={() => archived = !archived}>
      {archived ? 'Unarchive' : 'Archive'}
    </button>
  </div>
</div>
```

**Transition classes with effects:**
```svelte
<script>
  let show = $state(false);
  let transitioning = $state(false);

  async function toggle() {
    if (show) {
      // Start exit transition
      transitioning = true;
      await new Promise(resolve => setTimeout(resolve, 300));
      show = false;
      transitioning = false;
    } else {
      show = true;
      // Force a reflow
      await new Promise(resolve => setTimeout(resolve, 10));
      transitioning = true;
    }
  }
</script>

<button onclick={toggle}>Toggle</button>

{#if show}
  <div
    class="mt-4 p-4 bg-blue-100 rounded transition-all duration-300"
    class:opacity-0={!transitioning}
    class:opacity-100={transitioning}
    class:scale-95={!transitioning}
    class:scale-100={transitioning}
  >
    Animated content
  </div>
{/if}
```

## Dynamic Styling Patterns

Handle dynamic values safely:

**CSS custom properties for dynamic values:**
```svelte
<!-- ❌ WRONG: Dynamic class generation (won't work) -->
<script>
  let color = $state('blue');
  let shade = $state('500');
</script>
<div class="bg-{color}-{shade}">Bad</div>

<!-- ✅ CORRECT: CSS custom properties -->
<script>
  let hue = $state(220); // blue
  let saturation = $state(70);
  let lightness = $state(50);

  const bgColor = $derived(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
</script>

<div
  style="--bg-color: {bgColor}"
  class="p-4 rounded"
  style:background-color="var(--bg-color)"
>
  Dynamic color
</div>
```

**Safe dynamic styling with inline styles:**
```svelte
<script>
  let width = $state(200);
  let height = $state(100);
  let rotation = $state(0);

  const transform = $derived(`rotate(${rotation}deg)`);
</script>

<div class="relative">
  <div
    class="absolute bg-blue-500 transition-all duration-300"
    style:width="{width}px"
    style:height="{height}px"
    style:transform={transform}
  >
    Animated box
  </div>

  <div class="mt-48 space-y-2">
    <input
      type="range"
      bind:value={width}
      min="50"
      max="400"
      class="w-full"
    />
    <input
      type="range"
      bind:value={height}
      min="50"
      max="400"
      class="w-full"
    />
    <input
      type="range"
      bind:value={rotation}
      min="0"
      max="360"
      class="w-full"
    />
  </div>
</div>
```

**Safelist approach for limited dynamic classes:**
```css
/* app.css */
@import "tailwindcss";

/* Safelist all status colors */
@utility safe(bg-gray-500);
@utility safe(bg-blue-500);
@utility safe(bg-green-500);
@utility safe(bg-yellow-500);
@utility safe(bg-red-500);

@utility safe(text-gray-600);
@utility safe(text-blue-600);
@utility safe(text-green-600);
@utility safe(text-yellow-600);
@utility safe(text-red-600);
```

```svelte
<script>
  type Status = 'pending' | 'active' | 'success' | 'warning' | 'error';

  let status = $state<Status>('active');

  const colorMap: Record<Status, { bg: string; text: string }> = {
    pending: { bg: 'bg-gray-500', text: 'text-gray-600' },
    active: { bg: 'bg-blue-500', text: 'text-blue-600' },
    success: { bg: 'bg-green-500', text: 'text-green-600' },
    warning: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    error: { bg: 'bg-red-500', text: 'text-red-600' }
  };

  const colors = $derived(colorMap[status]);
</script>

<div class="badge {colors.bg} text-white">
  Status: {status}
</div>
<p class={colors.text}>
  Status description
</p>
```

## Theme Customization

Build themeable components:

**CSS custom properties for themes:**
```css
/* app.css */
@import "tailwindcss";

@theme {
  /* Light theme (default) */
  --color-primary: #3B82F6;
  --color-secondary: #10B981;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
}

/* Dark theme */
.dark {
  --color-primary: #60A5FA;
  --color-secondary: #34D399;
  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #F9FAFB;
  --color-text-secondary: #D1D5DB;
}

/* Custom utilities using theme variables */
@utility bg-primary {
  background-color: var(--color-primary);
}

@utility bg-surface {
  background-color: var(--color-surface);
}

@utility text-primary {
  color: var(--color-text);
}

@utility text-secondary {
  color: var(--color-text-secondary);
}
```

**Theme toggle component:**
```svelte
<!-- ThemeToggle.svelte -->
<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let theme = $state<'light' | 'dark'>('light');

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    updateTheme();
  }

  function updateTheme() {
    if (browser) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }

  onMount(() => {
    // Load saved theme
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      theme = saved;
    } else {
      // Respect system preference
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    updateTheme();
  });
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-lg bg-surface hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
  aria-label="Toggle theme"
>
  {#if theme === 'light'}
    🌙 Dark
  {:else}
    ☀️ Light
  {/if}
</button>
```

**Themeable component example:**
```svelte
<!-- Card.svelte -->
<script>
  let { children } = $props();
</script>

<div class="rounded-lg shadow-lg bg-surface p-6 border border-gray-200 dark:border-gray-700">
  <div class="text-primary">
    {@render children()}
  </div>
</div>
```

## Reusable Utility Patterns

Create maintainable utility classes:

**Custom utility definitions:**
```css
/* app.css */
@import "tailwindcss";

/* Animation utilities */
@utility animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@utility animate-slide-in {
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

/* Gradient utilities */
@utility gradient-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@utility gradient-secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

/* Text shadow utilities */
@utility text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@utility text-shadow-md {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Glass morphism effect */
@utility glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Card hover effect */
@utility card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

@utility card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

**Usage in components:**
```svelte
<script>
  let items = $state([
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' }
  ]);
</script>

<div class="grid grid-cols-3 gap-4">
  {#each items as item (item.id)}
    <div class="card-hover rounded-lg p-6 bg-white shadow-md">
      <h3 class="text-xl font-bold text-shadow-md gradient-primary bg-clip-text text-transparent">
        {item.title}
      </h3>
      <p class="mt-2 text-gray-600">Content</p>
    </div>
  {/each}
</div>
```

## Design System Integration

Integrate with design tokens:

**Design tokens setup:**
```css
/* app.css */
@import "tailwindcss";

@theme {
  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Typography scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Line heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;

  /* Shadow scale */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

**Component with design tokens:**
```svelte
<!-- Button.svelte using design system tokens -->
<script lang="ts">
  type Size = 'sm' | 'md' | 'lg';

  let {
    size = 'md',
    children,
    onclick
  }: {
    size?: Size;
    children: import('svelte').Snippet;
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sizeClasses: Record<Size, string> = {
    sm: 'px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-[var(--font-size-sm)]',
    md: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--font-size-base)]',
    lg: 'px-[var(--spacing-lg)] py-[var(--spacing-md)] text-[var(--font-size-lg)]'
  };
</script>

<button
  class="rounded-[var(--radius-md)] shadow-[var(--shadow-md)] transition-all {sizeClasses[size]}"
  {onclick}
>
  {@render children()}
</button>
```

## Component Library Patterns

Build scalable component libraries:

**Component index pattern:**
```typescript
// src/lib/components/ui/index.ts
export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as Input } from './Input.svelte';
export { default as Badge } from './Badge.svelte';
export { default as Modal } from './Modal.svelte';

// Usage
import { Button, Card, Input } from '$lib/components/ui';
```

**Composable form components:**
```svelte
<!-- FormField.svelte -->
<script>
  let {
    label,
    error,
    required = false,
    children
  } = $props();
</script>

<div class="form-field">
  <label class="block text-sm font-medium text-gray-700 mb-1">
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>

  {@render children()}

  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>

<!-- Usage -->
<script>
  import FormField from '$lib/components/ui/FormField.svelte';
  import Input from '$lib/components/ui/Input.svelte';

  let email = $state('');
  let errors = $state({});
</script>

<form>
  <FormField label="Email" required error={errors.email}>
    <Input
      type="email"
      bind:value={email}
      placeholder="you@example.com"
    />
  </FormField>
</form>
```

## Animation and Transition Patterns

Create smooth animations:

**Transition utilities:**
```css
/* app.css */
@import "tailwindcss";

/* Fade transitions */
@utility fade-enter {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale transitions */
@utility scale-enter {
  animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide transitions */
@utility slide-up-enter {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Modal with transitions:**
```svelte
<!-- Modal.svelte -->
<script>
  let {
    open = $bindable(false),
    title,
    children
  } = $props();

  function closeModal() {
    open = false;
  }
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 fade-enter"
    onclick={closeModal}
    role="presentation"
  ></div>

  <!-- Modal -->
  <div class="fixed inset-0 flex items-center justify-center p-4">
    <div
      class="bg-white rounded-lg shadow-xl max-w-md w-full scale-enter"
      role="dialog"
      aria-modal="true"
    >
      <div class="p-6">
        <h2 class="text-2xl font-bold mb-4">{title}</h2>
        {@render children()}
      </div>
      <div class="px-6 py-4 bg-gray-50 flex justify-end gap-2">
        <button
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onclick={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
```

**List animations:**
```svelte
<script>
  let items = $state([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' }
  ]);

  function addItem() {
    items = [...items, { id: Date.now(), text: `Item ${items.length + 1}` }];
  }

  function removeItem(id: number) {
    items = items.filter(item => item.id !== id);
  }
</script>

<button onclick={addItem} class="btn mb-4">Add Item</button>

<ul class="space-y-2">
  {#each items as item (item.id)}
    <li class="slide-up-enter bg-white p-4 rounded shadow flex justify-between items-center">
      <span>{item.text}</span>
      <button
        onclick={() => removeItem(item.id)}
        class="text-red-600 hover:text-red-800"
      >
        Remove
      </button>
    </li>
  {/each}
</ul>
```

## Common Styling Anti-patterns

Avoid these pitfalls:

**Anti-pattern 1: Overusing @apply**
```css
/* ❌ WRONG: Recreating utility classes */
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
}

/* ✅ CORRECT: Use utilities directly */
<button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Button
</button>
```

**Anti-pattern 2: Dynamic class generation**
```svelte
<!-- ❌ WRONG: Won't work with Tailwind -->
<script>
  let color = $state('blue');
</script>
<div class="bg-{color}-500">Bad</div>

<!-- ✅ CORRECT: Full class names -->
<div
  class:bg-blue-500={color === 'blue'}
  class:bg-red-500={color === 'red'}
>
  Good
</div>
```

**Anti-pattern 3: Inline styles instead of utilities**
```svelte
<!-- ❌ WRONG: Losing Tailwind benefits -->
<div style="padding: 1rem; background: blue;">Bad</div>

<!-- ✅ CORRECT: Use Tailwind utilities -->
<div class="p-4 bg-blue-500">Good</div>
```

**Anti-pattern 4: Not using responsive utilities**
```svelte
<!-- ❌ WRONG: JavaScript for responsive behavior -->
<script>
  import { browser } from '$app/environment';

  let isMobile = $state(false);

  $effect(() => {
    if (browser) {
      isMobile = window.innerWidth < 768;
    }
  });
</script>

<div class={isMobile ? 'text-sm' : 'text-lg'}>Bad</div>

<!-- ✅ CORRECT: Use Tailwind responsive utilities -->
<div class="text-sm md:text-lg">Good</div>
```

**Anti-pattern 5: Inconsistent spacing**
```svelte
<!-- ❌ WRONG: Arbitrary spacing values -->
<div class="mb-3 mt-5 ml-2 mr-4">Inconsistent</div>

<!-- ✅ CORRECT: Use consistent spacing scale -->
<div class="m-4">Consistent</div>
```

Follow these advanced styling patterns to build maintainable, scalable design systems with Tailwind CSS v4 and Svelte 5. Focus on utility-first principles, leverage runes for dynamic styling, and create reusable component patterns.
