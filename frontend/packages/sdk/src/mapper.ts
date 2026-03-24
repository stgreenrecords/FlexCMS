/**
 * ComponentMapper — maps resourceType strings to framework-specific renderers.
 *
 * This is framework-agnostic: TRenderer can be a React component, a Vue component,
 * an Angular component class, or any other type. Each adapter package provides
 * its own typed wrapper around this mapper.
 *
 * @example
 * ```ts
 * // React usage
 * const mapper = new ComponentMapper<React.ComponentType<{ data: any }>>();
 * mapper.register('myapp/hero-banner', HeroBanner);
 * mapper.register('flexcms/rich-text', RichText);
 *
 * // At render time
 * const Renderer = mapper.resolve(node.resourceType);
 * if (Renderer) return <Renderer data={node.data} />;
 * ```
 */
export class ComponentMapper<TRenderer = unknown> {
  private registry = new Map<string, TRenderer>();
  private fallback: TRenderer | undefined;

  /** Register a renderer for a component resourceType */
  register(resourceType: string, renderer: TRenderer): this {
    this.registry.set(resourceType, renderer);
    return this;
  }

  /** Register multiple renderers at once */
  registerAll(entries: Record<string, TRenderer>): this {
    for (const [type, renderer] of Object.entries(entries)) {
      this.registry.set(type, renderer);
    }
    return this;
  }

  /** Set a fallback renderer for unregistered component types */
  setFallback(renderer: TRenderer): this {
    this.fallback = renderer;
    return this;
  }

  /** Resolve the renderer for a resourceType */
  resolve(resourceType: string): TRenderer | undefined {
    return this.registry.get(resourceType) ?? this.fallback;
  }

  /** Check if a renderer is registered for a resourceType */
  has(resourceType: string): boolean {
    return this.registry.has(resourceType);
  }

  /** Get all registered mappings */
  getAll(): ReadonlyMap<string, TRenderer> {
    return this.registry;
  }

  /** Get all registered resourceTypes */
  getResourceTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

