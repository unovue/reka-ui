import { describe, expect, it } from 'vitest'

import { flattenFilter } from './utils'

describe('Tree', () => {
    describe('flattenFilter', () => {
        it('should return the filtered items and expanded keys', () => {
            const items = [
                {
                    name: 'a',
                    children: [
                        {
                            name: 'b',
                            children: [{ name: 'c' }],
                        },
                        {
                            name: 'd',
                            children: [],
                        },
                    ],
                },
                {
                    name: 'e',
                    children: [{ name: 'f' }],
                },
            ]

            const predicate = (item: any) => ['c', 'e'].includes(item.name)
            const getKey = (item: any) => item.name

            const result = flattenFilter(items, {
                predicate,
                getKey,
                getChildren: (item: any) => item.children,
                forceVisible: [],
            })

            const names = result.result.map((item) => item._id)
            expect(names).toEqual(['a', 'b', 'c', 'e'])

            expect(result.expanded.sort()).toEqual(['a', 'b'])

        })
    })
})