"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'Clean and bright interface',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes in low light',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Follows your device setting',
  },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-1">Theme Preference</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want the app to look
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <div className={cn(
                  "font-medium text-sm mb-1",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {themeOption.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {themeOption.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
