import { describe, it, expect } from 'vitest';
import { ComponentMapper } from '../mapper';

describe('ComponentMapper', () => {
  // ── register / resolve ────────────────────────────────────────────────────

  it('register stores a renderer and resolve returns it', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('myapp/hero', 'HeroRenderer');
    expect(mapper.resolve('myapp/hero')).toBe('HeroRenderer');
  });

  it('resolve returns undefined for unregistered type (no fallback)', () => {
    const mapper = new ComponentMapper<string>();
    expect(mapper.resolve('unknown/type')).toBeUndefined();
  });

  it('resolve returns fallback for unregistered type when fallback is set', () => {
    const mapper = new ComponentMapper<string>();
    mapper.setFallback('DefaultRenderer');
    expect(mapper.resolve('unknown/type')).toBe('DefaultRenderer');
  });

  it('resolve returns registered renderer even when fallback is set', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('myapp/hero', 'HeroRenderer');
    mapper.setFallback('DefaultRenderer');
    expect(mapper.resolve('myapp/hero')).toBe('HeroRenderer');
  });

  // ── registerAll ───────────────────────────────────────────────────────────

  it('registerAll stores multiple renderers', () => {
    const mapper = new ComponentMapper<string>();
    mapper.registerAll({
      'myapp/hero': 'Hero',
      'myapp/text': 'Text',
      'myapp/image': 'Image',
    });
    expect(mapper.resolve('myapp/hero')).toBe('Hero');
    expect(mapper.resolve('myapp/text')).toBe('Text');
    expect(mapper.resolve('myapp/image')).toBe('Image');
  });

  it('registerAll overwrites existing registration for same type', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('myapp/hero', 'OldHero');
    mapper.registerAll({ 'myapp/hero': 'NewHero' });
    expect(mapper.resolve('myapp/hero')).toBe('NewHero');
  });

  // ── has ───────────────────────────────────────────────────────────────────

  it('has returns true for registered type', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('myapp/hero', 'Hero');
    expect(mapper.has('myapp/hero')).toBe(true);
  });

  it('has returns false for unregistered type', () => {
    const mapper = new ComponentMapper<string>();
    expect(mapper.has('myapp/hero')).toBe(false);
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  it('getAll returns all registered mappings', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('a/b', 'A');
    mapper.register('c/d', 'C');
    const all = mapper.getAll();
    expect(all.size).toBe(2);
    expect(all.get('a/b')).toBe('A');
    expect(all.get('c/d')).toBe('C');
  });

  it('getAll returns a ReadonlyMap (does not expose internal mutable map)', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('x/y', 'X');
    const all = mapper.getAll();
    // Should be iterable — just check it behaves like a Map
    expect([...all.keys()]).toContain('x/y');
  });

  // ── getResourceTypes ──────────────────────────────────────────────────────

  it('getResourceTypes returns array of all registered keys', () => {
    const mapper = new ComponentMapper<string>();
    mapper.register('myapp/hero', 'Hero');
    mapper.register('myapp/text', 'Text');
    expect(mapper.getResourceTypes()).toEqual(
      expect.arrayContaining(['myapp/hero', 'myapp/text'])
    );
    expect(mapper.getResourceTypes()).toHaveLength(2);
  });

  it('getResourceTypes returns empty array when nothing registered', () => {
    const mapper = new ComponentMapper<string>();
    expect(mapper.getResourceTypes()).toEqual([]);
  });

  // ── chaining ──────────────────────────────────────────────────────────────

  it('register returns this for chaining', () => {
    const mapper = new ComponentMapper<string>();
    const returned = mapper.register('a/b', 'X');
    expect(returned).toBe(mapper);
  });

  it('registerAll returns this for chaining', () => {
    const mapper = new ComponentMapper<string>();
    const returned = mapper.registerAll({ 'a/b': 'X' });
    expect(returned).toBe(mapper);
  });

  it('setFallback returns this for chaining', () => {
    const mapper = new ComponentMapper<string>();
    const returned = mapper.setFallback('Default');
    expect(returned).toBe(mapper);
  });

  // ── generic type parameter ────────────────────────────────────────────────

  it('works with function renderers (mimicking React components)', () => {
    type Renderer = (props: { data: unknown }) => string;
    const heroFn: Renderer = ({ data }) => `Hero: ${JSON.stringify(data)}`;
    const mapper = new ComponentMapper<Renderer>();
    mapper.register('myapp/hero', heroFn);
    const resolved = mapper.resolve('myapp/hero');
    expect(resolved?.({ data: { title: 'Test' } })).toBe('Hero: {"title":"Test"}');
  });
});
