---
title: "Form Actions and Progressive Enhancement with Svelte 5 Runes"
version_anchors: ["SvelteKit@2.x", "Svelte@5.x"]
authored: true
origin: self
adapted_from:
  - "sveltejs/kit repository (form actions documentation)"
last_reviewed: 2025-10-28
summary: "Build progressively enhanced forms with SvelteKit actions and Svelte 5 runes, handling validation, optimistic UI, file uploads, and maintaining reactivity."
---

# Form Actions and Progressive Enhancement with Svelte 5 Runes

SvelteKit form actions provide server-side form processing with progressive enhancement. Integrating them with Svelte 5 runes requires understanding how `use:enhance` affects reactivity and state management.

## Form Actions Quick Review

Form actions run on the server and process form submissions without JavaScript.

**Basic form action:**
```ts
// src/routes/contact/+page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const message = data.get('message');

    if (!email || !message) {
      return fail(400, {
        error: 'Email and message are required',
        email,
        message
      });
    }

    // Process form (send email, save to DB, etc.)
    await sendEmail(email, message);

    return { success: true };
  }
} satisfies Actions;
```

**Basic form without JavaScript:**
```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  let { form } = $props();
</script>

<form method="POST">
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>

  {#if form?.error}
    <p class="text-red-500">{form.error}</p>
  {/if}

  {#if form?.success}
    <p class="text-green-500">Message sent!</p>
  {/if}

  <button type="submit">Send</button>
</form>
```

❌ **Wrong: Client-only form handling**
```svelte
<script>
  let email = $state('');

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch('/api/contact', { /* ... */ });
    // Doesn't work without JavaScript
  }
</script>

<form on:submit={handleSubmit}>
```

✅ **Right: Progressive enhancement with form actions**
```svelte
<script>
  let { form } = $props();
</script>

<form method="POST">
  <!-- Works without JavaScript -->
  <!-- Enhanced with JavaScript -->
</form>
```

## Progressive Enhancement with Runes

Use `use:enhance` to add client-side behavior while maintaining server-side functionality.

**Basic enhancement:**
```svelte
<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <input type="email" name="email" required />
  <button>Submit</button>

  {#if form?.error}
    <p>{form.error}</p>
  {/if}
</form>
```

**This provides:**
- No page reload on submit
- Loading state during submission
- Automatic form reset on success
- Error handling

❌ **Wrong: Lost rune state after submission**
```svelte
<script>
  let submitting = $state(false);
</script>

<form method="POST" use:enhance>
  <!-- submitting state reset after form submit -->
  <button disabled={submitting}>Submit</button>
</form>
```

✅ **Right: Custom enhance to preserve state**
```svelte
<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
  let submitting = $state(false);

  const handleSubmit = enhance(() => {
    submitting = true;
    return async ({ result, update }) => {
      submitting = false;
      await update();
    };
  });
</script>

<form method="POST" use:handleSubmit>
  <button disabled={submitting}>
    {submitting ? 'Sending...' : 'Submit'}
  </button>
</form>
```

## Handling use:enhance Reactivity

Custom enhance callbacks give full control over form behavior.

**Complete enhance pattern:**
```svelte
<script>
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';

  let { form } = $props();
  let submitting = $state(false);
  let success = $state(false);

  const handleEnhance = enhance(({ formElement, formData, action, cancel }) => {
    // Before submit
    submitting = true;
    success = false;

    return async ({ result, update }) => {
      // After submit
      submitting = false;

      if (result.type === 'success') {
        success = true;
        formElement.reset();

        // Refresh page data
        await invalidateAll();
      } else if (result.type === 'failure') {
        // Handle validation errors
      }

      // Update form prop with server response
      await update();
    };
  });
</script>

<form method="POST" use:handleEnhance>
  <input type="text" name="message" required />

  <button type="submit" disabled={submitting}>
    {submitting ? 'Sending...' : 'Send'}
  </button>

  {#if success}
    <p class="text-green-500">Success!</p>
  {/if}

  {#if form?.error}
    <p class="text-red-500">{form.error}</p>
  {/if}
</form>
```

**Enhance callback parameters:**
```ts
enhance((params) => {
  // Before submit
  params.formElement; // HTMLFormElement
  params.formData;    // FormData object
  params.action;      // Form action URL
  params.cancel();    // Abort submission

  return async (result) => {
    // After submit
    result.result.type;  // 'success' | 'failure' | 'redirect' | 'error'
    result.result.data;  // Data from action
    result.update();     // Update form prop
  };
});
```

**Conditional submission:**
```svelte
<script>
  import { enhance } from '$app/forms';

  const handleEnhance = enhance(({ formData, cancel }) => {
    const confirmed = confirm('Are you sure?');
    if (!confirmed) {
      cancel(); // Abort submission
      return;
    }

    // Add extra data
    formData.append('timestamp', Date.now().toString());

    return async ({ result, update }) => {
      await update();
    };
  });
</script>

<form method="POST" use:handleEnhance>
  <button>Delete</button>
</form>
```

## Optimistic UI Patterns

