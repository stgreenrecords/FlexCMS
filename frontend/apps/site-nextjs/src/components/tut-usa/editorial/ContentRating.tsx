'use client';

import { useState } from 'react';

export interface ContentRatingData {
  question: string;
  scale: 'stars' | 'thumbs' | 'numeric';
  submitAction: string;
  thankYouMessage: string;
}

interface Props {
  data: ContentRatingData;
}

export function ContentRating({ data }: Props) {
  const { question, scale, submitAction: _submitAction, thankYouMessage } = data;
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 text-center">
        <p className="font-headline italic text-on-surface text-lg">{thankYouMessage}</p>
      </div>
    );
  }

  const renderOptions = () => {
    if (scale === 'stars') {
      return (
        <div className="flex gap-2" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSelected(n)}
              aria-label={`${n} star${n !== 1 ? 's' : ''}`}
              aria-pressed={selected !== null && selected >= n}
              className={`text-2xl transition-colors ${
                selected !== null && selected >= n ? 'text-primary' : 'text-on-surface-variant/30'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      );
    }

    if (scale === 'thumbs') {
      return (
        <div className="flex gap-4" role="group" aria-label="Thumbs rating">
          {[
            { value: 1, label: '👍', ariaLabel: 'Thumbs up' },
            { value: 0, label: '👎', ariaLabel: 'Thumbs down' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              aria-label={opt.ariaLabel}
              aria-pressed={selected === opt.value}
              className={`text-2xl p-2 rounded-lg border transition-colors ${
                selected === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-outline-variant/20 hover:border-primary/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    // numeric 1-10
    return (
      <div className="flex flex-wrap gap-2" role="group" aria-label="Numeric rating 1-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSelected(n)}
            aria-label={`${n} out of 10`}
            aria-pressed={selected === n}
            className={`w-9 h-9 rounded-lg border text-sm font-label transition-colors ${
              selected === n
                ? 'border-primary bg-primary text-surface font-bold'
                : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/40'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4">
      <p className="font-headline italic text-on-surface text-lg">{question}</p>
      {renderOptions()}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selected === null}
        className="self-start font-label tracking-widest uppercase text-xs px-4 py-2 rounded border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  );
}
