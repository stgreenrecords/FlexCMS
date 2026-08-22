/**
 * FlexCMS Selenium E2E — contract-driven authoring model (REB-19).
 *
 * Single source of truth for turning the generated component contracts into the
 * field-type-aware model the editor suites drive. REB-19 exercises a
 * representative slice of it; REB-26 reuses the exact same helpers to walk every
 * active component without duplicating any knowledge of field types.
 *
 * Nothing in this module touches Selenium — it is pure data, so it can also be
 * used from generators, reporters, and matrix documentation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const CONTRACTS_RELATIVE_PATH = path.join('Design', 'tut-usa', 'generated', 'component-contracts.json');

/**
 * Property keys the admin editor deliberately hides. Mirrors the filter in
 * `frontend/apps/admin/src/app/editor/page.tsx` -> `schemaToFields`.
 */
export const EDITOR_HIDDEN_KEYS = ['children'] as const;
export const TEMPLATE_DETACHED_FLAG = 'flexcmsTemplateDetached';

/** The control the admin editor renders for a field. */
export type EditorControl = 'text' | 'textarea' | 'number' | 'toggle' | 'select';

/** What the field means in content terms, independent of the control used. */
export type FieldSemantics = 'scalar' | 'richtext' | 'asset' | 'reference' | 'list' | 'object';

export interface ComponentContractField {
  name: string;
  type: string;
  format: string | null;
  enum: string[];
  isAsset: boolean;
  isReference: boolean;
  isRichText: boolean;
}

export interface ComponentContract {
  name: string;
  title: string;
  resourceType: string;
  groupName: string;
  index: number;
  active: boolean;
  isContainer: boolean;
  source: string;
  fields: ComponentContractField[];
  dataSchema: Record<string, unknown>;
}

/** A single field paired with everything a suite needs in order to author it. */
export interface AuthorableField {
  field: ComponentContractField;
  /** Property key, e.g. `backgroundImage`. */
  key: string;
  /** Control the editor renders for this field. */
  control: EditorControl;
  /** Content meaning of the field. */
  semantics: FieldSemantics;
  /** `data-testid` of the field wrapper. */
  fieldTestId: string;
  /**
   * `data-testid` of the input, matching `toTestId` in the admin editor:
   * lower-cased with every non-alphanumeric run collapsed to a single dash.
   */
  inputTestId: string;
  /**
   * True when the editor renders a control that cannot express the field's real
   * shape — arrays, objects, and asset references all fall back to a plain text
   * input. Suites use this to route to API-level verification and to report
   * editor capability blockers instead of silently asserting less.
   */
  isLossyInEditor: boolean;
}

let cachedContracts: ComponentContract[] | undefined;

