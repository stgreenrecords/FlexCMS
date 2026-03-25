import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../components/Popover';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Label } from '../components/Label';

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

const tooltipMeta: Meta = {
  title: 'Design System/Overlays/Tooltip',
  tags: ['autodocs'],
};
export default tooltipMeta;

export const Default: StoryObj = {
  render: () => (
    <TooltipProvider>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Save draft to continue editing</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

// ---------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------

export const PopoverDefault: StoryObj = {
  name: 'Popover',
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Schedule Publish</Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: '280px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Schedule publication</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>Publish at</Label>
            <Input type="datetime-local" />
          </div>
          <Button size="sm">Confirm Schedule</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

