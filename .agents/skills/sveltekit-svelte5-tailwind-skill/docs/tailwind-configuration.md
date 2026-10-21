---
title: "Tailwind CSS v4 Configuration Reference"
version_anchors: ["Tailwind@4.x"]
authored: true
origin: self
adapted_from:
  - "tailwindlabs/tailwindcss#91694fb (Tailwind CSS v4 documentation and configuration)"
last_reviewed: 2025-10-28
summary: "Complete configuration reference for Tailwind CSS v4 including CSS-first configuration, Vite plugin setup, content paths, theme customization, dark mode, and SvelteKit integration"
---

# Tailwind CSS v4 Configuration Reference

Complete reference for configuring Tailwind CSS v4 in SvelteKit projects. Tailwind v4 introduces a new CSS-first configuration approach while maintaining backwards compatibility.

## Installation and Setup

### Basic Installation

```bash
npm install tailwindcss@next @tailwindcss/vite@next
```

### Vite Plugin Setup

```js
// vite.config.js
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

### CSS Setup

```css
/* src/app.css */
@import "tailwindcss";
```

### Import in Root Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import '../app.css';
</script>

<slot />
```

## Configuration Approaches

Tailwind v4 offers two configuration approaches:

### CSS-First Configuration (v4 Native)

Configure directly in CSS using `@theme` and `@plugin`.

```css
/* src/app.css */
@import "tailwindcss";

@theme {
	--color-primary: #3b82f6;
	--color-secondary: #8b5cf6;

	--font-sans: Inter, system-ui, sans-serif;
	--font-mono: 'Fira Code', monospace;

	--breakpoint-3xl: 1920px;

	--spacing-18: 4.5rem;
}
```

### JavaScript Configuration (v3 Compatible)

Use `tailwind.config.js` for backwards compatibility.

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#3b82f6',
				secondary: '#8b5cf6'
			}
		}
	},
	plugins: []
}
```

## Content Configuration

### Content Paths

Specify where Tailwind should look for class names.

**CSS-first approach:**
```css
@source "../../lib/**/*.{html,js,svelte,ts}";
```

**JavaScript approach:**
```js
// tailwind.config.js
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./src/**/*.svelte',
		'../shared-ui/src/**/*.svelte'
	]
}
```

### Content Patterns for SvelteKit

```js
export default {
	content: [
		'./src/routes/**/*.{svelte,js,ts}',    // All route files
		'./src/lib/**/*.{svelte,js,ts}',       // Library components
		'./src/app.html'                       // App template
	]
}
```

### Safelist Classes

Prevent specific classes from being purged.

```js
export default {
	safelist: [
		'bg-blue-500',
		'text-red-600',
		{
			pattern: /bg-(red|green|blue)-(100|200|300)/,
			variants: ['hover', 'focus']
		}
	]
}
```

## Theme Customization

### CSS Theme Variables

```css
@theme {
	/* Colors */
	--color-brand: #0ea5e9;
	--color-accent: #f59e0b;

	/* Fonts */
	--font-display: 'Playfair Display', serif;
	--font-body: Inter, sans-serif;

	/* Spacing */
	--spacing-small: 0.5rem;
	--spacing-medium: 1rem;
	--spacing-large: 2rem;

	/* Breakpoints */
	--breakpoint-tablet: 640px;
	--breakpoint-laptop: 1024px;
	--breakpoint-desktop: 1280px;

	/* Border radius */
	--radius-sm: 0.25rem;
	--radius-md: 0.5rem;
	--radius-lg: 1rem;

	/* Shadows */
	--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
	--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

### JavaScript Theme Customization

```js
export default {
	theme: {
		extend: {
			colors: {
				brand: {
					50: '#eff6ff',
					100: '#dbeafe',
					500: '#3b82f6',
					900: '#1e3a8a'
				}
			},
			fontFamily: {
				display: ['Playfair Display', 'serif'],
				body: ['Inter', 'sans-serif']
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem'
			},
			borderRadius: {
				'4xl': '2rem'
			},
			boxShadow: {
				'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)'
			}
		}
	}
}
```

## Dark Mode Configuration

### Class-Based Dark Mode (Recommended)

```js
// tailwind.config.js
export default {
	darkMode: 'class'
}
```

**SvelteKit implementation:**
```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';

	let darkMode = writable(false);

	if (browser) {
		// Initialize from localStorage
		darkMode.set(localStorage.getItem('theme') === 'dark');
	}

	function toggleDarkMode() {
		darkMode.update(v => !v);
		if (browser) {
			const newValue = !$darkMode;
			localStorage.setItem('theme', newValue ? 'dark' : 'light');
			document.documentElement.classList.toggle('dark', newValue);
		}
	}
</script>

<svelte:head>
	{#if $darkMode}
		<script>
			document.documentElement.classList.add('dark');
		</script>
	{/if}
</svelte:head>

<div class="min-h-screen bg-white dark:bg-gray-900">
	<button onclick={toggleDarkMode}>
		Toggle Dark Mode
	</button>

	<slot />
</div>
```

### Media Query Dark Mode

```js
export default {
	darkMode: 'media'  // Uses prefers-color-scheme
}
```

### Selector-Based Dark Mode

```js
export default {
	darkMode: ['selector', '[data-mode="dark"]']
}
```

## Vite Plugin Options

### Lightning CSS Optimization

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss({
			// Disable optimization (dev mode)
			optimize: false
		})
	]
});
```

**Disable minification only:**
```js
tailwindcss({
	optimize: { minify: false }
})
```

**Production optimization:**
```js
tailwindcss({
	optimize: process.env.NODE_ENV === 'production'
})
```

## Plugins

### Using Official Plugins

```bash
npm install @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio
```

```js
// tailwind.config.js
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';

