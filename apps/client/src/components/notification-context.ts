import { createContext, useContext } from 'react';

export type NotificationKind = 'success' | 'error';

export type NotificationContextValue = {
  notify: (message: string, kind?: NotificationKind) => void;
};

export const NotificationContext =
  createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      'useNotifications must be used inside NotificationProvider',
    );
  return context;
}