/** Walks up from this module until the generated contracts are found. */
export function resolveRepoRoot(startDir: string = __dirname): string {
  let current = startDir;
  for (let depth = 0; depth < 12; depth += 1) {
    if (fs.existsSync(path.join(current, CONTRACTS_RELATIVE_PATH))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    `Could not locate ${CONTRACTS_RELATIVE_PATH} by walking up from ${startDir}. ` +
      'Run the suite from inside the repository working tree.',
  );
}

export function componentContractsPath(): string {
  return path.join(resolveRepoRoot(), CONTRACTS_RELATIVE_PATH);
}

export function loadComponentContracts(): ComponentContract[] {
  if (!cachedContracts) {
    const raw = fs.readFileSync(componentContractsPath(), 'utf8');
    const parsed = JSON.parse(raw) as ComponentContract[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('component-contracts.json did not contain any component contracts.');
    }
    cachedContracts = parsed;
  }
  return cachedContracts;
}

export function activeComponentContracts(): ComponentContract[] {
  return loadComponentContracts().filter((contract) => contract.active);
}

export function componentContractByResourceType(resourceType: string): ComponentContract {
  const found = activeComponentContracts().find((contract) => contract.resourceType === resourceType);
  if (!found) throw new Error(`No active component contract for resourceType ${resourceType}`);
  return found;
}

/** Every active group name, sorted, as used for matrix rows. */
export function componentGroupNames(): string[] {
  return [...new Set(activeComponentContracts().map((contract) => contract.groupName))].sort();
}

export function componentsInGroup(groupName: string): ComponentContract[] {
  return activeComponentContracts().filter((contract) => contract.groupName === groupName);
}

/**
 * Mirrors `toTestId` in `frontend/apps/admin/src/app/editor/page.tsx`. Kept
 * deliberately identical — if the editor changes its slug rules, this is the one
 * place the suites need to follow.
 */
export function toEditorTestId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Mirrors the JSON Schema -> control mapping in the admin editor's
 * `schemaToFields`. Arrays, objects, and asset strings all currently land on a
 * plain text control; `fieldSemantics` records what they really are.
 */
export function editorControlFor(field: ComponentContractField): EditorControl {
  if (field.enum && field.enum.length > 0) return 'select';
  if (field.type === 'boolean') return 'toggle';
  if (field.type === 'number' || field.type === 'integer') return 'number';

  if (field.type === 'string') {
    const key = field.name.toLowerCase();
    const isTextarea =
      field.format === 'textarea' ||
      key.includes('description') ||
      key.includes('content') ||
      key.includes('body');
    if (isTextarea) return 'textarea';
  }

  return 'text';
}

export function fieldSemantics(field: ComponentContractField): FieldSemantics {
  if (field.isAsset) return 'asset';
  if (field.isRichText) return 'richtext';
  if (field.isReference) return 'reference';
  if (field.type === 'array') return 'list';
  if (field.type === 'object') return 'object';
  return 'scalar';
}

function isEditorVisibleKey(key: string): boolean {
  if (key.startsWith('_')) return false;
  if (key === TEMPLATE_DETACHED_FLAG) return false;
  return !(EDITOR_HIDDEN_KEYS as readonly string[]).includes(key);
}

/** The fields the admin editor actually renders for a component. */
export function authorableFields(contract: ComponentContract): AuthorableField[] {
  return contract.fields
    .filter((field) => isEditorVisibleKey(field.name))
    .map((field) => {
      const control = editorControlFor(field);
      const semantics = fieldSemantics(field);
      const fieldTestId = `editor-property-${toEditorTestId(field.name)}`;
      return {
        field,
        key: field.name,
        control,
        semantics,
        fieldTestId,
        inputTestId: `${fieldTestId}-input`,
        isLossyInEditor: semantics === 'list' || semantics === 'object' || semantics === 'asset',
      };
    });
}

export function authorableFieldsBySemantics(
  contract: ComponentContract,
  semantics: FieldSemantics,
): AuthorableField[] {
  return authorableFields(contract).filter((entry) => entry.semantics === semantics);
}

export function authorableFieldsByControl(
  contract: ComponentContract,
  control: EditorControl,
): AuthorableField[] {
  return authorableFields(contract).filter((entry) => entry.control === control);
}

/**
 * Deterministic sample value for a field, tagged with the run marker so any
 * value can be traced from the editor through the author API, the headless JSON,
 * and the rendered page.
 */
export function authoringValueFor(entry: AuthorableField, marker: string): unknown {
  const { field, control, semantics } = entry;

  if (control === 'toggle') return true;
  if (control === 'number') return 42;
  if (control === 'select') return field.enum[0] ?? marker;

  switch (semantics) {
    case 'asset':
      return `/images/${marker}.jpg`;
    case 'reference':
      return `/tut-usa/home?ref=${marker}`;
    case 'list':
      return [{ title: `${marker} item`, url: `/tut-usa/home?item=${marker}` }];
    case 'object':
      return { label: `${marker} label`, url: `/tut-usa/home?obj=${marker}` };
    case 'richtext':
      return `<p>${marker} rich text body</p>`;
    default:
      return `${field.name} ${marker}`;
  }
}

/**
 * Picks one high-value representative per group for REB-19's foundation run.
 *
 * "High value" is deterministic and contract-driven rather than hand-picked:
 * prefer a non-container component carrying both an asset field and a plain text
 * field (so a single component can prove both the asset and the text round
 * trip), then fall back to the widest field surface, then to contract index so
 * the choice is stable across runs.
 */
export function groupRepresentatives(): ComponentContract[] {
  return componentGroupNames().map((groupName) => {
    const candidates = componentsInGroup(groupName);
    const scored = candidates
      .map((contract) => {
        const fields = authorableFields(contract);
        const hasAsset = fields.some((entry) => entry.semantics === 'asset');
        const hasText = fields.some((entry) => entry.control === 'text' && entry.semantics === 'scalar');
        const score =
          (hasAsset ? 100 : 0) + (hasText ? 50 : 0) + (contract.isContainer ? -10 : 0) + fields.length;
        return { contract, score };
      })
      .sort((a, b) => b.score - a.score || a.contract.index - b.contract.index);

    const winner = scored[0];
    if (!winner) throw new Error(`Component group "${groupName}" has no active components.`);
    return winner.contract;
  });
}

/** Stable node name for a component instance created by a suite. */
export function contractNodeName(contract: ComponentContract): string {
  return toEditorTestId(contract.name);
}

// ── REB-26: exhaustive sweep helpers ──────────────────────────────────────────

/**
 * Fields the editor can author *without* losing the contracted shape, i.e. every
 * field except the list/object/asset ones that fall back to a plain text input
 * (REB-19 blocker B-1). A UI edit is only asserted as correct persistence for
 * these; the rest are verified through the author API instead.
 */
export function uiEditableFields(contract: ComponentContract): AuthorableField[] {
  return authorableFields(contract).filter((entry) => !entry.isLossyInEditor);
}

/** Fields whose real shape the editor cannot express, so the API owns them. */
export function apiOnlyFields(contract: ComponentContract): AuthorableField[] {
  return authorableFields(contract).filter((entry) => entry.isLossyInEditor);
}

/**
 * The field REB-26 edits through the UI for a component.
 *
 * Preference order is deterministic and value-driven: a free-text scalar proves
 * the most (arbitrary value in, same value out through every layer), then a
 * textarea, then a number, then a toggle, then a select — the last two can only
 * be flipped/chosen, not set to an arbitrary marker. Ties break on the contract's
 * own field order, so the choice is stable across runs.
 */
export function primaryEditableField(contract: ComponentContract): AuthorableField | undefined {
  const rank = (entry: AuthorableField): number => {
    if (entry.control === 'text' && entry.semantics === 'scalar') return 0;
    if (entry.control === 'text' && entry.semantics === 'richtext') return 1;
    if (entry.control === 'textarea') return 2;
    if (entry.control === 'text') return 3;
    if (entry.control === 'number') return 4;
    if (entry.control === 'toggle') return 5;
    return 6;
  };

  const candidates = uiEditableFields(contract);
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((a, b) => rank(a) - rank(b))[0];
}

/**
 * Splits every active contract into fixed-size batches in contract order.
 *
 * REB-26 authors one fixture page per batch instead of one page for all 406
 * components: a single page would be unusable in the editor, and a per-component
 * page would pay the page-create/publish/delete cost 406 times. Contract order is
 * preserved so a batch index always maps to the same components.
 */
export function componentBatches(batchSize: number): ComponentContract[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error(`componentBatches requires a positive integer batch size, got ${batchSize}`);
  }

  const contracts = [...activeComponentContracts()].sort((a, b) => a.index - b.index);
  const batches: ComponentContract[][] = [];
  for (let start = 0; start < contracts.length; start += batchSize) {
    batches.push(contracts.slice(start, start + batchSize));
  }
  return batches;
}