export default {
	plugins: [
		forms,
		typography,
		aspectRatio
	]
}
```

### CSS Plugin Definition (v4)

```css
@plugin "my-plugin" {
	.custom-utility {
		@apply flex items-center justify-center;
	}
}
```

### JavaScript Plugin Definition

```js
// tailwind.config.js
import plugin from 'tailwindcss/plugin';

export default {
	plugins: [
		plugin(function({ addUtilities, addComponents, theme }) {
			addUtilities({
				'.content-auto': {
					'content-visibility': 'auto'
				}
			});

			addComponents({
				'.btn': {
					padding: theme('spacing.4'),
					borderRadius: theme('borderRadius.md'),
					fontWeight: theme('fontWeight.semibold')
				}
			});
		})
	]
}
```

## Custom Utilities

### Arbitrary Values

```svelte
<div class="top-[117px]" />
<div class="bg-[#1da1f2]" />
<div class="grid-cols-[1fr,700px,2fr]" />
```

### Arbitrary Properties

```svelte
<div class="[mask-type:luminance]" />
<div class="[--scroll-offset:56px]" />
```

### Arbitrary Variants

```svelte
<div class="[&:nth-child(3)]:py-0" />
<div class="[&_p]:mt-4" />
```

## SvelteKit-Specific Configuration

### Complete SvelteKit + Tailwind Setup

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss({
			optimize: process.env.NODE_ENV === 'production'
		})
	],
	css: {
		devSourcemap: true
	}
});
```

```css
/* src/app.css */
@import "tailwindcss";

@theme {
	--color-primary: #0ea5e9;
	--font-sans: Inter, system-ui, sans-serif;
}

/* Custom components */
@layer components {
	.btn {
		@apply px-4 py-2 rounded bg-primary text-white hover:bg-primary/90;
	}
}

/* Custom utilities */
@layer utilities {
	.text-balance {
		text-wrap: balance;
	}
}
```

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import '../app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<slot />
</div>
```

### Dynamic Class Names in Svelte

**Safe (always works):**
```svelte
<div class="bg-blue-500" />
<div class="text-{color}-600" />  <!-- If color is known at build time -->
```

**Unsafe (might not work):**
```svelte
<script>
	let color = $state('blue');
</script>

