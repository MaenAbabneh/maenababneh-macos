import { create } from "zustand";

export type SystemNotification = {
  id: string;
  appName: string;
  appIcon?: string;
  title: string;
  message: string;
  createdAt: number;
};

type NotificationState = {
  notifications: SystemNotification[];
};

type NotificationActions = {
  pushNotification: (
    payload: Omit<SystemNotification, "id" | "createdAt">,
  ) => void;
  dismissNotification: (id: string) => void;
};

export type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  pushNotification: ({ appName, appIcon, title, message }) =>
    set((state) => ({
      notifications: [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          appName,
          appIcon,
          title,
          message,
          createdAt: Date.now(),
        },
        ...state.notifications,
      ].slice(0, 4),
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    })),
}));
