"use client";

import { useState, useEffect, useRef } from 'react';
import { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode, getCountries } from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: Country | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

// Get all countries with their calling codes
const getAllCountries = (): Country[] => {
  const countries = getCountries();
  return countries.map(countryCode => {
    const callingCode = getCountryCallingCode(countryCode);
    return {
      code: countryCode,
      name: new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode,
      callingCode: `+${callingCode}`,
      flag: getCountryFlag(countryCode)
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
};

// Get country flag emoji
const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Detect country from phone number
const detectCountryFromPhone = (phoneNumber: string): Country | null => {
  try {
    if (!phoneNumber.startsWith('+')) return null;
    
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed || !parsed.country) return null;
    
    const countries = getAllCountries();
    return countries.find(country => country.code === parsed.country) || null;
  } catch {
    return null;
  }
};

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
  required = false,
  id
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const countries = getAllCountries();
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.callingCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize country from phone number
  useEffect(() => {
    if (value) {
      const detectedCountry = detectCountryFromPhone(value);
      if (detectedCountry) {
        setSelectedCountry(detectedCountry);
        setPhoneNumber(value);
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Auto-detect country when phone number changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.startsWith('+')) {
      const detectedCountry = detectCountryFromPhone(phoneNumber);
      if (detectedCountry && detectedCountry.code !== selectedCountry?.code) {
        setSelectedCountry(detectedCountry);
        onCountryChange?.(detectedCountry);
      }
    }
  }, [phoneNumber, selectedCountry, onCountryChange]);

  // Validate phone number
  useEffect(() => {
    if (phoneNumber) {
      const valid = isValidPhoneNumber(phoneNumber);
      setIsValid(valid);
    } else {
      setIsValid(true);
    }
  }, [phoneNumber]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onCountryChange?.(country);
    setIsOpen(false);
    setSearchTerm('');
    
    // Focus back to phone input
    setTimeout(() => {
      const phoneInput = document.getElementById(id || 'phone-input');
      if (phoneInput) {
        (phoneInput as HTMLInputElement).focus();
      }
    }, 100);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPhoneNumber(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className={cn(
          "flex rounded-md border border-input transition-colors",
          "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-1",
          !isValid && "border-red-500 focus-within:border-red-500 focus-within:ring-red-500",
          className
        )}>
          {/* Country Selector */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              "px-3 py-2 h-10 rounded-l-md rounded-r-none border-0 flex items-center gap-2 min-w-[120px] font-sans",
              "hover:bg-accent hover:text-accent-foreground",
              className
            )}
          >
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-medium">{selectedCountry.callingCode}</span>
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                <span className="text-sm">Country</span>
              </>
            )}
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>
          
          {/* Phone Number Input */}
          <Input
            id={id || 'phone-input'}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              "rounded-r-md rounded-l-none border-0 flex-1 font-sans",
              "focus:outline-none",
              className
            )}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-hidden animate-in fade-in-0 zoom-in-95"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm font-sans focus:ring-1 focus:ring-primary focus:ring-offset-1"
                  autoFocus
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 transition-colors font-sans",
                      selectedCountry?.code === country.code && "bg-primary/10 text-primary-foreground"
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {country.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {country.callingCode}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center font-sans">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Message */}
      {!isValid && phoneNumber && (
        <p className="text-xs text-red-500 font-sans">
          Please enter a valid phone number
        </p>
      )}
    </div>
  );
}
