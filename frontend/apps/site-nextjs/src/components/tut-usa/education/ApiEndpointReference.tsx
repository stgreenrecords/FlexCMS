const safeHtml = (html: string) => html.replace(/<script[\s\S]*?<\/script>/gi, '');

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpointReferenceData {
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  parameters: ApiParameter[];
  responseExample: string;
}

const METHOD_STYLES: Record<HttpMethod, { bg: string; text: string }> = {
  GET: { bg: 'var(--color-tertiary-container)', text: 'var(--color-on-tertiary-container)' },
  POST: { bg: 'var(--color-primary-container)', text: 'var(--color-on-primary-container)' },
  PUT: { bg: 'var(--color-secondary-container)', text: 'var(--color-on-secondary-container)' },
  DELETE: { bg: 'var(--color-error-container)', text: 'var(--color-on-error-container)' },
  PATCH: { bg: 'var(--color-tertiary-container)', text: 'var(--color-on-tertiary-container)' },
};

interface Props {
  data: ApiEndpointReferenceData;
}

export function ApiEndpointReference({ data }: Props) {
  const { name, method, path, description, parameters, responseExample } = data;
  const methodStyle = METHOD_STYLES[method] ?? METHOD_STYLES.GET;

  return (
    <section className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-outline-variant">
        <span
          className="shrink-0 text-xs font-label font-bold px-2.5 py-1 rounded uppercase tracking-wide"
          style={{ backgroundColor: methodStyle.bg, color: methodStyle.text }}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-on-surface flex-1 break-all">{path}</code>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-headline text-lg text-on-surface">{name}</h3>
          <div
            className="text-sm text-secondary leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: safeHtml(description) }}
          />
        </div>

        {/* Parameters table */}
        {parameters.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
              Parameters
            </h4>
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left border-b border-outline-variant"
                    style={{ backgroundColor: 'var(--color-surface-variant)' }}
                  >
                    <th className="px-4 py-2.5 font-label font-semibold text-secondary text-xs uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-2.5 font-label font-semibold text-secondary text-xs uppercase tracking-wide">
                      Type
                    </th>
                    <th className="px-4 py-2.5 font-label font-semibold text-secondary text-xs uppercase tracking-wide">
                      Required
                    </th>
                    <th className="px-4 py-2.5 font-label font-semibold text-secondary text-xs uppercase tracking-wide">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, index) => (
                    <tr
                      key={param.name}
                      className={
                        index < parameters.length - 1 ? 'border-b border-outline-variant' : ''
                      }
                    >
                      <td className="px-4 py-3 font-mono text-xs text-on-surface">{param.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-secondary">{param.type}</td>
                      <td className="px-4 py-3">
                        {param.required ? (
                          <span
                            className="text-xs font-label px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--color-error-container)',
                              color: 'var(--color-on-error-container)',
                            }}
                          >
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs font-label text-secondary">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-secondary">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Response example */}
        {responseExample && (
          <div className="flex flex-col gap-3">
            <h4 className="font-label font-semibold text-sm text-secondary uppercase tracking-wider">
              Response Example
            </h4>
            <pre
              className="rounded-lg p-4 text-xs font-mono text-on-surface overflow-x-auto leading-relaxed"
              style={{ backgroundColor: 'var(--color-surface-variant)' }}
            >
              <code>{responseExample}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
