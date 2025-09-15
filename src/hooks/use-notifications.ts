
"use client";

import { useNotificationContext } from "@/contexts/notification-context";

export const useNotifications = () => {
  const context = useNotificationContext();
  return context;
};
