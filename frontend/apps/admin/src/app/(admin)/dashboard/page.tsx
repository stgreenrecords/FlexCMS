import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@flexcms/ui';

/**
 * Admin Dashboard — landing page after login.
 * Shows quick stats, recent content, and workflow inbox.
 *
 * Layout is provided by the parent (admin)/layout.tsx AppShell.
 */
export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-6 text-xs font-medium" style={{ color: '#c3c6d6' }}>
        <span>Workspace</span>
        <span aria-hidden="true" style={{ color: '#8d90a0' }}>›</span>
        <span style={{ color: '#e5e2e1' }}>Dashboard</span>
      </nav>

      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#e5e2e1' }}>
            CMS Overview
          </h1>
          <p className="text-sm" style={{ color: '#c3c6d6' }}>
            Monitor site performance and recent content activity
          </p>
        </div>
        <Button
          style={{
            background: 'linear-gradient(135deg, #b0c6ff 0%, #0058cc 100%)',
            color: '#002d6f',
            border: 'none',
          }}
        >
          + Create New Page
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Pages', value: '2,482', change: '+12%', changeColor: '#34d399' },
          { label: 'Active Sites', value: '14', change: 'Static', changeColor: '#8d90a0' },
          { label: 'Pending Workflows', value: '38', change: 'Urgent', changeColor: '#ffb59b' },
          { label: 'DAM Assets', value: '12,540', change: '82% Used', changeColor: '#8d90a0' },
        ].map(({ label, value, change, changeColor }) => (
          <div
            key={label}
            className="rounded-xl p-6 hover:brightness-110 transition-all cursor-default"
            style={{
              background: '#2a2a2a',
              borderLeft: '4px solid rgba(176, 198, 255, 0.4)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: changeColor, background: `${changeColor}1a` }}
              >
                {change}
              </span>
            </div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest mb-1" style={{ color: '#8d90a0' }}>
              {label}
            </p>
            <p className="text-2xl font-black" style={{ color: '#e5e2e1' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for content management</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Create Page</Button>
          <Button variant="outline">Upload Asset</Button>
          <Button variant="secondary">View Workflows</Button>
          <Button variant="ghost">Component Registry</Button>
        </CardContent>
      </Card>
    </div>
  );
}