Update UI immediately while request processes in background.

**Optimistic updates:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { data } = $props();
  let items = $state(data.items);
  let optimisticItem = $state(null);

  const handleAdd = enhance(({ formData }) => {
    // Show item immediately
    const text = formData.get('text');
    optimisticItem = { id: 'temp', text, pending: true };

    return async ({ result, update }) => {
      if (result.type === 'success') {
        // Replace optimistic with real item
        items = [...items, result.data.item];
        optimisticItem = null;
      } else {
        // Remove optimistic on failure
        optimisticItem = null;
      }
      await update();
    };
  });
</script>

<form method="POST" action="?/add" use:handleAdd>
  <input name="text" required />
  <button>Add</button>
</form>

<ul>
  {#each items as item}
    <li>{item.text}</li>
  {/each}

  {#if optimisticItem}
    <li class="opacity-50">{optimisticItem.text} (saving...)</li>
  {/if}
</ul>
```

**Optimistic deletion:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { data } = $props();
  let items = $state(data.items);
  let deletingId = $state(null);

  const handleDelete = enhance(({ formData }) => {
    deletingId = formData.get('id');

    return async ({ result, update }) => {
      if (result.type === 'success') {
        // Remove from list
        items = items.filter(item => item.id !== deletingId);
      }
      deletingId = null;
      await update();
    };
  });
</script>

{#each items as item}
  <div class:opacity-50={deletingId === item.id}>
    {item.text}
    <form method="POST" action="?/delete" use:handleDelete>
      <input type="hidden" name="id" value={item.id} />
      <button disabled={deletingId === item.id}>Delete</button>
    </form>
  </div>
{/each}
```

❌ **Wrong: Not handling failures**
```svelte
<script>
  const handleAdd = enhance(({ formData }) => {
    // Add item optimistically
    items.push(newItem);
    // Never reverted on failure!
  });
</script>
```

✅ **Right: Revert on failure**
```svelte
<script>
  const handleAdd = enhance(({ formData }) => {
    const temp = newItem;
    items.push(temp);

    return async ({ result }) => {
      if (result.type !== 'success') {
        items = items.filter(i => i !== temp);
      }
    };
  });
</script>
```

## Validation Strategies

Combine client and server validation for best user experience.

**Server-side validation:**
```ts
// +page.server.ts
import { fail } from '@sveltejs/kit';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return fail(400, {
        errors,
        data // Return submitted data
      });
    }

    // Process valid data
    return { success: true };
  }
};
```

**Client-side validation with runes:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
  let errors = $state({});
  let touched = $state({});

  let email = $state('');
  let password = $state('');

  function validateEmail() {
    if (touched.email) {
      errors.email = email.includes('@')
        ? null
        : 'Invalid email';
    }
  }

  function validatePassword() {
    if (touched.password) {
      errors.password = password.length >= 8
        ? null
        : 'At least 8 characters';
    }
  }

  const handleSubmit = enhance(() => {
    return async ({ result, update }) => {
      if (result.type === 'failure') {
        errors = result.data.errors || {};
      }
      await update();
    };
  });
</script>

<form method="POST" use:handleSubmit>
  <div>
    <input
      type="email"
      name="email"
      bind:value={email}
      oninput={validateEmail}
      onfocus={() => touched.email = true}
      class:border-red-500={errors.email}
    />
    {#if errors.email}
      <p class="text-sm text-red-500">{errors.email}</p>
    {/if}
  </div>

  <div>
    <input
      type="password"
      name="password"
      bind:value={password}
      oninput={validatePassword}
      onfocus={() => touched.password = true}
      class:border-red-500={errors.password}
    />
    {#if errors.password}
      <p class="text-sm text-red-500">{errors.password}</p>
    {/if}
  </div>

  <button type="submit">Submit</button>
</form>
```

**Real-time validation with derived:**
```svelte
<script>
  let email = $state('');
  let password = $state('');

  let emailValid = $derived(
    email.length === 0 || email.includes('@')
  );

  let passwordValid = $derived(
    password.length === 0 || password.length >= 8
  );

  let formValid = $derived(
    emailValid && passwordValid && email && password
  );
</script>

<form method="POST">
  <input
    type="email"
    bind:value={email}
    class:border-green-500={emailValid && email}
    class:border-red-500={!emailValid && email}
  />

  <input
    type="password"
    bind:value={password}
    class:border-green-500={passwordValid && password}
    class:border-red-500={!passwordValid && password}
  />

  <button disabled={!formValid}>Submit</button>
</form>
```

## File Uploads with Styling

Handle file uploads with progress indicators and preview.

**Server-side file handling:**
```ts
// +page.server.ts
import { fail } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import path from 'path';

export const actions = {
  upload: async ({ request }) => {
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file || file.size === 0) {
      return fail(400, { error: 'No file uploaded' });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return fail(400, { error: 'Only images allowed' });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return fail(400, { error: 'File too large (max 5MB)' });
    }

    // Save file
    const filename = `${Date.now()}-${file.name}`;
    const filepath = path.join('static/uploads', filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return {
      success: true,
      filename,
      url: `/uploads/${filename}`
    };
  }
};
```

**Client-side file upload with preview:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
  let preview = $state(null);
  let uploading = $state(false);
  let progress = $state(0);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  const handleUpload = enhance(() => {
    uploading = true;
    progress = 0;

    // Simulate progress (real progress needs XMLHttpRequest)
    const interval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
    }, 100);

    return async ({ result, update }) => {
      clearInterval(interval);
      progress = 100;
      uploading = false;

      if (result.type === 'success') {
        preview = result.data.url;
      }

      await update();
    };
  });
</script>

<form
  method="POST"
  action="?/upload"
  enctype="multipart/form-data"
  use:handleUpload
  class="space-y-4"
>
  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
    {#if preview}
      <img
        src={preview}
        alt="Preview"
        class="mx-auto max-h-64 rounded"
      />
    {:else}
      <div class="text-center text-gray-500">
        <p>Click to select an image</p>
      </div>
    {/if}
  </div>

  <input
    type="file"
    name="file"
    accept="image/*"
    onchange={handleFileSelect}
    class="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-white hover:file:bg-blue-600"
  />

  {#if uploading}
    <div class="space-y-2">
      <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          class="h-full bg-blue-500 transition-all"
          style="width: {progress}%"
        ></div>
      </div>
      <p class="text-sm text-gray-600">Uploading... {progress}%</p>
    </div>
  {/if}

  {#if form?.error}
    <p class="text-sm text-red-500">{form.error}</p>
  {/if}

  {#if form?.success}
    <p class="text-sm text-green-500">Upload successful!</p>
  {/if}

  <button
    type="submit"
    disabled={uploading}
    class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
  >
    {uploading ? 'Uploading...' : 'Upload'}
  </button>
</form>
```

## Error Handling and Feedback

Provide clear feedback for all form states.

**Comprehensive error handling:**
```svelte
<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
  let submitting = $state(false);
  let showSuccess = $state(false);

  const handleSubmit = enhance(() => {
    submitting = true;
    showSuccess = false;

    return async ({ result, update }) => {
      submitting = false;

      if (result.type === 'success') {
        showSuccess = true;
        setTimeout(() => showSuccess = false, 3000);
      }

      await update();
    };
  });
</script>

<form method="POST" use:handleSubmit class="space-y-4">
  <!-- Form fields -->

  <!-- Field-level errors -->
  {#if form?.errors?.email}
    <p class="text-sm text-red-500">{form.errors.email}</p>
  {/if}

  <!-- Form-level error -->
  {#if form?.error}
    <div class="rounded border border-red-500 bg-red-50 p-4">
      <p class="text-sm text-red-700">{form.error}</p>
    </div>
  {/if}

  <!-- Success message -->
  {#if showSuccess}
    <div class="rounded border border-green-500 bg-green-50 p-4">
      <p class="text-sm text-green-700">Form submitted successfully!</p>
    </div>
  {/if}

  <!-- Loading state -->
  <button
    type="submit"
    disabled={submitting}
    class="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {#if submitting}
      <span class="inline-block animate-spin">⏳</span>
      Submitting...
    {:else}
      Submit
    {/if}
  </button>
</form>
```

## TypeScript for Forms

Type form data and actions properly.

**Action types:**
```ts
// +page.server.ts
import type { Actions } from './$types';

type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const formData: ContactFormData = {
      name: data.get('name') as string,
      email: data.get('email') as string,
      message: data.get('message') as string
    };

    // Type-safe processing
    return { success: true };
  }
} satisfies Actions;
```

**Form prop types:**
```svelte
<script lang="ts">
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  // form is properly typed
  if (form?.error) {
    // TypeScript knows form.error exists
  }
</script>
```

## Common Form Pitfalls

**Pitfall 1: Lost form data on error**

❌ **Wrong:**
```ts
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    if (invalid) {
      return fail(400, { error: 'Invalid' });
      // User data lost!
    }
  }
};
```

✅ **Right:**
```ts
export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const formData = Object.fromEntries(data);

    if (invalid) {
      return fail(400, {
        error: 'Invalid',
        data: formData // Return submitted data
      });
    }
  }
};
```

**Pitfall 2: Multiple forms on same page**

❌ **Wrong: Unnamed actions**
```svelte
<form method="POST" use:enhance>...</form>
<form method="POST" use:enhance>...</form>
```

✅ **Right: Named actions**
```svelte
<form method="POST" action="?/create" use:enhance>...</form>
<form method="POST" action="?/delete" use:enhance>...</form>
```

**Checklist for forms:**
- [ ] Form works without JavaScript
- [ ] Loading state visible during submission
- [ ] Errors displayed clearly
- [ ] Success feedback shown
- [ ] Form data preserved on error
- [ ] Validation on both client and server
- [ ] File uploads handle size/type validation
- [ ] TypeScript types for actions and data

**Next steps:**
- Style forms in `styling-with-tailwind.md`
- Handle validation patterns in `best-practices.md`
- Deploy forms in `deployment-guide.md`
