import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import React from 'react';
import { ToastProvider, useToast } from '../components/Toast';
import { Button } from '../components/Button';

const meta: Meta = {
  title: 'Design System/Toast',
  tags: ['autodocs'],
  decorators: [
    (Story: StoryFn) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};
export default meta;

// ---------------------------------------------------------------------------
// Interactive trigger
// ---------------------------------------------------------------------------

function ToastTriggers() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Page saved', description: 'Your changes have been saved as a draft.', variant: 'default' })
        }
      >
        Default toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Published!', description: 'Homepage is now live for all users.', variant: 'success' })
        }
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Schedule pending', description: 'Page will publish on Oct 31 at 08:00 UTC.', variant: 'warning' })
        }
      >
        Warning toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Publish failed', description: 'Cannot reach the replication queue. Retrying…', variant: 'error' })
        }
      >
        Error toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Tip', description: 'Use ⌘K to open the command palette anywhere.', variant: 'info' })
        }
      >
        Info toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Page deleted',
            description: 'This action cannot be undone.',
            variant: 'error',
            action: { label: 'Undo', onClick: () => alert('Undo clicked') },
          })
        }
      >
        Toast with action
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({ title: 'Persisted notification', description: 'This will not auto-dismiss.', variant: 'info', duration: 0 })
        }
      >
        Persistent toast
      </Button>
    </div>
  );
}

export const AllVariants: StoryObj = {
  name: 'Interactive — all variants',
  render: () => <ToastTriggers />,
};

export const TopRight: StoryObj = {
  name: 'Position: Top Right',
  decorators: [
    (Story: StoryFn) => (
      <ToastProvider position="top-right">
        <Story />
      </ToastProvider>
    ),
  ],
  render: () => {
    function Inner() {
      const { toast } = useToast();
      return (
        <Button onClick={() => toast({ title: 'Top-right toast', variant: 'success' })}>
          Show top-right
        </Button>
      );
    }
    return <Inner />;
  },
};

