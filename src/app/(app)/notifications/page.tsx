

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { useNotifications } from "@/contexts/notification-context";
import { cn } from "@/lib/utils";
import { Bell, BellOff } from "lucide-react";

export default function NotificationsPage() {
  // const { notifications, markAllAsRead } = useNotifications();
  const notifications: any[] = [];
  const markAllAsRead = () => {}; // Empty array since notifications are disabled
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            You have {unreadCount} unread message{unreadCount !== 1 && 's'}.
          </CardDescription>
        </div>
        <Button 
            className="ml-auto gap-1" 
            onClick={markAllAsRead} 
            disabled={unreadCount === 0}
        >
            <Bell className="h-4 w-4" />
            Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start p-4 rounded-lg border",
                    notification.read ? "bg-card" : "bg-primary/10 border-primary/50"
                  )}
                >
                  <div className="p-2 bg-muted rounded-full">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-base font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <BellOff className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">You have no notifications.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    
