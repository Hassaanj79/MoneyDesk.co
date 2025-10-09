"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format: string;
  example: string;
}

const countries: Country[] = [
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', format: '+92 XXX XXXXXXX', example: '+92 300 1234567' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', example: '+1 (555) 123-4567' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', format: '+1 (XXX) XXX-XXXX', example: '+1 (555) 123-4567' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', format: '+44 XXXX XXXXXX', example: '+44 7700 900123' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', format: '+91 XXXXX XXXXX', example: '+91 98765 43210' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', format: '+971 XX XXX XXXX', example: '+971 50 123 4567' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', format: '+966 XX XXX XXXX', example: '+966 50 123 4567' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', format: '+61 XXX XXX XXX', example: '+61 400 123 456' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', format: '+49 XXX XXXXXXX', example: '+49 151 12345678' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', format: '+33 X XX XX XX XX', example: '+33 6 12 34 56 78' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', format: '+81 XX-XXXX-XXXX', example: '+81 90-1234-5678' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', format: '+86 XXX XXXX XXXX', example: '+86 138 0013 8000' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', format: '+55 XX XXXXX-XXXX', example: '+55 11 99999-9999' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', format: '+52 XXX XXX XXXX', example: '+52 55 1234 5678' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', format: '+7 XXX XXX-XX-XX', example: '+7 912 345-67-89' },
];

interface CountrySelectorProps {
  selectedCountry: Country;
  onCountrySelect: (country: Country) => void;
  phoneNumber: string;
  onPhoneNumberChange: (phoneNumber: string) => void;
}

export function CountrySelector({ selectedCountry, onCountrySelect, phoneNumber, onPhoneNumberChange }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const formatPhoneNumber = (value: string, country: Country) => {
    // Remove all non-numeric characters except +
    let phoneNumber = value.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add the country dial code
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = country.dialCode + phoneNumber;
    }
    
    // Format based on country
    const digits = phoneNumber.slice(country.dialCode.length);
    
    switch (country.code) {
      case 'PK':
        if (digits.length >= 10) {
          return `${country.dialCode} ${digits.slice(0, 3)} ${digits.slice(3, 10)}`;
        } else if (digits.length >= 3) {
          return `${country.dialCode} ${digits.slice(0, 3)} ${digits.slice(3)}`;
        } else if (digits.length > 0) {
          return `${country.dialCode} ${digits}`;
        }
        return `${country.dialCode} `;
        
      case 'US':
      case 'CA':
        if (digits.length >= 10) {
          return `${country.dialCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        } else if (digits.length >= 6) {
          return `${country.dialCode} (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length >= 3) {
          return `${country.dialCode} (${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else if (digits.length > 0) {
          return `${country.dialCode} (${digits}`;
        }
        return `${country.dialCode} `;
        
      case 'GB':
        if (digits.length >= 10) {
          return `${country.dialCode} ${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
        } else if (digits.length >= 4) {
          return `${country.dialCode} ${digits.slice(0, 4)} ${digits.slice(4)}`;
        } else if (digits.length > 0) {
          return `${country.dialCode} ${digits}`;
        }
        return `${country.dialCode} `;
        
      case 'IN':
        if (digits.length >= 10) {
          return `${country.dialCode} ${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
        } else if (digits.length >= 5) {
          return `${country.dialCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
        } else if (digits.length > 0) {
          return `${country.dialCode} ${digits}`;
        }
        return `${country.dialCode} `;
        
      default:
        return phoneNumber;
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value, selectedCountry);
    onPhoneNumberChange(formatted);
  };

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country);
    setOpen(false);
    
    // Reformat the phone number with the new country format
    const currentDigits = phoneNumber.replace(/[^\d]/g, '');
    const newFormatted = formatPhoneNumber(currentDigits, country);
    onPhoneNumberChange(newFormatted);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Phone Number</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dialCode}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{country.flag}</span>
                        <span className="font-medium">{country.name}</span>
                        <span className="text-muted-foreground">{country.dialCode}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder={selectedCountry.example}
              value={phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Format: {selectedCountry.format}
      </p>
    </div>
  );
}
