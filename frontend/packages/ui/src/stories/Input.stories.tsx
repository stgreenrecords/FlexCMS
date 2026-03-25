import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import { Textarea } from '../components/Textarea';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

const inputMeta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'search', 'url'] },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};
export default inputMeta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: 'Enter page title…', type: 'text' } };
export const Email: Story = { args: { placeholder: 'user@flexcms.io', type: 'email' } };
export const Password: Story = { args: { placeholder: 'Enter password', type: 'password' } };
export const Disabled: Story = { args: { placeholder: 'Disabled input', disabled: true, value: 'Read only value' } };

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '320px' }}>
      <Label htmlFor="title-input">Page Title</Label>
      <Input id="title-input" placeholder="Enter page title…" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '320px' }}>
      <Label htmlFor="slug-input">Slug</Label>
      <Input id="slug-input" placeholder="page-slug" style={{ borderColor: 'var(--color-destructive)' }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--color-destructive)' }}>Slug already in use.</span>
    </div>
  ),
};

export const FormGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label htmlFor="f-title">Title</Label>
        <Input id="f-title" placeholder="Page title" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label htmlFor="f-desc">Description</Label>
        <Textarea id="f-desc" placeholder="Brief page description…" rows={3} />
      </div>
    </div>
  ),
};

