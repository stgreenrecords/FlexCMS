import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import React from 'react';
import { CommandPalette, CommandPaletteProvider, useCommandPalette } from '../components/CommandPalette';
import { Button } from '../components/Button';
import type { CommandItem } from '../components/CommandPalette';

const meta: Meta = {
  title: 'Design System/CommandPalette',
  tags: ['autodocs'],
};
export default meta;

const CMS_COMMANDS: CommandItem[] = [
  {
    id: 'new-page',
    label: 'Create New Page',
    description: 'Add a page to the content tree',
    group: 'Content',
    shortcut: '⌘N',
    onSelect: () => alert('Create page'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    id: 'publish-page',
    label: 'Publish Current Page',
    description: 'Push to the delivery tier',
    group: 'Content',
    shortcut: '⌘P',
    onSelect: () => alert('Publish'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'upload-asset',
    label: 'Upload Asset',
    description: 'Add media to the DAM',
    group: 'Assets',
    shortcut: '⌘U',
    onSelect: () => alert('Upload'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    id: 'search-content',
    label: 'Search Content',
    description: 'Full-text search across all pages',
    group: 'Assets',
    shortcut: '⌘F',
    onSelect: () => alert('Search'),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Open Settings',
    description: 'Global admin configuration',
    group: 'Navigation',
    shortcut: '⌘,',
    onSelect: () => alert('Settings'),
  },
  {
    id: 'dark-mode',
    label: 'Toggle Dark Mode',
    group: 'Navigation',
    onSelect: () => alert('Toggle theme'),
  },
];

function PaletteDemo() {
  const { open, setOpen } = useCommandPalette();
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        Open Command Palette{' '}
        <kbd style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.15rem 0.35rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}>
          ⌘K
        </kbd>
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={CMS_COMMANDS}
        placeholder="Search commands, pages, assets…"
      />
    </>
  );
}

export const Default: StoryObj = {
  name: 'Interactive',
  decorators: [(Story: StoryFn) => <CommandPaletteProvider><Story /></CommandPaletteProvider>],
  render: () => <PaletteDemo />,
};

export const WithPlaceholder: StoryObj = {
  name: 'Open by default',
  decorators: [(Story: StoryFn) => <CommandPaletteProvider><Story /></CommandPaletteProvider>],
  render: () => {
    function OpenByDefault() {
      const { setOpen } = useCommandPalette();
      React.useEffect(() => { setOpen(true); }, []);
      return (
        <CommandPalette
          open
          onOpenChange={() => {}}
          items={CMS_COMMANDS}
          placeholder="Search commands…"
        />
      );
    }
    return <OpenByDefault />;
  },
};

