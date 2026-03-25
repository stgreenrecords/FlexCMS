import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { TagInput } from '../components/TagInput';
import { ColorPicker, ColorSwatchGroup } from '../components/ColorPicker';
import { FileUpload, FileUploadList, useFileUpload } from '../components/FileUpload';
import { Label } from '../components/Label';

const meta: Meta = {
  title: 'Design System/Forms/Rich Inputs',
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

export const TagInputDefault: StoryObj = {
  name: 'TagInput',
  render: () => {
    const [tags, setTags] = useState(['cms', 'enterprise', 'headless']);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '420px' }}>
        <Label>Tags</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          placeholder="Add tags…"
          maxTags={10}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>
          Press Enter or comma to add a tag. Current: {tags.join(', ') || 'none'}
        </p>
      </div>
    );
  },
};

export const TagInputEmpty: StoryObj = {
  name: 'TagInput (empty)',
  render: () => {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <div style={{ maxWidth: '420px' }}>
        <TagInput value={tags} onChange={setTags} placeholder="Add keywords…" />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// ColorPicker
// ---------------------------------------------------------------------------

export const ColorPickerDefault: StoryObj = {
  name: 'ColorPicker',
  render: () => {
    const [color, setColor] = useState('#b0c6ff');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>Brand Color</Label>
        <ColorPicker value={color} onChange={setColor} />
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>Selected: {color}</p>
      </div>
    );
  },
};

export const ColorSwatchGroupDefault: StoryObj = {
  name: 'ColorSwatchGroup',
  render: () => {
    const [color, setColor] = useState('#3b82f6');
    const palette = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Label>Background Color</Label>
        <ColorSwatchGroup colors={palette} value={color} onChange={setColor} />
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// FileUpload
// ---------------------------------------------------------------------------

export const FileUploadDefault: StoryObj = {
  name: 'FileUpload',
  render: () => {
    const { files, addFiles, removeFile } = useFileUpload();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
        <FileUpload
          accept="image/*"
          multiple
          maxFiles={5}
          maxSize={10 * 1024 * 1024}
          onFiles={addFiles}
        />
        {files.length > 0 && (
          <FileUploadList files={files} onRemove={removeFile} />
        )}
      </div>
    );
  },
};

export const FileUploadDocuments: StoryObj = {
  name: 'FileUpload (Documents)',
  render: () => {
    const { files, addFiles, removeFile } = useFileUpload();
    return (
      <div style={{ maxWidth: '480px' }}>
        <FileUpload
          accept=".pdf,.docx,.xlsx,.csv"
          multiple
          onFiles={addFiles}
        />
        {files.length > 0 && <FileUploadList files={files} onRemove={removeFile} />}
      </div>
    );
  },
};

