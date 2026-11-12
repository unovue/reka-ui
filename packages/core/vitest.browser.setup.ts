import { enableAutoUnmount } from '@vue/test-utils'
import { afterEach } from 'vitest'

// Unmounting also removes teleported content, so the body needs no manual reset.
enableAutoUnmount(afterEach)
