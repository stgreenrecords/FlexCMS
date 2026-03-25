import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/Sheet';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Label } from '../components/Label';

const meta: Meta<typeof Sheet> = {
  title: 'Design System/Overlays/Sheet',
  component: Sheet,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Sheet>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Right Sheet</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Page Properties</SheetTitle>
          <SheetDescription>Edit metadata for the selected page.</SheetDescription>
        </SheetHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>Title</Label>
            <Input placeholder="Page title" defaultValue="Homepage" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label>Slug</Label>
            <Input placeholder="/page-slug" defaultValue="/home" />
          </div>
        </div>
        <SheetFooter style={{ marginTop: '2rem' }}>
          <Button variant="outline">Discard</Button>
          <Button>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left Sheet</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down content by applying filters.</SheetDescription>
        </SheetHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <Input placeholder="Search content…" />
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bulk Actions</SheetTitle>
          <SheetDescription>Apply an action to all selected items.</SheetDescription>
        </SheetHeader>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button>Publish Selected</Button>
          <Button variant="outline">Move to Archive</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

