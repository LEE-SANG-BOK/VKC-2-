'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, MessageSquare, Flag, ShieldCheck, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '@/repo/admin/query';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  posts: {
    label: '게시글',
    color: 'hsl(var(--chart-1))',
  },
  users: {
    label: '유저',
    color: 'hsl(var(--chart-2))',
  },
  comments: {
    label: '댓글',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: '전체 유저',
      value: stats?.totalUsers || 0,
      description: `이번 달 신규: ${stats?.newUsersThisMonth || 0}명`,
      icon: Users,
    },
    {
      title: '전체 게시글',
      value: stats?.totalPosts || 0,
      description: '누적 게시글 수',
      icon: FileText,
    },
    {
      title: '전체 댓글',
      value: stats?.totalComments || 0,
      description: '답변 포함',
      icon: MessageSquare,
    },
    {
      title: '대기 중인 신고',
      value: stats?.pendingReports || 0,
      description: `24시간 초과 미처리: ${stats?.overdueReports ?? 0}건`,
      icon: Flag,
      highlight: (stats?.pendingReports || 0) > 0,
      href: '/admin/reports?status=pending',
    },
    {
      title: '대기 중인 인증',
      value: stats?.pendingVerifications || 0,
      description: `24시간 초과 미처리: ${stats?.overdueVerifications ?? 0}건`,
      icon: ShieldCheck,
      highlight: (stats?.pendingVerifications || 0) > 0,
      href: '/admin/verifications?status=pending',
    },
    {
      title: '활성 유저',
      value: `${stats?.dau || 0} / ${stats?.wau || 0} / ${stats?.mau || 0}`,
      description: 'DAU / WAU / MAU',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">대시보드</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className={stat.highlight ? 'border-red-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.highlight ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-red-500' : ''}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.href && (
                <a
                  href={stat.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  바로가기 →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>활동 개요</CardTitle>
          <CardDescription>최근 7일간 게시글, 유저, 댓글 추이</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.chartData && stats.chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="posts"
                  stackId="1"
                  stroke="var(--color-posts)"
                  fill="var(--color-posts)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="2"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="comments"
                  stackId="3"
                  stroke="var(--color-comments)"
                  fill="var(--color-comments)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