<!-- ❌ Dynamic concatenation not detected -->
<div class="bg-{color}-500" />
```

**Solution - Use safelist or complete classes:**
```svelte
<script>
	let color = $state('blue');
	let classes = $derived(
		color === 'blue' ? 'bg-blue-500' :
		color === 'red' ? 'bg-red-500' :
		'bg-gray-500'
	);
</script>

<!-- ✅ Complete class names -->
<div class={classes} />
```

## Advanced Configuration

### Prefix

Add prefix to all Tailwind classes.

```js
export default {
	prefix: 'tw-'
}
```

**Usage:**
```svelte
<div class="tw-flex tw-items-center tw-justify-center" />
```

### Important

Make all utilities `!important`.

```js
export default {
	important: true
}
```

**Or with selector:**
```js
export default {
	important: '#app'
}
```

### Separator

Change the separator for variants.

```js
export default {
	separator: '_'
}
```

**Usage:**
```svelte
<div class="hover_bg-blue-500" />
```

### Core Plugins

Disable specific core plugins.

```js
export default {
	corePlugins: {
		preflight: false,  // Disable base styles
		container: false,
		float: false
	}
}
```

## PostCSS Configuration

### Basic PostCSS Setup

```js
// postcss.config.js
export default {
	plugins: {
		tailwindcss: {},
		autoprefixer: {}
	}
}
```

### With Additional Plugins

```js
// postcss.config.js
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default {
	plugins: [
		tailwindcss,
		autoprefixer,
		...(process.env.NODE_ENV === 'production' ? [cssnano] : [])
	]
}
```

## Performance Optimization

### Production Optimization

```js
// vite.config.js
export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss({
			optimize: {
				minify: true
			}
		})
	],
	build: {
		cssCodeSplit: true,
		cssMinify: 'lightningcss'
	}
});
```

### Content Configuration for Performance

```js
export default {
	content: {
		files: [
			'./src/**/*.{html,js,svelte,ts}'
		],
		extract: {
			// Custom extractor for Svelte
			svelte: (content) => {
				return content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
			}
		}
	}
}
```

## Migration from v3 to v4

### Key Changes

1. **CSS-first configuration** - New `@theme` syntax
2. **Vite plugin** - Use `@tailwindcss/vite` instead of PostCSS
3. **Lightning CSS** - Built-in optimization
4. **No JIT mode** - JIT is now the default (and only) mode

### Migration Steps

```bash
# Install v4 packages
npm install tailwindcss@next @tailwindcss/vite@next

# Remove v3 packages (if using PostCSS approach)
npm uninstall @tailwindcss/postcss7-compat
```

**Update Vite config:**
```js
// Before (v3)
export default defineConfig({
	css: {
		postcss: {
			plugins: [tailwindcss, autoprefixer]
		}
	}
});

// After (v4)
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss()
	]
});
```

**Update CSS file:**
```css
/* Before (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* After (v4) */
@import "tailwindcss";
```

## Environment-Specific Configuration

### Development vs Production

```js
// vite.config.js
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss({
			optimize: !isDev,
			minify: !isDev
		})
	]
});
```

### Multiple Environments

```js
// tailwind.config.js
const production = process.env.NODE_ENV === 'production';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: production ? {
				primary: '#0ea5e9'
			} : {
				primary: '#ef4444'  // Different color in dev
			}
		}
	}
}
```

## Troubleshooting

### Classes Not Applying

1. Check content paths in `tailwind.config.js`
2. Verify `app.css` is imported in `+layout.svelte`
3. Ensure Vite plugin is properly configured
4. Check for typos in class names

### Build Performance Issues

1. Optimize content paths (be specific)
2. Enable Lightning CSS optimization
3. Use CSS code splitting
4. Minimize use of arbitrary values

### Dark Mode Not Working

1. Verify `darkMode: 'class'` in config
2. Ensure `dark` class is added to `<html>` element
3. Check localStorage integration
4. Test without JavaScript enabled

### HMR Not Working

1. Restart dev server
2. Clear `.svelte-kit` directory
3. Check Vite plugin order (sveltekit before tailwindcss)
4. Verify file watching patterns
