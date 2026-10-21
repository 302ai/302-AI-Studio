---
title: "Migrate Tailwind CSS from v3 to v4 in SvelteKit Projects"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x", "Tailwind@3.x→4.x"]
authored: true
origin: self
adapted_from:
  - "tailwindlabs/tailwindcss GitHub repository (v4 changelog and migration patterns)"
  - "Community migration experiences from SvelteKit projects"
last_reviewed: 2025-10-28
summary: "Upgrade from Tailwind CSS v3 to v4 in SvelteKit projects with step-by-step migration, breaking changes checklist, and rollback strategy for production deployments."
---

# Migrate Tailwind CSS from v3 to v4 in SvelteKit Projects

Tailwind CSS v4 introduces a new architecture with CSS-first configuration and a streamlined Vite plugin. This guide walks you through migrating existing SvelteKit projects from v3 to v4 safely.

## Breaking Changes Overview

Understand what's changed before starting migration:

**Configuration changes:**
- JS config file (`tailwind.config.js`) → CSS-based configuration
- `@apply` directive deprecated in favor of utility classes
- Custom plugin API completely rewritten
- PostCSS configuration no longer required

**Build system changes:**
- New `@tailwindcss/vite` plugin required
- JIT mode always enabled (no configuration needed)
- Faster build times with new engine

**Vite plugin order matters:**
```js
// ❌ WRONG: Old v3 pattern
import { sveltekit } from '@sveltejs/kit/vite';
// No Tailwind plugin in v3

export default {
  plugins: [sveltekit()]
};

// ✅ CORRECT: New v4 pattern
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [
    tailwindcss(), // Must come BEFORE sveltekit()
    sveltekit()
  ]
};
```

**CSS import changes:**
```css
/* ❌ v3 approach */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ v4 approach (same syntax, different processing) */
@import "tailwindcss";
/* or still use: */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Impact:** Most utility classes unchanged, but configuration and build process require updates.

## Configuration Migration Strategy

Transform your JavaScript config to CSS-based configuration:

**Before (v3 tailwind.config.js):**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3B82F6',
          secondary: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

**After (v4 app.css with CSS configuration):**
```css
/* src/app.css */
@import "tailwindcss";

/* Custom theme configuration */
@theme {
  --color-brand-primary: #3B82F6;
  --color-brand-secondary: #10B981;

  --font-sans: Inter, sans-serif;
}

/* Custom utilities */
@utility text-brand {
  color: var(--color-brand-primary);
}
```

**Decision rule:** Use CSS configuration for theme customization instead of JS config. The v4 approach integrates better with SvelteKit's HMR.

**Alternative approach - keep minimal JS config:**
```js
// tailwind.config.js (optional in v4)
export default {
  // Only use for complex plugin configurations
  plugins: [
    // Custom plugins if needed
  ]
};
```

## Content Detection Updates

Content scanning works differently in v4:

**v3 content configuration:**
```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  safelist: ['bg-red-500', 'text-blue-600']
};
```

**v4 automatic content detection:**
```css
/* app.css */
@import "tailwindcss";

/* Content paths now specified in CSS */
@source "src/**/*.{html,js,svelte,ts}";

/* Safelist classes that might be dynamic */
@utility safe(bg-red-500);
@utility safe(text-blue-600);
```

**SvelteKit-specific patterns:**
```css
/* Include all route files */
@source "src/routes/**/*.svelte";
@source "src/routes/**/*.ts";

/* Include component library */
@source "src/lib/components/**/*.svelte";

/* Include server files that might have classes */
@source "src/routes/**/+page.server.ts";
```

**Testing content detection:**
```svelte
<!-- Test component: src/lib/test/TailwindTest.svelte -->
<script>
  let variant = $state('primary');
</script>

<!-- Use full class names for detection -->
<div class:bg-blue-500={variant === 'primary'}
     class:bg-green-500={variant === 'secondary'}>
  Test content detection
</div>
```

```bash
# Build and check if classes are included
npm run build
# Inspect generated CSS for bg-blue-500 and bg-green-500
```

## Syntax Changes in v4

Core utilities remain the same, but some patterns change:

**Arbitrary values - enhanced syntax:**
```svelte
<!-- ❌ v3 syntax (still works but verbose) -->
<div class="bg-[#3B82F6] text-[14px]">Old syntax</div>

