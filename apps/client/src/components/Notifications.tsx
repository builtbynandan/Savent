import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  NotificationContext,
  type NotificationContextValue,
  type NotificationKind,
} from './notification-context';

type Notification = {
  id: number;
  kind: NotificationKind;
  message: string;
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`notification ${notification.kind}`}
      role={notification.kind === 'error' ? 'alert' : 'status'}
    >
      <span aria-hidden="true">
        {notification.kind === 'success' ? '✓' : '!'}
      </span>
      <p>{notification.message}</p>
      <button
        aria-label="Dismiss notification"
        onClick={onDismiss}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify(message, kind = 'success') {
        const id = Date.now() + Math.random();
        setNotifications((current) => [
          ...current.slice(-2),
          { id, kind, message },
        ]);
      },
    }),
    [],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="notification-region"
        role="region"
      >
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => dismiss(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
