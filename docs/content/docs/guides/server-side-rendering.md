---
title: Server side rendering
description: Reka UI can be rendered on the server.
---

# Server side rendering

<Description>
Reka UI can be rendered on the server.
</Description>

## Overview

Server side rendering or `SSR`, is a technique used to render components to HTML on the server, as opposed to rendering them only on the client.

Static rendering is another similar approach. Instead it pre-renders pages to HTML at build time rather than on each request.

You should be able to use all of our primitives with both approaches, for example with [Nuxt.js](https://nuxt.com/).

## Stable ids

Reka UI generates the `id` attributes that link its parts together (`aria-controls`, `aria-labelledby`, …), and these must be identical in the server render and the client render. They come from Vue's [`useId`](https://vuejs.org/api/composition-api-helpers.html#useid), which is stable across both, so no setup is needed. Reka UI requires Vue 3.5.22 or later.

If you render more than one Vue app instance on the same page, give each one a distinct [`app.config.idPrefix`](https://vuejs.org/api/application.html#app-config-idprefix) so their ids don't collide.

## Nuxt

Reka UI offers a [Nuxt module](/docs/overview/installation.html#nuxt-modules) that supports auto importing components.

A prerendered page and the hydrating client can end up with different Vue app id prefixes, which shows up as an `id` hydration mismatch. If you run into this, pass Nuxt's [`useId`](https://nuxt.com/docs/api/composables/use-id) to `ConfigProvider`, and every id Reka UI generates will come from it instead. See the [ConfigProvider guide](/docs/utilities/config-provider.html#hydration-issue).
