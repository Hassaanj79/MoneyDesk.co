"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Globe } from 'lucide-react';

export function LanguageSelectorDropdown() {
  const { locale, setLocale, availableLocales } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLanguage = availableLocales.find(lang => lang.code === locale) || availableLocales[0];

  const handleLanguageChange = (languageCode: string) => {
    setLocale(languageCode);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Language
      </label>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
            aria-label="Select language"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="font-medium">{currentLanguage.nativeName}</span>
              <span className="text-sm text-gray-500">({currentLanguage.name})</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[200px]" align="start">
          {availableLocales.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-sm text-gray-500">({language.name})</span>
              </div>
              {locale === language.code && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Choose your preferred language for the application interface.
      </p>
    </div>
  );
}
