import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/Accordion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Badge } from '../components/Badge';

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const tabsMeta: Meta<typeof Tabs> = {
  title: 'Design System/Navigation/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default tabsMeta;
type TabsStory = StoryObj<typeof Tabs>;

export const Default: TabsStory = {
  render: () => (
    <Tabs defaultValue="content" style={{ maxWidth: '600px' }}>
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="content">
        <Card>
          <CardContent style={{ paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
              Main page content area. Add components, rich text, and hero blocks here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="media">
        <Card>
          <CardContent style={{ paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
              Attach images, videos, and documents from the DAM.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="seo">
        <Card>
          <CardContent style={{ paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
              Meta title, description, canonical URL, and Open Graph settings.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardContent style={{ paddingTop: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
              Page status, publish schedule, and access control settings.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const WithBadge: TabsStory = {
  render: () => (
    <Tabs defaultValue="pending" style={{ maxWidth: '500px' }}>
      <TabsList>
        <TabsTrigger value="pending">
          Pending <Badge variant="warning" style={{ marginLeft: '0.5rem' }}>12</Badge>
        </TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginTop: '1rem' }}>
          12 items awaiting your review.
        </p>
      </TabsContent>
      <TabsContent value="approved">
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginTop: '1rem' }}>
          No approved items to show.
        </p>
      </TabsContent>
      <TabsContent value="rejected">
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', marginTop: '1rem' }}>
          No rejected items.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

