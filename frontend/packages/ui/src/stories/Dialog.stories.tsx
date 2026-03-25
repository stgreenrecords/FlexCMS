import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/Dialog';
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

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------

const dialogMeta: Meta<typeof Dialog> = {
  title: 'Design System/Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};
export default dialogMeta;
type DialogStory = StoryObj<typeof Dialog>;

export const Default: DialogStory = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Page</DialogTitle>
          <DialogDescription>
            This will make the page publicly accessible. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithForm: DialogStory = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Site</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
          <DialogDescription>
            A new site will be created in your organization.
          </DialogDescription>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="site-name">Site Name</Label>
            <Input id="site-name" placeholder="My Retail Store" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="site-domain">Domain</Label>
            <Input id="site-domain" placeholder="store.example.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Destructive: DialogStory = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Page</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "Homepage"?</DialogTitle>
          <DialogDescription>
            This action is irreversible. All child pages and content nodes under this path will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete permanently</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

