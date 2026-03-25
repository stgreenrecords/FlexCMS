import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: '380px' }}>
      <CardHeader>
        <CardTitle>Page Settings</CardTitle>
        <CardDescription>Configure metadata and SEO for this page.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
          Set the page title, description, and social sharing image for optimal search engine visibility.
        </p>
      </CardContent>
      <CardFooter style={{ gap: '0.5rem' }}>
        <Button variant="outline" size="sm">Cancel</Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatCard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '700px' }}>
      {[
        { label: 'Total Pages', value: '248', delta: '+12 this week' },
        { label: 'Published', value: '193', delta: '78% of total' },
        { label: 'Pending Review', value: '14', delta: '5 overdue' },
      ].map(({ label, value, delta }) => (
        <Card key={label}>
          <CardHeader style={{ paddingBottom: '0.5rem' }}>
            <CardDescription>{label}</CardDescription>
            <CardTitle style={{ fontSize: '2rem' }}>{value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-foreground)' }}>{delta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Card style={{ maxWidth: '340px' }}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <CardTitle>Hero Banner</CardTitle>
            <CardDescription style={{ marginTop: '0.25rem' }}>flexcms/hero</CardDescription>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
          Full-width hero with CTA and background image support.
        </p>
      </CardContent>
    </Card>
  ),
};

