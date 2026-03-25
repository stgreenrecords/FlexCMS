import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { DataTable } from '../components/DataTable';
import type { ColumnDef } from '../index';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

const meta: Meta<typeof DataTable> = {
  title: 'Design System/DataTable',
  component: DataTable,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DataTable>;

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface ContentRow {
  id: string;
  title: string;
  path: string;
  status: 'published' | 'draft' | 'review';
  author: string;
  modified: string;
}

const SAMPLE_ROWS: ContentRow[] = [
  { id: '1', title: 'Homepage', path: '/en/home', status: 'published', author: 'Alex Rivera', modified: 'Oct 12, 2023' },
  { id: '2', title: 'About Us', path: '/en/about', status: 'published', author: 'Sarah Chen', modified: 'Oct 11, 2023' },
  { id: '3', title: 'Product Catalog', path: '/en/products', status: 'review', author: 'Marcus Kane', modified: 'Oct 10, 2023' },
  { id: '4', title: 'Gaming Monitors', path: '/en/products/monitors', status: 'published', author: 'Priya Nair', modified: 'Oct 09, 2023' },
  { id: '5', title: 'Contact Page', path: '/en/contact', status: 'draft', author: 'Alex Rivera', modified: 'Oct 08, 2023' },
  { id: '6', title: 'Privacy Policy', path: '/en/legal/privacy', status: 'published', author: 'System Bot', modified: 'Oct 05, 2023' },
  { id: '7', title: 'Checkout Flow', path: '/en/shop/checkout', status: 'draft', author: 'Sarah Chen', modified: 'Oct 04, 2023' },
];

const STATUS_VARIANT: Record<ContentRow['status'], 'default' | 'warning' | 'secondary'> = {
  published: 'default',
  review: 'warning',
  draft: 'secondary',
};

const columns: ColumnDef<ContentRow>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{row.original.title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)', fontFamily: 'monospace' }}>
          {row.original.path}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>
        {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
      </Badge>
    ),
  },
  { accessorKey: 'author', header: 'Author' },
  { accessorKey: 'modified', header: 'Modified' },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="ghost" size="sm">Edit</Button>
        <Button variant="ghost" size="sm">Publish</Button>
      </div>
    ),
  },
];

export const Default: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={SAMPLE_ROWS}
    />
  ),
};

export const Selectable: Story = {
  render: () => {
    const [selected, setSelected] = useState<ContentRow[]>([]);
    return (
      <div>
        {selected.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-muted)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem' }}>{selected.length} selected</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" variant="outline">Publish</Button>
              <Button size="sm" variant="destructive">Delete</Button>
            </div>
          </div>
        )}
        <DataTable
          columns={columns}
          data={SAMPLE_ROWS}
          selectable
          onSelectionChange={setSelected}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={[]}
      emptyMessage="No content nodes match your filters."
    />
  ),
};

