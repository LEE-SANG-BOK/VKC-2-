export type EventType = 'view' | 'search' | 'like' | 'answer' | 'comment' | 'bookmark' | 'follow' | 'report' | 'share';

export type EventEntityType = 'post' | 'answer' | 'comment' | 'user' | 'search';

export interface EventLogRequest {
  eventType: EventType;
  entityType: EventEntityType;
  entityId?: string;
  sessionId?: string;
  locale?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}
