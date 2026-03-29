export interface AllergenNoticeData {
  title: string;
  message: string;
  allergens: string[];
  contact: string;
}

export function AllergenNotice({ data }: { data: AllergenNoticeData }) {
  return (
    <div className="bg-error-container border-l-4 border-error p-6">
      <h4 className="font-label uppercase text-xs tracking-widest text-on-error-container font-bold mb-2">
        {data.title || 'Allergen Warning'}
      </h4>
      {data.message && <p className="font-body text-sm text-on-error-container mb-3">{data.message}</p>}
      {data.allergens && data.allergens.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {data.allergens.map((a, i) => (
            <span key={i} className="bg-error text-on-error px-3 py-1 font-label uppercase text-xs tracking-widest">
              {a}
            </span>
          ))}
        </div>
      )}
      {data.contact && (
        <p className="font-body text-xs text-on-error-container">
          Questions? <a href={data.contact} className="underline">{data.contact}</a>
        </p>
      )}
    </div>
  );
}