<!-- ✅ v4 enhanced syntax with CSS variables -->
<div style="--brand: #3B82F6;" class="bg-[--brand]">
  Better approach
</div>
```

**Color opacity changes:**
```svelte
<!-- ❌ v3 slash notation -->
<div class="bg-blue-500/50 text-white/75">v3 syntax</div>

<!-- ✅ v4 same syntax, improved processing -->
<div class="bg-blue-500/50 text-white/75">v4 syntax (unchanged)</div>
```

**Container queries (new in v4):**
```svelte
<!-- ✅ New feature in v4 -->
<div class="@container">
  <div class="@sm:text-lg @md:text-xl @lg:text-2xl">
    Responsive to container, not viewport
  </div>
</div>
```

**Important modifier:**
```svelte
<!-- ❌ v3 prefix notation -->
<div class="!bg-red-500">Force important</div>

<!-- ✅ v4 (same syntax, improved cascade handling) -->
<div class="!bg-red-500">Still works</div>
```

## Plugin Migration Guide

Custom plugins require API updates:

**v3 plugin example:**
```js
// tailwind.config.js
const plugin = require('tailwindcss/plugin');

export default {
  plugins: [
    plugin(function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-glow': {
          textShadow: `0 0 10px ${theme('colors.blue.500')}`
        }
      };
      addUtilities(newUtilities);
    })
  ]
};
```

**v4 CSS-based alternative:**
```css
/* app.css - preferred approach */
@utility text-glow {
  text-shadow: 0 0 10px theme(colors.blue.500);
}
```

**v4 plugin API (if JS needed):**
```js
// tailwind.config.js
export default {
  plugins: [
    function({ addUtilities, theme }) {
      addUtilities({
        '.text-glow': {
          'text-shadow': `0 0 10px ${theme('colors.blue.500')}`
        }
      });
    }
  ]
};
```

**Decision rule:** Use CSS `@utility` for simple utilities. Use JS plugins only for complex logic or third-party integrations.

**Popular plugin migrations:**
```bash
# v3 plugins
npm remove @tailwindcss/forms @tailwindcss/typography @tailwindcss/aspect-ratio

# v4 equivalents (many built-in now)
npm install -D @tailwindcss/forms@next @tailwindcss/typography@next
```

## Build Process Changes

Update your build configuration:

**Install v4 packages:**
```bash
# Remove v3
npm remove tailwindcss postcss autoprefixer

# Install v4
npm install -D tailwindcss@next @tailwindcss/vite@next
```

**Update vite.config.js:**
```js
// ❌ v3 configuration (PostCSS-based)
import { sveltekit } from '@sveltejs/kit/vite';

export default {
  plugins: [sveltekit()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  }
};

// ✅ v4 configuration (Vite plugin)
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [
    tailwindcss(), // Process CSS first
    sveltekit()    // Then process Svelte
  ]
  // No postcss config needed!
};
```

**Remove postcss.config.js:**
```bash
# v4 doesn't need PostCSS configuration
rm postcss.config.js
```

**Update package.json scripts (no changes needed):**
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Verify build output:**
```bash
npm run build

# Check generated CSS includes Tailwind utilities
ls -lh .svelte-kit/output/client/_app/immutable/assets/
# Should see CSS file with Tailwind classes
```

## Step-by-Step Migration Checklist

Follow this sequence to migrate safely:

**Phase 1: Backup and prepare (5 minutes)**
```bash
# Create migration branch
git checkout -b tailwind-v4-migration

# Commit current state
git add .
git commit -m "Pre-migration checkpoint"

# Document current dependencies
npm list tailwindcss postcss autoprefixer > pre-migration-deps.txt
```

**Phase 2: Update dependencies (2 minutes)**
```bash
# Remove v3 dependencies
npm remove tailwindcss postcss autoprefixer

# Install v4 dependencies
npm install -D tailwindcss@next @tailwindcss/vite@next

# Update other Tailwind plugins if used
npm install -D @tailwindcss/forms@next @tailwindcss/typography@next
```

**Phase 3: Update build configuration (10 minutes)**

1. Update `vite.config.js`:
```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [
    tailwindcss(),
    sveltekit()
  ]
};
```

2. Update `src/app.css`:
```css
/* Replace or keep existing directives */
@import "tailwindcss";

