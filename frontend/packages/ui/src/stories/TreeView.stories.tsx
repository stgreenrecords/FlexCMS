import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { TreeView, type TreeNode } from '../components/TreeView';

const meta: Meta<typeof TreeView> = {
  title: 'Design System/Navigation/TreeView',
  component: TreeView,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TreeView>;

const CONTENT_TREE: TreeNode[] = [
  {
    id: 'root',
    label: 'Global Site',
    children: [
      {
        id: 'en',
        label: 'English (en)',
        children: [
          { id: 'home', label: 'Homepage', badge: 'Published' },
          {
            id: 'products',
            label: 'Products',
            children: [
              { id: 'monitors', label: 'Monitors' },
              { id: 'keyboards', label: 'Keyboards' },
              { id: 'mice', label: 'Mice', badge: 'Draft' },
            ],
          },
          { id: 'about', label: 'About Us' },
          { id: 'contact', label: 'Contact', badge: 'Draft' },
        ],
      },
      {
        id: 'de',
        label: 'German (de)',
        children: [
          { id: 'de-home', label: 'Startseite' },
          { id: 'de-products', label: 'Produkte' },
        ],
      },
    ],
  },
];

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: '320px', padding: '1rem', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      <TreeView
        nodes={CONTENT_TREE}
        onSelect={(id: string) => console.log('Selected:', id)}
      />
    </div>
  ),
};

export const Flat: Story = {
  render: () => {
    const flat: TreeNode[] = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'content', label: 'Content Tree' },
      { id: 'dam', label: 'Media Library' },
      { id: 'workflows', label: 'Workflows', badge: '38' },
      { id: 'components', label: 'Components' },
      { id: 'settings', label: 'Settings' },
    ];
    return (
      <div style={{ maxWidth: '280px', padding: '0.5rem', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)' }}>
        <TreeView nodes={flat} onSelect={(id: string) => console.log(id)} />
      </div>
    );
  },
};

export const DeepNesting: Story = {
  render: () => {
    const deep: TreeNode[] = [
      {
        id: 'content',
        label: 'content',
        children: [
          {
            id: 'site',
            label: 'site',
            children: [
              {
                id: 'en',
                label: 'en',
                children: [
                  {
                    id: 'products',
                    label: 'products',
                    children: [
                      { id: 'monitors', label: 'monitors' },
                      {
                        id: 'laptops',
                        label: 'laptops',
                        children: [
                          { id: 'gaming', label: 'gaming' },
                          { id: 'business', label: 'business' },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    return (
      <div style={{ maxWidth: '340px', padding: '1rem', background: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <TreeView nodes={deep} />
      </div>
    );
  },
};

