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

## ID generation

Reka UI requires Vue 3.5 or later and uses Vue's native `useId` to generate IDs that are stable between server and client renders.

If your framework provides its own SSR-stable ID source, such as Nuxt's `useId`, you can supply it through `ConfigProvider`. The configured generator takes precedence over Vue's native `useId`.

To provide a custom `useId` implementation, please follow this [guide](/docs/utilities/config-provider.html#hydration-issue).
