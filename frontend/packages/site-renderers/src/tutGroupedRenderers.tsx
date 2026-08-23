'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';
import { CallsToActionRenderer } from './tutCampaignRenderers';
import { EducationLearningRenderer } from './tutLearningRenderers';
import { linkAttributes, toTutLink } from './tutLink';
import {
  isRecord,
  normalizeLabel,
  firstText,
  toPrimitivePreview,
  extractImageUrl,
  isImageField,
} from './fieldShapes';
import { createRichGroupRenderer } from './richGroupRenderers';

export interface TutComponentContract {
  groupName?: string;
  resourceType: string;
}

const GROUP_LAYOUT_CLASS: Record<string, string> = {
  'Layout & Page Structure': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Editorial & Article Content': 'grid grid-cols-1 gap-3',
  'Media, Visual Storytelling & Assets': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Navigation, Search & Discovery': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Calls to Action, Promotions & Campaigns': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Forms, Data Capture & Consent': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Commerce, Catalog & Merchandising': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Community, Social Proof & Engagement': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Account, Portal & Transactional': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Events, Booking, Travel & Hospitality': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Brand, Corporate, Investor & Governance': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Location, Local & Physical Presence': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Education, Learning & Developer Content': 'grid grid-cols-1 gap-3 md:grid-cols-2',
  'Support, Documentation & Knowledge': 'grid grid-cols-1 gap-3',
};













function renderRecordValue(fieldName: string, value: Record<string, unknown>): React.ReactNode {
  const link = toTutLink(value);
  if (link) {
    const fragment = link.url.startsWith('#') ? link.url.slice(1) : null;
    return (
      <>
        {fragment ? <span id={fragment} aria-hidden="true" /> : null}
        <a href={link.url} {...linkAttributes(link)} className="underline decoration-current/40 underline-offset-4 hover:decoration-current">{link.label}</a>
      </>
    );
  }

  const entries = Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null);
  if (entries.length === 0) {
    return <span style={{ color: 'var(--color-on-surface-variant)' }}>Not provided</span>;
  }

  return (
    <dl className="space-y-1">
      {entries.slice(0, 6).map(([key, entry]) => (
        <div key={`${fieldName}-${key}`} className="flex flex-wrap gap-x-2">
          <dt className="font-semibold">{normalizeLabel(key)}:</dt>
          <dd className="m-0">{toPrimitivePreview(entry)}</dd>
        </div>
      ))}
      {entries.length > 6 ? <div>+{entries.length - 6} more</div> : null}
    </dl>
  );
}