/* Add custom theme config */
@theme {
  /* Your custom theme here */
}
```

3. Delete `postcss.config.js` if it exists:
```bash
rm postcss.config.js
```

**Phase 4: Migrate configuration (15 minutes)**

Convert `tailwind.config.js` theme extensions to CSS:
```css
/* app.css */
@theme {
  /* Colors from JS config */
  --color-brand-blue: #3B82F6;

  /* Spacing from JS config */
  --spacing-18: 4.5rem;

  /* Fonts from JS config */
  --font-display: 'Playfair Display', serif;
}
```

Keep JS config only for complex plugins:
```js
// tailwind.config.js (minimal)
export default {
  plugins: [
    // Only keep plugins that require JS
  ]
};
```

**Phase 5: Update custom utilities (10 minutes)**

Migrate custom utilities to CSS:
```css
/* app.css */
@utility text-gradient {
  background: linear-gradient(to right, #3B82F6, #10B981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

**Phase 6: Test development build (5 minutes)**
```bash
# Start dev server
npm run dev

# Test in browser:
# 1. HMR works correctly
# 2. Custom colors apply
# 3. Utilities are generated
# 4. No console errors
```

**Phase 7: Test production build (5 minutes)**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Test in browser:
# 1. CSS loads correctly
# 2. No FOUC (flash of unstyled content)
# 3. Utilities are purged correctly
# 4. File sizes are reasonable
```

**Total migration time: ~45-60 minutes**

## Testing After Migration

Verify everything works correctly:

**Visual regression testing:**
```svelte
<!-- Create test page: src/routes/tailwind-test/+page.svelte -->
<script>
  let enabled = $state(true);
</script>

<div class="p-8 space-y-4">
  <h1 class="text-4xl font-bold text-blue-600">
    Tailwind v4 Test Page
  </h1>

  <!-- Test colors -->
  <div class="flex gap-4">
    <div class="w-20 h-20 bg-red-500 rounded"></div>
    <div class="w-20 h-20 bg-green-500 rounded"></div>
    <div class="w-20 h-20 bg-blue-500 rounded"></div>
  </div>

  <!-- Test responsive -->
  <div class="text-sm md:text-base lg:text-lg xl:text-xl">
    Responsive text sizing
  </div>

  <!-- Test dark mode -->
  <div class="bg-white dark:bg-gray-800 text-black dark:text-white p-4">
    Dark mode test
  </div>

  <!-- Test dynamic classes -->
  <button
    onclick={() => enabled = !enabled}
    class="px-4 py-2 rounded"
    class:bg-blue-500={enabled}
    class:bg-gray-400={!enabled}
  >
    {enabled ? 'Enabled' : 'Disabled'}
  </button>

  <!-- Test custom utilities -->
  <div class="text-brand text-glow">
    Custom utilities test
  </div>
</div>
```

**Build size comparison:**
```bash
# Before migration (save output)
npm run build > v3-build.txt
grep "CSS" v3-build.txt

# After migration
npm run build > v4-build.txt
grep "CSS" v4-build.txt

# Compare CSS bundle sizes
# v4 should be similar or smaller
```

**Performance testing:**
```bash
# Build production bundle
npm run build

# Start preview server
npm run preview

# Run Lighthouse audit
npx lighthouse http://localhost:4173 --view

# Check for:
# - No layout shifts (CLS)
# - Fast FCP (First Contentful Paint)
# - Good LCP (Largest Contentful Paint)
```

**Cross-browser testing checklist:**
- [ ] Chrome/Edge - Test modern features
- [ ] Firefox - Verify CSS compatibility
- [ ] Safari - Check iOS-specific rendering
- [ ] Test SSR - Disable JavaScript in browser
- [ ] Test dark mode toggle
- [ ] Test responsive breakpoints

## Rollback Strategy

If migration fails, revert safely:

**Immediate rollback (5 minutes):**
```bash
# Revert to pre-migration state
git checkout main
git branch -D tailwind-v4-migration

# Or if you want to keep branch for debugging
git checkout main
git worktree add ../project-v3-backup main

# Reinstall dependencies
npm install
```

**Partial rollback - keep v4 but fix issues:**
```bash
# Keep migration branch active
git checkout tailwind-v4-migration

# Temporarily add back v3 config for debugging
cp ../project-backup/tailwind.config.js .

# Compare v3 vs v4 build outputs
diff -u v3-build.txt v4-build.txt
```

**Gradual migration approach (if full migration fails):**
```js
// vite.config.js - run both v3 and v4 side-by-side
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [
    tailwindcss(), // v4 for new components
    sveltekit()
  ],
  // Note: Can't actually run both versions simultaneously
  // This is pseudocode for conceptual gradual migration
};
```

**Common rollback scenarios:**

**Scenario 1: Custom plugin doesn't work in v4**
- Keep v3 temporarily
- File issue with plugin maintainer
- Migrate plugin to v4 CSS utilities
- Resume migration when plugin is compatible

**Scenario 2: Production build fails**
- Check adapter compatibility (all official adapters support v4)
- Verify Vite plugin order
- Test with minimal configuration
- Add custom config incrementally

**Scenario 3: Styles look different**
- Check for `@apply` usage (deprecated)
- Verify color values in theme
- Test purging configuration
- Compare generated CSS files

## Common Migration Pitfalls

**Pitfall 1: Wrong Vite plugin order**
```js
// ❌ WRONG: SvelteKit before Tailwind
plugins: [sveltekit(), tailwindcss()]

// ✅ CORRECT: Tailwind before SvelteKit
plugins: [tailwindcss(), sveltekit()]
```

**Pitfall 2: Forgetting to remove PostCSS**
```bash
# Check for leftover PostCSS config
ls postcss.config.js
# If exists, delete it
rm postcss.config.js
```

**Pitfall 3: Using deprecated @apply heavily**
```css
/* ❌ v3 pattern (deprecated in v4) */
.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded;
}

