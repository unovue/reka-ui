import type { PanelData } from '../SplitterPanel.vue'
import { describe, expect, it, vi } from 'vitest'
import { callPanelCallbacks } from './callPanelCallbacks'

function createPanelData(overrides: Partial<PanelData> & { id: string }): PanelData {
  return {
    callbacks: {},
    constraints: {},
    idIsFromProps: true,
    order: undefined,
    ...overrides,
  }
}

describe('callPanelCallbacks', () => {
  describe('onResize', () => {
    it('should call onResize with percentage values for percent-based panels', () => {
      const onResize = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onResize },
          constraints: { sizeUnit: '%' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      callPanelCallbacks(panels, [50], sizeMap, 1000)

      expect(onResize).toHaveBeenCalledWith(50, undefined)
      expect(sizeMap['panel-1']).toBe(50)
    })

    it('should convert percentage to pixels for px-based panels', () => {
      const onResize = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onResize },
          constraints: { sizeUnit: 'px' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      // 20% of 1000px = 200px
      callPanelCallbacks(panels, [20], sizeMap, 1000)

      expect(onResize).toHaveBeenCalledWith(200, undefined)
      expect(sizeMap['panel-1']).toBe(200)
    })

    it('should pass previous size in native units', () => {
      const onResize = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onResize },
          constraints: { sizeUnit: 'px' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      callPanelCallbacks(panels, [20], sizeMap, 1000) // 200px
      callPanelCallbacks(panels, [25], sizeMap, 1000) // 250px

      expect(onResize).toHaveBeenCalledTimes(2)
      expect(onResize).toHaveBeenLastCalledWith(250, 200)
    })

    it('should fall back to percentage when groupSizeInPixels is not available', () => {
      const onResize = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onResize },
          constraints: { sizeUnit: 'px' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      callPanelCallbacks(panels, [20], sizeMap, null)

      expect(onResize).toHaveBeenCalledWith(20, undefined)
    })

    it('should handle mixed percent and pixel panels', () => {
      const onResizePercent = vi.fn()
      const onResizePx = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-percent',
          callbacks: { onResize: onResizePercent },
          constraints: { sizeUnit: '%' },
        }),
        createPanelData({
          id: 'panel-px',
          callbacks: { onResize: onResizePx },
          constraints: { sizeUnit: 'px' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      // 70% stays as 70, 30% of 1000px = 300px
      callPanelCallbacks(panels, [70, 30], sizeMap, 1000)

      expect(onResizePercent).toHaveBeenCalledWith(70, undefined)
      expect(onResizePx).toHaveBeenCalledWith(300, undefined)
    })

    it('should not call onResize if size has not changed', () => {
      const onResize = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onResize },
          constraints: { sizeUnit: 'px' },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      callPanelCallbacks(panels, [20], sizeMap, 1000) // 200px
      callPanelCallbacks(panels, [20], sizeMap, 1000) // 200px again

      expect(onResize).toHaveBeenCalledTimes(1)
    })
  })

  describe('onCollapse / onExpand for pixel-sized panels', () => {
    it('should call onCollapse when pixel panel reaches collapsedSize', () => {
      const onCollapse = vi.fn()
      const onExpand = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onCollapse, onExpand },
          constraints: {
            sizeUnit: 'px',
            collapsible: true,
            collapsedSize: 48,
          },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      // First call: panel starts at 200px (20% of 1000)
      callPanelCallbacks(panels, [20], sizeMap, 1000)
      expect(onCollapse).not.toHaveBeenCalled()
      expect(onExpand).toHaveBeenCalledTimes(1) // expanded from undefined

      onExpand.mockClear()

      // Second call: panel collapses to 48px (4.8% of 1000)
      callPanelCallbacks(panels, [4.8], sizeMap, 1000)
      expect(onCollapse).toHaveBeenCalledTimes(1)
      expect(onExpand).not.toHaveBeenCalled()
    })

    it('should call onExpand when pixel panel expands from collapsedSize', () => {
      const onCollapse = vi.fn()
      const onExpand = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onCollapse, onExpand },
          constraints: {
            sizeUnit: 'px',
            collapsible: true,
            collapsedSize: 48,
          },
        }),
      ]
      // Start already collapsed at 48px
      const sizeMap: Record<string, number> = { 'panel-1': 48 }

      // Panel expands to 200px (20% of 1000)
      callPanelCallbacks(panels, [20], sizeMap, 1000)
      expect(onExpand).toHaveBeenCalledTimes(1)
      expect(onCollapse).not.toHaveBeenCalled()
    })

    it('should not fire collapse/expand for non-collapsible panels', () => {
      const onCollapse = vi.fn()
      const onExpand = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onCollapse, onExpand },
          constraints: {
            sizeUnit: 'px',
            collapsible: false,
            collapsedSize: 48,
          },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      callPanelCallbacks(panels, [4.8], sizeMap, 1000) // 48px = collapsedSize
      expect(onCollapse).not.toHaveBeenCalled()
      expect(onExpand).not.toHaveBeenCalled()
    })
  })

  describe('onCollapse / onExpand for percent-based panels', () => {
    it('should still work for percentage panels', () => {
      const onCollapse = vi.fn()
      const onExpand = vi.fn()
      const panels: PanelData[] = [
        createPanelData({
          id: 'panel-1',
          callbacks: { onCollapse, onExpand },
          constraints: {
            sizeUnit: '%',
            collapsible: true,
            collapsedSize: 5,
          },
        }),
      ]
      const sizeMap: Record<string, number> = {}

      // Start expanded
      callPanelCallbacks(panels, [30], sizeMap, 1000)
      expect(onExpand).toHaveBeenCalledTimes(1)

      onExpand.mockClear()

      // Collapse to 5%
      callPanelCallbacks(panels, [5], sizeMap, 1000)
      expect(onCollapse).toHaveBeenCalledTimes(1)
      expect(onExpand).not.toHaveBeenCalled()

      onCollapse.mockClear()

      // Expand from 5%
      callPanelCallbacks(panels, [25], sizeMap, 1000)
      expect(onExpand).toHaveBeenCalledTimes(1)
      expect(onCollapse).not.toHaveBeenCalled()
    })
  })
})
