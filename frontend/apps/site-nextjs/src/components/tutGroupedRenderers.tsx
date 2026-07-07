'use client';

import React from 'react';
import type { FlexCmsRenderer } from '@flexcms/react';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeLabel(label: string): string {
  return label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();
}

function toPrimitivePreview(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 180 ? `${value.slice(0, 180)}...` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return 'Not provided';
}

function extractImageUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (isRecord(value)) {
    const candidates = [value.url, value.src, value.path, value.imageUrl, value.thumbnailUrl];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return null;
}

function isImageField(fieldName: string): boolean {
  return /(image|photo|thumbnail|poster|logo|icon|background)/i.test(fieldName);
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
          <li key={`${fieldName}-${index}`}>{toPrimitivePreview(item)}</li>
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
    return (
      <pre style={{ fontSize: '0.75rem', margin: 0, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span>{toPrimitivePreview(value)}</span>;
}

function createGroupRenderer(groupName: string): FlexCmsRenderer {
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

export const groupedTutRenderersByGroup: Record<string, FlexCmsRenderer> = {
  'Layout & Page Structure': createGroupRenderer('Layout & Page Structure'),
  'Editorial & Article Content': createGroupRenderer('Editorial & Article Content'),
  'Media, Visual Storytelling & Assets': createGroupRenderer('Media, Visual Storytelling & Assets'),
  'Navigation, Search & Discovery': createGroupRenderer('Navigation, Search & Discovery'),
  'Calls to Action, Promotions & Campaigns': createGroupRenderer('Calls to Action, Promotions & Campaigns'),
  'Forms, Data Capture & Consent': createGroupRenderer('Forms, Data Capture & Consent'),
  'Commerce, Catalog & Merchandising': createGroupRenderer('Commerce, Catalog & Merchandising'),
  'Community, Social Proof & Engagement': createGroupRenderer('Community, Social Proof & Engagement'),
  'Account, Portal & Transactional': createGroupRenderer('Account, Portal & Transactional'),
  'Events, Booking, Travel & Hospitality': createGroupRenderer('Events, Booking, Travel & Hospitality'),
  'Brand, Corporate, Investor & Governance': createGroupRenderer('Brand, Corporate, Investor & Governance'),
  'Location, Local & Physical Presence': createGroupRenderer('Location, Local & Physical Presence'),
  'Education, Learning & Developer Content': createGroupRenderer('Education, Learning & Developer Content'),
  'Support, Documentation & Knowledge': createGroupRenderer('Support, Documentation & Knowledge'),
};

const defaultTutRenderer = createGroupRenderer('TUT Components');

export function buildTutRendererEntries(contracts: TutComponentContract[]): Record<string, FlexCmsRenderer> {
  return contracts.reduce<Record<string, FlexCmsRenderer>>((entries, contract) => {
    entries[contract.resourceType] = groupedTutRenderersByGroup[contract.groupName ?? ''] ?? defaultTutRenderer;
    return entries;
  }, {});
}

