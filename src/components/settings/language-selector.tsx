"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import { Check, Globe, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function LanguageSelector() {
  const { locale, setLocale, availableLocales } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredLocales = availableLocales.filter(locale => 
    locale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locale.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locale.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedLocales = showAll ? filteredLocales : filteredLocales.slice(0, 12);
  const hasMore = filteredLocales.length > 12;

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language Preference
        </CardTitle>
        <CardDescription>
          Choose your preferred language for the application interface. The interface will be updated immediately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Current Selection */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Current Language
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {availableLocales.find(l => l.code === locale)?.nativeName} 
                ({availableLocales.find(l => l.code === locale)?.name})
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {locale.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {displayedLocales.map((lang) => (
            <Button
              key={lang.code}
              variant={locale === lang.code ? "default" : "outline"}
              className={`justify-start h-auto p-3 ${
                locale === lang.code 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-medium">{lang.nativeName}</div>
                  <div className="text-xs opacity-70">{lang.name}</div>
                </div>
                {locale === lang.code && (
                  <Check className="h-4 w-4 ml-2" />
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Show More/Less Button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? 'Show Less' : `Show All ${filteredLocales.length} Languages`}
            </Button>
          </div>
        )}

        {/* No Results */}
        {filteredLocales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No languages found matching "{searchTerm}"</p>
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="mt-2"
            >
              Clear Search
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
