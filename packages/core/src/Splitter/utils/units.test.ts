import type { PanelData } from '../SplitterPanel.vue'
import { describe, expect, it } from 'vitest'
import { convertPanelConstraintsToPercent, hasPixelSizedPanel, recalculateLayoutForPixelPanels } from './units'

function createPanelData(overrides: Partial<PanelData> & { id: string }): PanelData {
  return {
    callbacks: {},
    constraints: {},
    idIsFromProps: true,
    order: undefined,
    ...overrides,
  }
}

describe('hasPixelSizedPanel', () => {
  it('should return false when no panels use px', () => {
    const panels = [
      createPanelData({ id: 'a', constraints: { sizeUnit: '%' } }),
      createPanelData({ id: 'b', constraints: {} }),
    ]
    expect(hasPixelSizedPanel(panels)).toBe(false)
  })

  it('should return true when at least one panel uses px', () => {
    const panels = [
      createPanelData({ id: 'a', constraints: { sizeUnit: '%' } }),
      createPanelData({ id: 'b', constraints: { sizeUnit: 'px' } }),
    ]
    expect(hasPixelSizedPanel(panels)).toBe(true)
  })
})

describe('convertPanelConstraintsToPercent', () => {
  it('should return constraints as-is for percent panels', () => {
    const panels = [
      createPanelData({
        id: 'a',
        constraints: { sizeUnit: '%', minSize: 10, maxSize: 80, defaultSize: 50 },
      }),
    ]
    const result = convertPanelConstraintsToPercent({ panelDataArray: panels, groupSizeInPixels: 1000 })
    expect(result).not.toBeNull()
    expect(result![0].minSize).toBe(10)
    expect(result![0].maxSize).toBe(80)
    expect(result![0].defaultSize).toBe(50)
    expect(result![0].sizeUnit).toBe('%')
  })

  it('should convert px constraints to percent', () => {
    const panels = [
      createPanelData({
        id: 'a',
        constraints: {
          sizeUnit: 'px',
          minSize: 200,
          maxSize: 400,
          defaultSize: 300,
          collapsedSize: 50,
          collapsible: true,
        },
      }),
    ]
    const result = convertPanelConstraintsToPercent({ panelDataArray: panels, groupSizeInPixels: 1000 })
    expect(result).not.toBeNull()
    expect(result![0].minSize).toBe(20) // 200/1000 * 100
    expect(result![0].maxSize).toBe(40) // 400/1000 * 100
    expect(result![0].defaultSize).toBe(30) // 300/1000 * 100
    expect(result![0].collapsedSize).toBe(5) // 50/1000 * 100
    expect(result![0].sizeUnit).toBe('%')
  })

  it('should return null when px panel exists but groupSize is null', () => {
    const panels = [
      createPanelData({ id: 'a', constraints: { sizeUnit: 'px', defaultSize: 200 } }),
    ]
    const result = convertPanelConstraintsToPercent({ panelDataArray: panels, groupSizeInPixels: null })
    expect(result).toBeNull()
  })

  it('should handle mixed percent and px panels', () => {
    const panels = [
      createPanelData({
        id: 'sidebar',
        constraints: { sizeUnit: 'px', defaultSize: 250, minSize: 150, maxSize: 350 },
      }),
      createPanelData({
        id: 'content',
        constraints: { sizeUnit: '%', minSize: 30 },
      }),
    ]
    const result = convertPanelConstraintsToPercent({ panelDataArray: panels, groupSizeInPixels: 1000 })
    expect(result).not.toBeNull()
    // px panel converted
    expect(result![0].defaultSize).toBe(25) // 250/1000 * 100
    expect(result![0].minSize).toBe(15) // 150/1000 * 100
    expect(result![0].maxSize).toBe(35) // 350/1000 * 100
    // % panel unchanged
    expect(result![1].minSize).toBe(30)
  })
})

describe('recalculateLayoutForPixelPanels', () => {
  it('should return null if no pixel panels exist', () => {
    const panels = [
      createPanelData({ id: 'a', constraints: { sizeUnit: '%' } }),
      createPanelData({ id: 'b', constraints: { sizeUnit: '%' } }),
    ]
    const result = recalculateLayoutForPixelPanels({
      layout: [50, 50],
      panelDataArray: panels,
      prevGroupSize: 1000,
      nextGroupSize: 800,
    })
    expect(result).toBeNull()
  })

  it('should maintain pixel panel size when group resizes', () => {
    const panels = [
      createPanelData({ id: 'sidebar', constraints: { sizeUnit: 'px' } }),
      createPanelData({ id: 'content', constraints: { sizeUnit: '%' } }),
    ]
    // Sidebar is 200px (20% of 1000), content is 80%
    const result = recalculateLayoutForPixelPanels({
      layout: [20, 80],
      panelDataArray: panels,
      prevGroupSize: 1000,
      nextGroupSize: 800,
    })
    expect(result).not.toBeNull()
    // 200px / 800px * 100 = 25%
    expect(result![0]).toBe(25)
    // Remaining percentage adjusted: 80 * (75/80) = 75
    expect(result![1]).toBe(75)
  })

  it('should return null for invalid group sizes', () => {
    const panels = [
      createPanelData({ id: 'a', constraints: { sizeUnit: 'px' } }),
      createPanelData({ id: 'b', constraints: { sizeUnit: '%' } }),
    ]

    expect(recalculateLayoutForPixelPanels({
      layout: [20, 80],
      panelDataArray: panels,
      prevGroupSize: null,
      nextGroupSize: 800,
    })).toBeNull()

    expect(recalculateLayoutForPixelPanels({
      layout: [20, 80],
      panelDataArray: panels,
      prevGroupSize: 1000,
      nextGroupSize: 0,
    })).toBeNull()
  })

  it('should handle multiple pixel panels', () => {
    const panels = [
      createPanelData({ id: 'left', constraints: { sizeUnit: 'px' } }),
      createPanelData({ id: 'center', constraints: { sizeUnit: '%' } }),
      createPanelData({ id: 'right', constraints: { sizeUnit: 'px' } }),
    ]
    // left=200px (20%), center=60%, right=200px (20%) at 1000px group
    const result = recalculateLayoutForPixelPanels({
      layout: [20, 60, 20],
      panelDataArray: panels,
      prevGroupSize: 1000,
      nextGroupSize: 800,
    })
    expect(result).not.toBeNull()
    // left: 200px / 800px * 100 = 25%
    expect(result![0]).toBe(25)
    // right: 200px / 800px * 100 = 25%
    expect(result![2]).toBe(25)
    // center gets remaining: 60 * (50 / 60) = 50
    expect(result![1]).toBe(50)
  })
})
