export interface Timezone {
  value: string
  label: string
  country: string
  countryCode: string
  offset: string
  utcOffset: number
}

export const TIMEZONES: Timezone[] = [
  // North America
  { value: 'America/New_York', label: 'Eastern Time (ET)', country: 'United States', countryCode: 'US', offset: 'UTC-5/-4', utcOffset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', country: 'United States', countryCode: 'US', offset: 'UTC-6/-5', utcOffset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', country: 'United States', countryCode: 'US', offset: 'UTC-7/-6', utcOffset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', country: 'United States', countryCode: 'US', offset: 'UTC-8/-7', utcOffset: -8 },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', country: 'United States', countryCode: 'US', offset: 'UTC-9/-8', utcOffset: -9 },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', country: 'United States', countryCode: 'US', offset: 'UTC-10', utcOffset: -10 },
  { value: 'America/Toronto', label: 'Eastern Time (ET)', country: 'Canada', countryCode: 'CA', offset: 'UTC-5/-4', utcOffset: -5 },
  { value: 'America/Winnipeg', label: 'Central Time (CT)', country: 'Canada', countryCode: 'CA', offset: 'UTC-6/-5', utcOffset: -6 },
  { value: 'America/Edmonton', label: 'Mountain Time (MT)', country: 'Canada', countryCode: 'CA', offset: 'UTC-7/-6', utcOffset: -7 },
  { value: 'America/Vancouver', label: 'Pacific Time (PT)', country: 'Canada', countryCode: 'CA', offset: 'UTC-8/-7', utcOffset: -8 },
  { value: 'America/Mexico_City', label: 'Central Time (CT)', country: 'Mexico', countryCode: 'MX', offset: 'UTC-6/-5', utcOffset: -6 },
  { value: 'America/Tijuana', label: 'Pacific Time (PT)', country: 'Mexico', countryCode: 'MX', offset: 'UTC-8/-7', utcOffset: -8 },

  // South America
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)', country: 'Brazil', countryCode: 'BR', offset: 'UTC-3', utcOffset: -3 },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (ART)', country: 'Argentina', countryCode: 'AR', offset: 'UTC-3', utcOffset: -3 },
  { value: 'America/Santiago', label: 'Chile Time (CLT)', country: 'Chile', countryCode: 'CL', offset: 'UTC-3/-4', utcOffset: -3 },
  { value: 'America/Bogota', label: 'Colombia Time (COT)', country: 'Colombia', countryCode: 'CO', offset: 'UTC-5', utcOffset: -5 },
  { value: 'America/Lima', label: 'Peru Time (PET)', country: 'Peru', countryCode: 'PE', offset: 'UTC-5', utcOffset: -5 },
  { value: 'America/Caracas', label: 'Venezuela Time (VET)', country: 'Venezuela', countryCode: 'VE', offset: 'UTC-4', utcOffset: -4 },

  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', country: 'United Kingdom', countryCode: 'GB', offset: 'UTC+0/+1', utcOffset: 0 },
  { value: 'Europe/Dublin', label: 'Greenwich Mean Time (GMT)', country: 'Ireland', countryCode: 'IE', offset: 'UTC+0/+1', utcOffset: 0 },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', country: 'France', countryCode: 'FR', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', country: 'Germany', countryCode: 'DE', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Rome', label: 'Central European Time (CET)', country: 'Italy', countryCode: 'IT', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Madrid', label: 'Central European Time (CET)', country: 'Spain', countryCode: 'ES', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Amsterdam', label: 'Central European Time (CET)', country: 'Netherlands', countryCode: 'NL', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Brussels', label: 'Central European Time (CET)', country: 'Belgium', countryCode: 'BE', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Vienna', label: 'Central European Time (CET)', country: 'Austria', countryCode: 'AT', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Zurich', label: 'Central European Time (CET)', country: 'Switzerland', countryCode: 'CH', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Stockholm', label: 'Central European Time (CET)', country: 'Sweden', countryCode: 'SE', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Oslo', label: 'Central European Time (CET)', country: 'Norway', countryCode: 'NO', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Copenhagen', label: 'Central European Time (CET)', country: 'Denmark', countryCode: 'DK', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)', country: 'Finland', countryCode: 'FI', offset: 'UTC+2/+3', utcOffset: 2 },
  { value: 'Europe/Warsaw', label: 'Central European Time (CET)', country: 'Poland', countryCode: 'PL', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Prague', label: 'Central European Time (CET)', country: 'Czech Republic', countryCode: 'CZ', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Budapest', label: 'Central European Time (CET)', country: 'Hungary', countryCode: 'HU', offset: 'UTC+1/+2', utcOffset: 1 },
  { value: 'Europe/Bucharest', label: 'Eastern European Time (EET)', country: 'Romania', countryCode: 'RO', offset: 'UTC+2/+3', utcOffset: 2 },
  { value: 'Europe/Sofia', label: 'Eastern European Time (EET)', country: 'Bulgaria', countryCode: 'BG', offset: 'UTC+2/+3', utcOffset: 2 },
  { value: 'Europe/Athens', label: 'Eastern European Time (EET)', country: 'Greece', countryCode: 'GR', offset: 'UTC+2/+3', utcOffset: 2 },
  { value: 'Europe/Istanbul', label: 'Turkey Time (TRT)', country: 'Turkey', countryCode: 'TR', offset: 'UTC+3', utcOffset: 3 },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)', country: 'Russia', countryCode: 'RU', offset: 'UTC+3', utcOffset: 3 },

  // Asia
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', country: 'Japan', countryCode: 'JP', offset: 'UTC+9', utcOffset: 9 },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', country: 'South Korea', countryCode: 'KR', offset: 'UTC+9', utcOffset: 9 },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', country: 'China', countryCode: 'CN', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)', country: 'Hong Kong', countryCode: 'HK', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)', country: 'Singapore', countryCode: 'SG', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia Time (MYT)', country: 'Malaysia', countryCode: 'MY', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Manila', label: 'Philippine Time (PHT)', country: 'Philippines', countryCode: 'PH', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)', country: 'Thailand', countryCode: 'TH', offset: 'UTC+7', utcOffset: 7 },
  { value: 'Asia/Ho_Chi_Minh', label: 'Indochina Time (ICT)', country: 'Vietnam', countryCode: 'VN', offset: 'UTC+7', utcOffset: 7 },
  { value: 'Asia/Jakarta', label: 'Western Indonesia Time (WIB)', country: 'Indonesia', countryCode: 'ID', offset: 'UTC+7', utcOffset: 7 },
  { value: 'Asia/Makassar', label: 'Central Indonesia Time (WITA)', country: 'Indonesia', countryCode: 'ID', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Asia/Jayapura', label: 'Eastern Indonesia Time (WIT)', country: 'Indonesia', countryCode: 'ID', offset: 'UTC+9', utcOffset: 9 },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', country: 'India', countryCode: 'IN', offset: 'UTC+5:30', utcOffset: 5.5 },
  { value: 'Asia/Karachi', label: 'Pakistan Standard Time (PKT)', country: 'Pakistan', countryCode: 'PK', offset: 'UTC+5', utcOffset: 5 },
  { value: 'Asia/Dhaka', label: 'Bangladesh Standard Time (BST)', country: 'Bangladesh', countryCode: 'BD', offset: 'UTC+6', utcOffset: 6 },
  { value: 'Asia/Colombo', label: 'Sri Lanka Time (SLST)', country: 'Sri Lanka', countryCode: 'LK', offset: 'UTC+5:30', utcOffset: 5.5 },
  { value: 'Asia/Kathmandu', label: 'Nepal Time (NPT)', country: 'Nepal', countryCode: 'NP', offset: 'UTC+5:45', utcOffset: 5.75 },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', country: 'United Arab Emirates', countryCode: 'AE', offset: 'UTC+4', utcOffset: 4 },
  { value: 'Asia/Riyadh', label: 'Arabia Standard Time (AST)', country: 'Saudi Arabia', countryCode: 'SA', offset: 'UTC+3', utcOffset: 3 },
  { value: 'Asia/Tehran', label: 'Iran Standard Time (IRST)', country: 'Iran', countryCode: 'IR', offset: 'UTC+3:30/+4:30', utcOffset: 3.5 },
  { value: 'Asia/Jerusalem', label: 'Israel Standard Time (IST)', country: 'Israel', countryCode: 'IL', offset: 'UTC+2/+3', utcOffset: 2 },

  // Africa
  { value: 'Africa/Cairo', label: 'Eastern European Time (EET)', country: 'Egypt', countryCode: 'EG', offset: 'UTC+2', utcOffset: 2 },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (SAST)', country: 'South Africa', countryCode: 'ZA', offset: 'UTC+2', utcOffset: 2 },
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT)', country: 'Nigeria', countryCode: 'NG', offset: 'UTC+1', utcOffset: 1 },
  { value: 'Africa/Nairobi', label: 'East Africa Time (EAT)', country: 'Kenya', countryCode: 'KE', offset: 'UTC+3', utcOffset: 3 },
  { value: 'Africa/Casablanca', label: 'Western European Time (WET)', country: 'Morocco', countryCode: 'MA', offset: 'UTC+0/+1', utcOffset: 0 },
  { value: 'Africa/Tunis', label: 'Central European Time (CET)', country: 'Tunisia', countryCode: 'TN', offset: 'UTC+1', utcOffset: 1 },
  { value: 'Africa/Algiers', label: 'Central European Time (CET)', country: 'Algeria', countryCode: 'DZ', offset: 'UTC+1', utcOffset: 1 },

  // Oceania
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', country: 'Australia', countryCode: 'AU', offset: 'UTC+10/+11', utcOffset: 10 },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AET)', country: 'Australia', countryCode: 'AU', offset: 'UTC+10/+11', utcOffset: 10 },
  { value: 'Australia/Brisbane', label: 'Australian Eastern Time (AET)', country: 'Australia', countryCode: 'AU', offset: 'UTC+10', utcOffset: 10 },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWT)', country: 'Australia', countryCode: 'AU', offset: 'UTC+8', utcOffset: 8 },
  { value: 'Australia/Adelaide', label: 'Australian Central Time (ACT)', country: 'Australia', countryCode: 'AU', offset: 'UTC+9:30/+10:30', utcOffset: 9.5 },
  { value: 'Australia/Darwin', label: 'Australian Central Time (ACT)', country: 'Australia', countryCode: 'AU', offset: 'UTC+9:30', utcOffset: 9.5 },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)', country: 'New Zealand', countryCode: 'NZ', offset: 'UTC+12/+13', utcOffset: 12 },
  { value: 'Pacific/Fiji', label: 'Fiji Time (FJT)', country: 'Fiji', countryCode: 'FJ', offset: 'UTC+12', utcOffset: 12 },
  { value: 'Pacific/Guam', label: 'Chamorro Time (ChST)', country: 'Guam', countryCode: 'GU', offset: 'UTC+10', utcOffset: 10 },

  // UTC and GMT
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', country: 'Global', countryCode: 'GLOBAL', offset: 'UTC+0', utcOffset: 0 },
  { value: 'GMT', label: 'Greenwich Mean Time (GMT)', country: 'Global', countryCode: 'GLOBAL', offset: 'UTC+0', utcOffset: 0 },
]

// Helper function to get timezones by country
export function getTimezonesByCountry(countryCode: string): Timezone[] {
  if (countryCode === 'GLOBAL') {
    return TIMEZONES.filter(tz => tz.countryCode === 'GLOBAL')
  }
  return TIMEZONES.filter(tz => tz.countryCode === countryCode)
}

// Helper function to get all unique countries
export function getCountriesWithTimezones(): { code: string; name: string; timezoneCount: number }[] {
  const countryMap = new Map<string, { name: string; count: number }>()
  
  TIMEZONES.forEach(tz => {
    if (tz.countryCode !== 'GLOBAL') {
      const existing = countryMap.get(tz.countryCode)
      if (existing) {
        existing.count++
      } else {
        countryMap.set(tz.countryCode, { name: tz.country, count: 1 })
      }
    }
  })
  
  return Array.from(countryMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      timezoneCount: data.count
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Helper function to get timezone by value
export function getTimezoneByValue(value: string): Timezone | undefined {
  return TIMEZONES.find(tz => tz.value === value)
}

// Helper function to get current time in timezone
export function getCurrentTimeInTimezone(timezone: string): string {
  try {
    return new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    return new Date().toLocaleString()
  }
}
