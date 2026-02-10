export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read_at?: string;
  data?: {
    action_url?: string;
    entity_type?: string;
    entity_id?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface NotificationStatistics {
  total: number;
  unread: number;
  action_required: number;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  categories: Record<string, boolean>;
}
