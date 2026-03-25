import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../components/DropdownMenu';
import { Button } from '../components/Button';

const meta: Meta = {
  title: 'Design System/Overlays/DropdownMenu',
  tags: ['autodocs'],
};
export default meta;

export const Default: StoryObj = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ minWidth: '200px' }}>
        <DropdownMenuLabel>Page Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="⌘E">Edit Properties</DropdownMenuItem>
        <DropdownMenuItem shortcut="⌘D">Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Move to…</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="⌘P">Publish</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem shortcut="⌫" style={{ color: 'var(--color-destructive)' }}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithSubmenu: StoryObj = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">More Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>View Details</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move to Folder</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Global</DropdownMenuItem>
            <DropdownMenuItem>Marketing</DropdownMenuItem>
            <DropdownMenuItem>Products</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem style={{ color: 'var(--color-destructive)' }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithCheckboxItems: StoryObj = {
  render: () => {
    const [showImages, setShowImages] = React.useState(true);
    const [showDates, setShowDates] = React.useState(false);
    const [showStatus, setShowStatus] = React.useState(true);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Column Visibility</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={showImages} onCheckedChange={setShowImages}>
            Thumbnail
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showDates} onCheckedChange={setShowDates}>
            Modified Date
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
            Status
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};
