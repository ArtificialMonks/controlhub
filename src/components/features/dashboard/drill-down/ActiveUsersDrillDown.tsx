// src/components/dashboard/drill-down/ActiveUsersDrillDown.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  DrillDownSection, 
  DrillDownMetric 
} from '@/components/ui/drill-down-modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts'
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Activity,
  Clock,
  TrendingUp,
  MapPin,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

interface ActiveUsersDrillDownProps {
  activeUsers?: number
}

export function ActiveUsersDrillDown({ activeUsers = 150 }: ActiveUsersDrillDownProps) {
  const [timeRange, setTimeRange] = useState('7d')
  const [viewType, setViewType] = useState<'activity' | 'demographics'>('activity')

  // Generate mock user data
  const mockUsers = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown', 
              'Emily Davis', 'Chris Wilson', 'Amy Martinez', 'Ryan Garcia', 'Lisa Anderson'][i],
      email: `user${i + 1}@example.com`,
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      automationsCount: Math.floor(Math.random() * 20) + 5,
      successRate: Math.floor(Math.random() * 20) + 80,
      status: Math.random() > 0.7 ? 'online' : 'offline'
    }))
  }, [])

  // Calculate user metrics
  const metrics = useMemo(() => {
    const onlineUsers = Math.floor(activeUsers * 0.3)
    const newUsers = Math.floor(Math.random() * 20) + 10
    const returningUsers = activeUsers - newUsers
    const avgSessionDuration = Math.floor(Math.random() * 30) + 15

    return {
      onlineUsers,
      newUsers,
      returningUsers,
      avgSessionDuration,
      growthRate: 24
    }
  }, [activeUsers])

  // Generate activity data
  const activityData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: Math.floor(Math.random() * 30) + activeUsers - 15,
        newUsers: Math.floor(Math.random() * 10) + 5,
        sessions: Math.floor(Math.random() * 200) + 100
      }
    })
  }, [timeRange, activeUsers])

  // User demographics data
  const deviceData = [
    { name: 'Desktop', value: 65, color: '#3b82f6' },
    { name: 'Mobile', value: 25, color: '#10b981' },
    { name: 'Tablet', value: 10, color: '#8b5cf6' }
  ]

  const locationData = [
    { location: 'United States', users: 45 },
    { location: 'United Kingdom', users: 25 },
    { location: 'Canada', users: 15 },
    { location: 'Australia', users: 10 },
    { location: 'Other', users: 5 }
  ]

  // Activity by hour
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    users: Math.floor(Math.random() * 50) + 10
  }))

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Desktop':
        return <Monitor className="h-4 w-4" />
      case 'Mobile':
        return <Smartphone className="h-4 w-4" />
      case 'Tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DrillDownMetric
          label="Total Active Users"
          value={activeUsers}
          trend="up"
          trendValue={`+${metrics.growthRate}%`}
          icon={<Users className="h-5 w-5 text-orange-500" />}
        />
        <DrillDownMetric
          label="Online Now"
          value={metrics.onlineUsers}
          icon={<UserCheck className="h-5 w-5 text-green-500" />}
        />
        <DrillDownMetric
          label="New Users"
          value={metrics.newUsers}
          trend="up"
          trendValue="+15%"
          icon={<UserPlus className="h-5 w-5 text-blue-500" />}
        />
        <DrillDownMetric
          label="Avg Session"
          value={`${metrics.avgSessionDuration}m`}
          icon={<Clock className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* User Activity Chart */}
      <DrillDownSection 
        title="User Activity"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'activity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('activity')}
            >
              Activity
            </Button>
            <Button
              variant={viewType === 'demographics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('demographics')}
            >
              Demographics
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {viewType === 'activity' ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.5rem',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device Distribution */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/10">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Device Usage</h4>
              <div className="space-y-3">
                {deviceData.map((device) => (
                  <div key={device.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.name)}
                      <span className="text-sm">{device.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{device.value}%</span>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${device.value}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full"
                          style={{ backgroundColor: device.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Distribution */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/10">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Top Locations</h4>
              <div className="space-y-3">
                {locationData.map((item) => (
                  <div key={item.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.location}</span>
                    </div>
                    <Badge variant="secondary">{item.users}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrillDownSection>

      {/* User Engagement */}
      <DrillDownSection title="User Engagement">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
            <Activity className="h-5 w-5 text-orange-500 mb-2" />
            <h4 className="font-medium mb-1">High Engagement</h4>
            <p className="text-2xl font-bold">{Math.floor(activeUsers * 0.6)}</p>
            <p className="text-sm text-muted-foreground">Daily active users</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
            <TrendingUp className="h-5 w-5 text-blue-500 mb-2" />
            <h4 className="font-medium mb-1">Growing</h4>
            <p className="text-2xl font-bold">+{metrics.growthRate}%</p>
            <p className="text-sm text-muted-foreground">Monthly growth rate</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
            <UserCheck className="h-5 w-5 text-green-500 mb-2" />
            <h4 className="font-medium mb-1">Retention</h4>
            <p className="text-2xl font-bold">85%</p>
            <p className="text-sm text-muted-foreground">User retention rate</p>
          </div>
        </div>
      </DrillDownSection>

      {/* Recent Active Users */}
      <DrillDownSection title="Recent Active Users">
        <div className="space-y-2">
          {mockUsers.slice(0, 5).map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/10 hover:bg-white/60 dark:hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.automationsCount} automations</p>
                  <p className="text-xs text-muted-foreground">
                    Last active {new Date(user.lastActive).toLocaleString('en-US', { 
                      hour: 'numeric', 
                      minute: 'numeric' 
                    })}
                  </p>
                </div>
                <Badge 
                  variant="secondary"
                  className={user.status === 'online' ? 'bg-green-500/10 text-green-500' : ''}
                >
                  {user.status}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            View All Users
          </Button>
        </div>
      </DrillDownSection>

      {/* Activity Heatmap */}
      <DrillDownSection title="Activity by Hour">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false}
                interval={3}
              />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                {hourlyActivity.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.users > 30 ? '#f97316' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DrillDownSection>
    </div>
  )
}