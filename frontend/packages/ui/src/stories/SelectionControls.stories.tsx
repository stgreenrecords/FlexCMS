import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Checkbox } from '../components/Checkbox';
import { RadioGroup, RadioGroupItem } from '../components/RadioGroup';
import { Switch } from '../components/Switch';
import { Label } from '../components/Label';

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'Design System/Forms/Selection Controls',
  tags: ['autodocs'],
};
export default meta;

export const CheckboxDefault: StoryObj = {
  name: 'Checkbox',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Checkbox id="cb-1" />
        <Label htmlFor="cb-1">Include in sitemap</Label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Checkbox id="cb-2" defaultChecked />
        <Label htmlFor="cb-2">Allow search indexing (checked)</Label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Checkbox id="cb-3" disabled />
        <Label htmlFor="cb-3" style={{ opacity: 0.5 }}>Disabled option</Label>
      </div>
    </div>
  ),
};

export const CheckboxGroup: StoryObj = {
  name: 'Checkbox Group',
  render: () => {
    const [selected, setSelected] = useState<string[]>(['content']);
    const options = [
      { id: 'content', label: 'Content Authors' },
      { id: 'reviewer', label: 'Reviewers' },
      { id: 'publisher', label: 'Publishers' },
      { id: 'admin', label: 'Administrators' },
    ];
    const toggle = (id: string) =>
      setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    return (
      <fieldset style={{ border: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <legend style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Notify roles</legend>
        {options.map(({ id, label }) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id={`role-${id}`}
              checked={selected.includes(id)}
              onCheckedChange={() => toggle(id)}
            />
            <Label htmlFor={`role-${id}`}>{label}</Label>
          </div>
        ))}
      </fieldset>
    );
  },
};

// ---------------------------------------------------------------------------
// RadioGroup
// ---------------------------------------------------------------------------

export const RadioDefault: StoryObj = {
  name: 'Radio Group',
  render: () => (
    <RadioGroup defaultValue="draft" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {[
        { value: 'draft', label: 'Draft — visible only to editors' },
        { value: 'review', label: 'In Review — waiting for approval' },
        { value: 'published', label: 'Published — live for readers' },
      ].map(({ value, label }) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RadioGroupItem value={value} id={`status-${value}`} />
          <Label htmlFor={`status-${value}`}>{label}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
};

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export const SwitchDefault: StoryObj = {
  name: 'Switch',
  render: () => {
    const [enabled, setEnabled] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Switch id="sw-index" checked={enabled} onCheckedChange={setEnabled} />
          <Label htmlFor="sw-index">{enabled ? 'Indexing enabled' : 'Indexing disabled'}</Label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Switch id="sw-notifications" defaultChecked />
          <Label htmlFor="sw-notifications">Email notifications</Label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Switch id="sw-disabled" disabled />
          <Label htmlFor="sw-disabled" style={{ opacity: 0.5 }}>Feature flag (disabled)</Label>
        </div>
      </div>
    );
  },
};

