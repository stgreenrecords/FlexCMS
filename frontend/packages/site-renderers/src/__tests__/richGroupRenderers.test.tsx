/**
 * The layout inference is the part that turns 380 field-list components into pages,
 * so it is the part worth pinning.
 *
 * Each case asserts the *semantics* the layout is supposed to produce — a real input,
 * a real table, a real disclosure — rather than class names, so restyling does not
 * break the suite but losing the interactive control does.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRichGroupRenderer } from '../richGroupRenderers';

const Renderer = createRichGroupRenderer('Test Group');

describe('rich group renderers', () => {
  it('renders a real form, not a list of field names', () => {
    render(
      <Renderer
        resourceType="tut-usa/forms-data-capture-consent/lead-form"
        data={{
          title: 'Request a test drive',
          submitLabel: 'Book now',
          fields: [
            { label: 'Full name', type: 'text', required: true },
            { label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Preferred model', options: ['TUT S', 'TUT Eon'] },
            { label: 'Notes', type: 'textarea' },
          ],
        }}
      />,
    );

    // This is the regression that mattered: all 42 form components used to render no
    // interactive control whatsoever.
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    expect(screen.getByRole('combobox', { name: /preferred model/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'TUT Eon' })).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i).tagName).to.equal('TEXTAREA');
    expect(screen.getByRole('button', { name: 'Book now' })).toBeInTheDocument();
  });

  it('marks a required field and defaults the submit label', () => {
    render(
      <Renderer
        resourceType="tut-usa/forms-data-capture-consent/contact-form"
        data={{ fields: [{ label: 'Email', required: true }] }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders question/answer content as disclosures', () => {
    render(
      <Renderer
        resourceType="tut-usa/support-documentation-knowledge/faq"
        data={{
          title: 'Ownership questions',
          questions: [
            { question: 'How long is the warranty?', answer: 'Eight years.' },
            { question: 'Is servicing included?', answer: 'For the first three years.' },
          ],
        }}
      />,
    );

    expect(screen.getByText('How long is the warranty?')).toBeInTheDocument();
    expect(screen.getByText('Eight years.')).toBeInTheDocument();
    expect(document.querySelectorAll('details')).toHaveLength(2);
  });

  it('renders uniform records as a table', () => {
    render(
      <Renderer
        resourceType="tut-usa/commerce-catalog-merchandising/spec-table"
        data={{
          title: 'Specifications',
          columns: ['model', 'range', 'price'],
          rows: [
            { model: 'TUT S', range: '480mi', price: '$79,990' },
            { model: 'TUT Eon', range: '410mi', price: '$69,990' },
          ],
        }}
      />,
    );

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: /range/i })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '$79,990' })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(3); // header + 2
  });

  it('renders a collection with images as cards rather than a table', () => {
    render(
      <Renderer
        resourceType="tut-usa/editorial-article-content/story-grid"
        data={{
          title: 'Latest stories',
          items: [
            { title: 'Design', description: 'Form follows range.', image: '/a.jpg', category: 'Editorial' },
            { title: 'Battery', description: 'Cell chemistry.', image: '/b.jpg', category: 'Engineering' },
            { title: 'Service', description: 'Concierge care.', image: '/c.jpg', category: 'Ownership' },
          ],
        }}
      />,
    );

    // Three records with three shared keys would otherwise qualify as a table; the
    // presence of imagery is what makes cards the right call.
    expect(screen.queryByRole('table')).to.equal(null);
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByText('Form follows range.')).toBeInTheDocument();
    expect(document.querySelectorAll('img[src="/b.jpg"]')).toHaveLength(1);
  });

  it('renders steps in order with their position', () => {
    render(
      <Renderer
        resourceType="tut-usa/layout-page-structure/numbered-steps"
        data={{
          title: 'How ordering works',
          steps: [{ title: 'Configure' }, { title: 'Reserve' }, { title: 'Collect' }],
        }}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Step 1');
    expect(items[2]).toHaveTextContent('Collect');
  });

  it('renders links as links', () => {
    render(
      <Renderer
        resourceType="tut-usa/navigation-search-discovery/links-group"
        data={{
          title: 'Explore',
          links: [
            { label: 'Vehicles', url: '/vehicles' },
            { label: 'Owners', url: '/owners' },
          ],
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Vehicles' })).toHaveAttribute('href', '/vehicles');
    expect(screen.getByRole('link', { name: 'Owners' })).toBeInTheDocument();
  });

  it('promotes a role-named image to the section media', () => {
    const { container } = render(
      <Renderer
        resourceType="tut-usa/media-visual-storytelling-assets/spotlight"
        data={{ title: 'Spotlight', heroImage: { url: '/hero.jpg' } }}
      />,
    );

    expect(container.querySelector('img[src="/hero.jpg"]')).toBeInTheDocument();
  });

  it('renders rich-text bodies as markup, not as visible tags', () => {
    render(
      <Renderer
        resourceType="tut-usa/forms-data-capture-consent/privacy-notice"
        data={{ title: 'Privacy notice', body: '<p>We use inquiry data to <strong>coordinate support</strong>.</p>' }}
      />,
    );

    // Authors were shown the literal "<p>...</p>" on the page.
    expect(screen.queryByText(/<p>/)).to.equal(null);
    expect(screen.getByText('coordinate support').tagName).to.equal('STRONG');
  });

  it('leaves plain text alone', () => {
    render(
      <Renderer
        resourceType="tut-usa/editorial-article-content/note"
        data={{ title: 'Note', body: 'A 5 < 7 comparison, not markup' }}
      />,
    );

    expect(screen.getByText('A 5 < 7 comparison, not markup')).toBeInTheDocument();
  });

  it('renders a call to action as a link when it has one', () => {
    render(
      <Renderer
        resourceType="tut-usa/calls-to-action-promotions-campaigns/promo"
        data={{ title: 'Book a drive', cta: { label: 'Start', url: '/start' } }}
      />,
    );

    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/start');
  });

  it('titles a section from its resource type when nothing is authored', () => {
    render(
      <Renderer resourceType="tut-usa/brand-corporate-investor-governance/board-list" data={{ items: ['Ada'] }} />,
    );

    expect(screen.getByRole('heading', { name: /board list/i })).toBeInTheDocument();
  });

  it('prefers a form layout when a component has both fields and questions', () => {
    render(
      <Renderer
        resourceType="tut-usa/forms-data-capture-consent/feedback-form"
        data={{
          title: 'Feedback',
          fields: [{ label: 'Rating' }],
          questions: [{ question: 'Anything else?' }],
        }}
      />,
    );

    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
    expect(document.querySelectorAll('details')).toHaveLength(0);
  });
});
