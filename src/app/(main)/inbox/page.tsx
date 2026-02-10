'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';
import { Notification } from '@/types/notification';
import { useRouter } from 'next/navigation';

function getActionLabel(notification: Notification): string | null {
  if (!notification.data?.requires_action) return null;
  const type = notification.data?.type as string | undefined;
  switch (type) {
    case 'cm_planner_new_request':
      return 'Review';
    case 'cm_approval_request':
      return 'Approve';
    default:
      return 'View';
  }
}

function NotificationList({
  notifications,
  onNotificationClick,
  onAction,
}: {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onAction: (notification: Notification) => void;
}) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications"
        description="Notifications will appear here"
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {notifications.map((notification) => {
        const actionLabel = getActionLabel(notification);
        return (
          <div
            key={notification.id}
            role="button"
            tabIndex={0}
            onClick={() => onNotificationClick(notification)}
            onKeyDown={(e) => { if (e.key === 'Enter') onNotificationClick(notification); }}
            className={cn(
              'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer',
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
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(notification.created_at)}
                </div>
                {actionLabel && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(notification);
                    }}
                  >
                    {actionLabel}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    const url = notification.data?.action_url;
    if (url) {
      router.push(url);
    }
  };

  const handleAction = (notification: Notification) => {
    if (!notification.read_at) {
      markReadMutation.mutate(notification.id);
    }
    const url = notification.data?.action_url;
    if (url) {
      router.push(url);
    }
  };

  const stats = statsData?.data;
  const notifications = data?.data || [];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Inbox"
        actions={
          stats?.unread ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Read All
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-background px-4">
          <TabsTrigger value="all" className="relative">
            All
            {stats?.total != null && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {stats?.unread != null && stats.unread > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="action" className="relative">
            Action Required
            {stats?.action_required != null && stats.action_required > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {stats.action_required}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <PageLoading />
        ) : (
          <PullToRefresh onRefresh={handleRefresh} className="flex-1">
            <TabsContent value="all" className="mt-0">
              <NotificationList notifications={notifications} onNotificationClick={handleNotificationClick} onAction={handleAction} />
            </TabsContent>
            <TabsContent value="unread" className="mt-0">
              <NotificationList notifications={notifications} onNotificationClick={handleNotificationClick} onAction={handleAction} />
            </TabsContent>
            <TabsContent value="action" className="mt-0">
              <NotificationList notifications={notifications} onNotificationClick={handleNotificationClick} onAction={handleAction} />
            </TabsContent>
          </PullToRefresh>
        )}
      </Tabs>
    </div>
  );
}
