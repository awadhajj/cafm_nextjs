'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { Notification } from '@/types/notification';
import { useRouter } from 'next/navigation';

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: statsData } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: notificationsApi.statistics,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (activeTab === 'unread') params.unread = '1';
      if (activeTab === 'action') params.action_required = '1';
      return notificationsApi.list(params);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id);
    }
    // Navigate to deep link if available
    const url = notification.data?.action_url;
    if (url) {
      router.push(url);
    }
  };

  const stats = statsData?.data;
  const notifications = data?.data || [];

  const tabs = [
    { key: 'all', label: 'All', count: stats?.total },
    { key: 'unread', label: 'Unread', count: stats?.unread },
    { key: 'action', label: 'Action Required', count: stats?.action_required },
  ];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Inbox"
        actions={
          stats?.unread ? (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-primary"
            >
              <CheckCheck className="h-4 w-4" />
              Read All
            </button>
          ) : undefined
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {isLoading ? (
        <PageLoading />
      ) : (
        <PullToRefresh onRefresh={handleRefresh} className="flex-1">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                activeTab === 'unread'
                  ? "You're all caught up!"
                  : 'Notifications will appear here'
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                    !notification.read_at && 'bg-primary/5'
                  )}
                >
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', !notification.read_at && 'font-semibold')}>
                        {notification.title}
                      </p>
                      {!notification.read_at && (
                        <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(notification.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </PullToRefresh>
      )}
    </div>
  );
}
