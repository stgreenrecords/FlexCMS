import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Badge } from '../components/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Published', variant: 'default' } };
export const Secondary: Story = { args: { children: 'Draft', variant: 'secondary' } };
export const Success: Story = { args: { children: 'Active', variant: 'success' } };
export const Warning: Story = { args: { children: 'Pending Review', variant: 'warning' } };
export const Destructive: Story = { args: { children: 'Archived', variant: 'destructive' } };
export const Outline: Story = { args: { children: 'Deprecated', variant: 'outline' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
      <Badge variant="default">Published</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Archived</Badge>
      <Badge variant="outline">Deprecated</Badge>
    </div>
  ),
};

