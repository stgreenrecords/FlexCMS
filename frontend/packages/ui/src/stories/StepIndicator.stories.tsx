import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { StepIndicator } from '../components/StepIndicator';
import { Button } from '../components/Button';

const meta: Meta<typeof StepIndicator> = {
  title: 'Design System/StepIndicator',
  component: StepIndicator,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StepIndicator>;

const IMPORT_STEPS = [
  { id: 'upload', label: 'Upload', description: 'Select your data file' },
  { id: 'format', label: 'Format', description: 'Configure file format' },
  { id: 'mapping', label: 'Field Mapping', description: 'Map source columns' },
  { id: 'preview', label: 'Preview', description: 'Validate the import' },
  { id: 'execute', label: 'Execute', description: 'Run the import job' },
];

export const Step1: Story = {
  render: () => <StepIndicator steps={IMPORT_STEPS} currentStep={0} />,
};

export const Step3: Story = {
  render: () => <StepIndicator steps={IMPORT_STEPS} currentStep={2} />,
};

export const Step5Completed: Story = {
  render: () => <StepIndicator steps={IMPORT_STEPS} currentStep={4} />,
};

export const Interactive: Story = {
  render: () => {
    const [current, setCurrent] = useState(0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <StepIndicator steps={IMPORT_STEPS} currentStep={current} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((p) => p - 1)}>
            Back
          </Button>
          <Button disabled={current === IMPORT_STEPS.length - 1} onClick={() => setCurrent((p) => p + 1)}>
            {current === IMPORT_STEPS.length - 2 ? 'Execute Import' : 'Continue'}
          </Button>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}>
          Step {current + 1} of {IMPORT_STEPS.length}: {IMPORT_STEPS[current].label}
        </p>
      </div>
    );
  },
};

export const Vertical: Story = {
  render: () => <StepIndicator steps={IMPORT_STEPS} currentStep={1} orientation="vertical" />,
};

export const ThreeStep: Story = {
  render: () => (
    <StepIndicator
      steps={[
        { id: 'draft', label: 'Draft' },
        { id: 'review', label: 'Review' },
        { id: 'publish', label: 'Publish' },
      ]}
      currentStep={1}
    />
  ),
};

