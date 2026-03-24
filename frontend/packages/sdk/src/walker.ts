import type { ComponentNode } from './types';

/**
 * Walks a component tree depth-first, calling the visitor for each node.
 * Useful for collecting all resourceTypes, finding specific components, etc.
 */
export function walkComponentTree(
  components: ComponentNode[],
  visitor: (node: ComponentNode, depth: number, parent?: ComponentNode) => void,
  depth = 0,
  parent?: ComponentNode
): void {
  for (const node of components) {
    visitor(node, depth, parent);
    if (node.children?.length) {
      walkComponentTree(node.children, visitor, depth + 1, node);
    }
  }
}

/**
 * Collect all unique resourceTypes used in a component tree.
 * Useful for code-splitting: only load renderers for types present on the page.
 */
export function collectResourceTypes(components: ComponentNode[]): Set<string> {
  const types = new Set<string>();
  walkComponentTree(components, (node) => {
    types.add(node.resourceType);
  });
  return types;
}

/**
 * Find a component in the tree by name (e.g., "hero", "main").
 */
export function findComponentByName(
  components: ComponentNode[],
  name: string
): ComponentNode | undefined {
  let found: ComponentNode | undefined;
  walkComponentTree(components, (node) => {
    if (!found && node.name === name) found = node;
  });
  return found;
}

/**
 * Find all components of a given resourceType.
 */
export function findComponentsByType(
  components: ComponentNode[],
  resourceType: string
): ComponentNode[] {
  const result: ComponentNode[] = [];
  walkComponentTree(components, (node) => {
    if (node.resourceType === resourceType) result.push(node);
  });
  return result;
}

