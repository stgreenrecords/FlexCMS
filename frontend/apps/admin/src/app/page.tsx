import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@flexcms/ui';
import { createServerClient } from '../lib/cms-client';

/**
 * Admin Dashboard — landing page after login.
 * Shows recent edits, workflow inbox, and quick stats.
 */
export default async function DashboardPage() {
  // Server-side data fetching
  const client = createServerClient();

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">FlexCMS Admin</h1>
        <p className="text-[var(--color-muted-foreground)]">Content management dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardDescription>Total Pages</CardDescription>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending Reviews</CardDescription>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>DAM Assets</CardDescription>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active Sites</CardDescription>
            <CardTitle>—</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Create Page</Button>
          <Button variant="outline">Upload Asset</Button>
          <Button variant="secondary">View Workflows</Button>
          <Button variant="ghost">Component Registry</Button>
        </CardContent>
      </Card>
    </div>
  );
}