/* ✅ v4 pattern - use utilities directly */
<button class="px-4 py-2 bg-blue-500 text-white rounded">
  Button
</button>
```

**Pitfall 4: Missing content paths**
```css
/* ❌ Missing component paths */
@source "src/routes/**/*.svelte";

/* ✅ Include all component locations */
@source "src/routes/**/*.svelte";
@source "src/lib/**/*.svelte";
@source "src/**/*.ts"; /* For JSDoc classes */
```

**Pitfall 5: Adapter incompatibility assumptions**
```js
// All official SvelteKit adapters support Tailwind v4:
// ✅ adapter-vercel
// ✅ adapter-cloudflare
// ✅ adapter-node
// ✅ adapter-static
// ✅ adapter-netlify

// Just ensure you're on latest versions
npm update @sveltejs/adapter-*
```

## Migration Decision Matrix

**Should you migrate to v4 now?**

| Factor | Migrate Now | Wait |
|--------|-------------|------|
| **Project stage** | Greenfield / Development | Production with tight deadlines |
| **Custom plugins** | None or simple utilities | Heavy reliance on complex plugins |
| **Team experience** | Comfortable with CSS | Prefers JS configuration |
| **Build time** | Want faster builds | Current build is acceptable |
| **Tailwind usage** | Utility-first approach | Heavy `@apply` usage |

**Decision rule:**
- **Migrate if:** Starting new project or in active development phase
- **Wait if:** Critical production deadline within 2 weeks or heavy custom plugin dependencies
- **Test first:** Always test in staging environment before production migration

## Performance Improvements in v4

**Build speed improvements:**
```bash
# Measure v3 build time
time npm run build

# After v4 migration
time npm run build

# Typical improvement: 20-40% faster builds
# Example: 45s → 27s for medium project
```

**Bundle size optimization:**
- Automatic dead code elimination
- Better tree-shaking
- More efficient CSS generation

**Development experience:**
- Faster HMR (Hot Module Replacement)
- Better error messages
- Improved Vite integration

**Production benefits:**
- Smaller CSS bundles
- Better caching with content-based hashing
- Improved browser compatibility

The migration to Tailwind v4 is straightforward for most SvelteKit projects. Focus on updating the build configuration first, then gradually migrate custom theme and utilities to CSS-based configuration. Always test in development before deploying to production.