function renderFieldValue(fieldName: string, value: unknown): React.ReactNode {
  if (value == null) {
    return <span style={{ color: 'var(--color-on-surface-variant)' }}>Not provided</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: 'var(--color-on-surface-variant)' }}>No items</span>;
    }

    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.slice(0, 4).map((item, index) => (
          <li key={`${fieldName}-${index}`}>
            {toTutLink(item) ? renderRecordValue(fieldName, item as Record<string, unknown>) : toPrimitivePreview(item)}
          </li>
        ))}
        {value.length > 4 ? <li>+{value.length - 4} more</li> : null}
      </ul>
    );
  }

  if (isImageField(fieldName)) {
    const imageUrl = extractImageUrl(value);
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={normalizeLabel(fieldName)}
          loading="lazy"
          style={{
            border: '1px solid var(--color-outline)',
            borderRadius: '8px',
            maxHeight: '220px',
            objectFit: 'cover',
            width: '100%',
          }}
        />
      );
    }

    return <span style={{ color: 'var(--color-on-surface-variant)' }}>Image unavailable</span>;
  }

  if (typeof value === 'string' && value.length > 220) {
    return <p style={{ margin: 0, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{value}</p>;
  }

  if (isRecord(value)) {
    return renderRecordValue(fieldName, value);
  }

  return <span>{toPrimitivePreview(value)}</span>;
}

/**
 * Field-list rendering, kept as the last resort.
 *
 * `createRichGroupRenderer` lays content out properly; this remains for content whose
 * shape it cannot make sense of, so nothing an author has written ever disappears from
 * the page just because it did not match a layout.
 */
function createFieldListRenderer(groupName: string): FlexCmsRenderer {
  const GroupRenderer: FlexCmsRenderer = ({ data, children, resourceType, name }) => {
    const fields = Object.entries(data ?? {}).filter(([, value]) => value !== undefined);
    const resourceHint = resourceType?.split('/').pop() ?? name ?? 'component';
    const layoutClass = GROUP_LAYOUT_CLASS[groupName] ?? 'grid grid-cols-1 gap-3 md:grid-cols-2';

    return (
      <section
        data-flexcms-group={groupName}
        data-flexcms-resource-type={resourceType}
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          border: '1px solid var(--color-outline)',
          borderRadius: '12px',
          margin: '0.75rem 0',
          padding: '1rem',
        }}
      >
        <header style={{ marginBottom: '0.75rem' }}>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.75rem', margin: 0 }}>{groupName}</p>
          <h3 style={{ fontSize: '1rem', margin: '0.15rem 0 0' }}>{normalizeLabel(resourceHint)}</h3>
        </header>

        {fields.length > 0 ? (
          <dl className={layoutClass}>
            {fields.map(([fieldName, value]) => (
              <div key={fieldName}>
                <dt style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem' }}>{normalizeLabel(fieldName)}</dt>
                <dd style={{ margin: 0 }}>{renderFieldValue(fieldName, value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p style={{ color: 'var(--color-on-surface-variant)', margin: 0 }}>No authored fields yet.</p>
        )}

        {children ? <div className="mt-4 space-y-3">{children}</div> : null}
      </section>
    );
  };

  GroupRenderer.displayName = `${groupName.replace(/[^a-z0-9]/gi, '')}Renderer`;
  return GroupRenderer;
}

/**
 * Every group renders through the shape-driven layouts. The group name is passed
 * through for diagnostics and for the few places layout still varies by group.
 */
export const groupedTutRenderersByGroup: Record<string, FlexCmsRenderer> = {
  'Layout & Page Structure': createRichGroupRenderer('Layout & Page Structure', createFieldListRenderer('Layout & Page Structure')),
  'Editorial & Article Content': createRichGroupRenderer('Editorial & Article Content', createFieldListRenderer('Editorial & Article Content')),
  'Media, Visual Storytelling & Assets': createRichGroupRenderer('Media, Visual Storytelling & Assets', createFieldListRenderer('Media, Visual Storytelling & Assets')),
  'Navigation, Search & Discovery': createRichGroupRenderer('Navigation, Search & Discovery', createFieldListRenderer('Navigation, Search & Discovery')),
  'Calls to Action, Promotions & Campaigns': createRichGroupRenderer('Calls to Action, Promotions & Campaigns', createFieldListRenderer('Calls to Action, Promotions & Campaigns')),
  'Forms, Data Capture & Consent': createRichGroupRenderer('Forms, Data Capture & Consent', createFieldListRenderer('Forms, Data Capture & Consent')),
  'Commerce, Catalog & Merchandising': createRichGroupRenderer('Commerce, Catalog & Merchandising', createFieldListRenderer('Commerce, Catalog & Merchandising')),
  'Community, Social Proof & Engagement': createRichGroupRenderer('Community, Social Proof & Engagement', createFieldListRenderer('Community, Social Proof & Engagement')),
  'Account, Portal & Transactional': createRichGroupRenderer('Account, Portal & Transactional', createFieldListRenderer('Account, Portal & Transactional')),
  'Events, Booking, Travel & Hospitality': createRichGroupRenderer('Events, Booking, Travel & Hospitality', createFieldListRenderer('Events, Booking, Travel & Hospitality')),
  'Brand, Corporate, Investor & Governance': createRichGroupRenderer('Brand, Corporate, Investor & Governance', createFieldListRenderer('Brand, Corporate, Investor & Governance')),
  'Location, Local & Physical Presence': createRichGroupRenderer('Location, Local & Physical Presence', createFieldListRenderer('Location, Local & Physical Presence')),
  'Education, Learning & Developer Content': createRichGroupRenderer('Education, Learning & Developer Content', createFieldListRenderer('Education, Learning & Developer Content')),
  'Support, Documentation & Knowledge': createRichGroupRenderer('Support, Documentation & Knowledge', createFieldListRenderer('Support, Documentation & Knowledge')),
};

export const defaultTutRenderer = createRichGroupRenderer('TUT Components', createFieldListRenderer('TUT Components'));

export const semanticGroupRenderers: Record<string, FlexCmsRenderer> = {
  'Calls to Action, Promotions & Campaigns': CallsToActionRenderer,
  'Education, Learning & Developer Content': EducationLearningRenderer,
};

export function buildTutRendererEntries(contracts: TutComponentContract[]): Record<string, FlexCmsRenderer> {
  return contracts.reduce<Record<string, FlexCmsRenderer>>((entries, contract) => {
    entries[contract.resourceType] = semanticGroupRenderers[contract.groupName ?? '']
      ?? groupedTutRenderersByGroup[contract.groupName ?? '']
      ?? defaultTutRenderer;
    return entries;
  }, {});
}

// Re-exported so importers of this module keep the surface they had before the
// helpers moved out to break the import cycle.
export {
  isRecord,
  normalizeLabel,
  firstText,
  toPrimitivePreview,
  extractImageUrl,
  isImageField,
} from './fieldShapes';
