import React from 'react';

export interface FaqData {
  title: string;
  questions: { question: string; answer: string }[];
  schemaMarkup: boolean;
}

interface Props {
  data: FaqData;
  children?: React.ReactNode;
}

export function Faq({ data, children }: Props) {
  const { title, questions, schemaMarkup } = data;

  const schemaData = schemaMarkup
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      })
    : null;

  return (
    <section className="py-8">
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaData }}
        />
      )}
      {title && (
        <h2 className="font-headline italic text-on-surface text-3xl mb-8">{title}</h2>
      )}
      <div className="flex flex-col gap-4">
        {questions.map((q, i) => (
          <div
            key={i}
            className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-6"
          >
            <h3 className="font-label tracking-widest uppercase text-sm text-on-surface mb-2">
              {q.question}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{q.answer}</p>
          </div>
        ))}
      </div>
      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}
