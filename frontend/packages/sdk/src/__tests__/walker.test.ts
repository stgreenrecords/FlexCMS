import { describe, it, expect, vi } from 'vitest';
import {
  walkComponentTree,
  collectResourceTypes,
  findComponentByName,
  findComponentsByType,
} from '../walker';
import type { ComponentNode } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function node(name: string, resourceType: string, children?: ComponentNode[]): ComponentNode {
  return { name, resourceType, data: {}, children };
}

/**
 * Tree shape:
 *   root (myapp/page)
 *   ├── hero (myapp/hero)
 *   │   └── cta (myapp/button)
 *   └── text (myapp/rich-text)
 */
function makeTree(): ComponentNode[] {
  return [
    node('root', 'myapp/page', [
      node('hero', 'myapp/hero', [
        node('cta', 'myapp/button'),
      ]),
      node('text', 'myapp/rich-text'),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// walkComponentTree
// ---------------------------------------------------------------------------

describe('walkComponentTree', () => {
  it('visits all nodes depth-first', () => {
    const visited: string[] = [];
    walkComponentTree(makeTree(), (n) => visited.push(n.name));
    expect(visited).toEqual(['root', 'hero', 'cta', 'text']);
  });

  it('passes correct depth to visitor', () => {
    const depths: number[] = [];
    walkComponentTree(makeTree(), (_, depth) => depths.push(depth));
    expect(depths).toEqual([0, 1, 2, 1]);
  });

  it('passes correct parent to visitor', () => {
    const parents: (string | undefined)[] = [];
    walkComponentTree(makeTree(), (_, __, parent) => parents.push(parent?.name));
    expect(parents).toEqual([undefined, 'root', 'hero', 'root']);
  });

  it('handles empty array without calling visitor', () => {
    const visitor = vi.fn();
    walkComponentTree([], visitor);
    expect(visitor).not.toHaveBeenCalled();
  });

  it('handles nodes with no children', () => {
    const flat: ComponentNode[] = [node('a', 'x'), node('b', 'y')];
    const visited: string[] = [];
    walkComponentTree(flat, (n) => visited.push(n.name));
    expect(visited).toEqual(['a', 'b']);
  });

  it('handles deeply nested tree', () => {
    const deep: ComponentNode[] = [
      node('l1', 'a', [
        node('l2', 'b', [
          node('l3', 'c', [
            node('l4', 'd'),
          ]),
        ]),
      ]),
    ];
    const depths: number[] = [];
    walkComponentTree(deep, (_, depth) => depths.push(depth));
    expect(depths).toEqual([0, 1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// collectResourceTypes
// ---------------------------------------------------------------------------

describe('collectResourceTypes', () => {
  it('returns all unique resource types', () => {
    const types = collectResourceTypes(makeTree());
    expect(types).toEqual(
      new Set(['myapp/page', 'myapp/hero', 'myapp/button', 'myapp/rich-text'])
    );
  });

  it('deduplicates repeated resource types', () => {
    const tree: ComponentNode[] = [
      node('a', 'myapp/hero'),
      node('b', 'myapp/hero'),
      node('c', 'myapp/text'),
    ];
    const types = collectResourceTypes(tree);
    expect(types.size).toBe(2);
    expect(types).toContain('myapp/hero');
    expect(types).toContain('myapp/text');
  });

  it('returns empty set for empty array', () => {
    expect(collectResourceTypes([])).toEqual(new Set());
  });
});

// ---------------------------------------------------------------------------
// findComponentByName
// ---------------------------------------------------------------------------

describe('findComponentByName', () => {
  it('finds the first node matching the name', () => {
    const found = findComponentByName(makeTree(), 'hero');
    expect(found).toBeDefined();
    expect(found?.resourceType).toBe('myapp/hero');
  });

  it('finds deeply nested nodes', () => {
    const found = findComponentByName(makeTree(), 'cta');
    expect(found?.name).toBe('cta');
    expect(found?.resourceType).toBe('myapp/button');
  });

  it('returns undefined when name not found', () => {
    expect(findComponentByName(makeTree(), 'nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty tree', () => {
    expect(findComponentByName([], 'hero')).toBeUndefined();
  });

  it('returns the first match (not all matches)', () => {
    const tree: ComponentNode[] = [
      node('dup', 'myapp/a'),
      node('dup', 'myapp/b'),
    ];
    const found = findComponentByName(tree, 'dup');
    expect(found?.resourceType).toBe('myapp/a'); // first match
  });
});

// ---------------------------------------------------------------------------
// findComponentsByType
// ---------------------------------------------------------------------------

describe('findComponentsByType', () => {
  it('finds all nodes with matching resourceType', () => {
    const tree: ComponentNode[] = [
      node('hero1', 'myapp/hero'),
      node('text', 'myapp/rich-text', [
        node('hero2', 'myapp/hero'),
      ]),
    ];
    const results = findComponentsByType(tree, 'myapp/hero');
    expect(results).toHaveLength(2);
    expect(results.map((n) => n.name)).toEqual(['hero1', 'hero2']);
  });

  it('returns empty array when no match', () => {
    expect(findComponentsByType(makeTree(), 'myapp/unknown')).toEqual([]);
  });

  it('returns empty array for empty tree', () => {
    expect(findComponentsByType([], 'myapp/hero')).toEqual([]);
  });

  it('finds nodes at any depth', () => {
    const results = findComponentsByType(makeTree(), 'myapp/button');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('cta');
  });
});
