import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../components/Select';
import { DatePicker, DateRangePicker } from '../components/DatePicker';
import { Label } from '../components/Label';

const meta: Meta = {
  title: 'Design System/Forms/Select & Date',
  tags: ['autodocs'],
};
export default meta;

export const SelectDefault: StoryObj = {
  name: 'Select',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '280px' }}>
      <Label>Page Template</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template…" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Standard Templates</SelectLabel>
            <SelectItem value="page">Standard Page</SelectItem>
            <SelectItem value="landing">Landing Page</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Commerce Templates</SelectLabel>
            <SelectItem value="product">Product Detail</SelectItem>
            <SelectItem value="catalog">Product Catalog</SelectItem>
            <SelectItem value="checkout">Checkout</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const SelectWithValue: StoryObj = {
  name: 'Select (with value)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '280px' }}>
      <Label>Status</Label>
      <Select defaultValue="published">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="review">In Review</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DatePickerDefault: StoryObj = {
  name: 'DatePicker',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '280px' }}>
      <Label>Publish Date</Label>
      <DatePicker />
    </div>
  ),
};

export const DateRangePickerDefault: StoryObj = {
  name: 'DateRangePicker',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '500px' }}>
      <Label>Date Range</Label>
      <DateRangePicker />
    </div>
  ),
};

export const SelectDisabled: StoryObj = {
  name: 'Select (disabled)',
  render: () => (
    <Select disabled>
      <SelectTrigger style={{ maxWidth: '280px' }}>
        <SelectValue placeholder="Not available" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="opt">Option</SelectItem>
      </SelectContent>
    </Select>
  ),
};

