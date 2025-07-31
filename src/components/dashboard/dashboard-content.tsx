import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardContentProps {
  user: User
  profile: Record<string, unknown> | null
}

export function DashboardContent({ user }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Automation Status</CardTitle>
            <CardDescription>
              Overview of your n8n automations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              All Systems Operational
            </div>
            <p className="text-sm text-gray-600 mt-2">
              0 active automations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Portals</CardTitle>
            <CardDescription>
              Manage client access and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              0 Active Clients
            </div>
            <p className="text-sm text-gray-600 mt-2">
              No client portals configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Score</CardTitle>
            <CardDescription>
              Your automation performance rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              100%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Perfect uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your account details and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">User ID</label>
              <p className="text-sm text-gray-900 font-mono">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Account Created</label>
              <p className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Sign In</label>
              <p className="text-sm text-gray-900">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
