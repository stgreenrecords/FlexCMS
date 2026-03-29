import type { AccountField } from './RegistrationForm';

export interface ProfileSummaryData {
  title: string;
  fields: (AccountField & { value: string })[];
  editUrl: string;
}

export function ProfileSummary({ data }: { data: ProfileSummaryData }) {
  return (
    <section className="bg-surface-container p-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline italic text-3xl text-on-surface">{data.title}</h2>
        {data.editUrl && (
          <a href={data.editUrl} className="font-label uppercase text-xs tracking-widest text-primary hover:underline">
            Edit Profile
          </a>
        )}
      </div>
      {data.fields && data.fields.length > 0 && (
        <dl className="space-y-4">
          {data.fields.map((f, i) => (
            <div key={i} className="flex items-start gap-8 border-b border-outline-variant/20 pb-4">
              <dt className="font-label uppercase text-xs tracking-widest text-secondary w-32 flex-shrink-0">{f.label}</dt>
              <dd className="font-body text-sm text-on-surface">{f.value || '—'}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
