import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Design System/Navigation/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible style={{ maxWidth: '560px' }}>
      <AccordionItem value="general">
        <AccordionTrigger>General Information</AccordionTrigger>
        <AccordionContent>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
            Product name, brand, primary category, MSRP, and long description.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="specs">
        <AccordionTrigger>Technical Specifications</AccordionTrigger>
        <AccordionContent>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
            Resolution, refresh rate, panel type, color gamut, and connectivity specs.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="media">
        <AccordionTrigger>Media & Assets</AccordionTrigger>
        <AccordionContent>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
            Link images, videos, and PDF datasheets from the DAM.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="localization">
        <AccordionTrigger>Localization</AccordionTrigger>
        <AccordionContent>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
            Translated name and description for each active locale (DE, FR, ES, JP).
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" style={{ maxWidth: '560px' }}>
      <AccordionItem value="content">
        <AccordionTrigger>Content Settings</AccordionTrigger>
        <AccordionContent>Content configuration options.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="seo">
        <AccordionTrigger>SEO & Metadata</AccordionTrigger>
        <AccordionContent>Meta title, description, canonical URL, and structured data.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>Access Control</AccordionTrigger>
        <AccordionContent>Role-based permissions and ACL configuration for this node.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

