// Country to Currency mapping
export const countryToCurrency: Record<string, string> = {
  // Major Countries
  'US': 'USD', // United States
  'CA': 'CAD', // Canada
  'GB': 'GBP', // United Kingdom
  'AU': 'AUD', // Australia
  'NZ': 'NZD', // New Zealand
  'JP': 'JPY', // Japan
  'CH': 'CHF', // Switzerland
  
  // European Union Countries (using EUR)
  'AT': 'EUR', // Austria
  'BE': 'EUR', // Belgium
  'CY': 'EUR', // Cyprus
  'EE': 'EUR', // Estonia
  'FI': 'EUR', // Finland
  'FR': 'EUR', // France
  'DE': 'EUR', // Germany
  'GR': 'EUR', // Greece
  'IE': 'EUR', // Ireland
  'IT': 'EUR', // Italy
  'LV': 'EUR', // Latvia
  'LT': 'EUR', // Lithuania
  'LU': 'EUR', // Luxembourg
  'MT': 'EUR', // Malta
  'NL': 'EUR', // Netherlands
  'PT': 'EUR', // Portugal
  'SK': 'EUR', // Slovakia
  'SI': 'EUR', // Slovenia
  'ES': 'EUR', // Spain
  
  // Asian Countries
  'CN': 'CNY', // China
  'IN': 'INR', // India
  'PK': 'PKR', // Pakistan
  'KR': 'KRW', // South Korea
  'SG': 'SGD', // Singapore
  'HK': 'HKD', // Hong Kong
  'TW': 'TWD', // Taiwan
  'TH': 'THB', // Thailand
  'MY': 'MYR', // Malaysia
  'ID': 'IDR', // Indonesia
  'PH': 'PHP', // Philippines
  'VN': 'VND', // Vietnam
  'MM': 'MMK', // Myanmar
  'LA': 'LAK', // Laos
  'KH': 'KHR', // Cambodia
  'BD': 'BDT', // Bangladesh
  'LK': 'LKR', // Sri Lanka
  'NP': 'NPR', // Nepal
  'BT': 'BTN', // Bhutan
  'MV': 'MVR', // Maldives
  
  // Middle East
  'AE': 'AED', // United Arab Emirates
  'SA': 'SAR', // Saudi Arabia
  'QA': 'QAR', // Qatar
  'KW': 'KWD', // Kuwait
  'BH': 'BHD', // Bahrain
  'OM': 'OMR', // Oman
  'JO': 'JOD', // Jordan
  'LB': 'LBP', // Lebanon
  'IL': 'ILS', // Israel
  'TR': 'TRY', // Turkey
  'IR': 'IRR', // Iran
  'IQ': 'IQD', // Iraq
  'SY': 'SYP', // Syria
  
  // African Countries
  'ZA': 'ZAR', // South Africa
  'EG': 'EGP', // Egypt
  'NG': 'NGN', // Nigeria
  'KE': 'KES', // Kenya
  'GH': 'GHS', // Ghana
  'MA': 'MAD', // Morocco
  'TN': 'TND', // Tunisia
  'DZ': 'DZD', // Algeria
  'LY': 'LYD', // Libya
  'SD': 'SDG', // Sudan
  'ET': 'ETB', // Ethiopia
  'UG': 'UGX', // Uganda
  'TZ': 'TZS', // Tanzania
  'RW': 'RWF', // Rwanda
  'BI': 'BIF', // Burundi
  'MW': 'MWK', // Malawi
  'ZM': 'ZMW', // Zambia
  'BW': 'BWP', // Botswana
  'NA': 'NAD', // Namibia
  'SZ': 'SZL', // Eswatini
  'LS': 'LSL', // Lesotho
  'MG': 'MGA', // Madagascar
  'MU': 'MUR', // Mauritius
  'SC': 'SCR', // Seychelles
  'KM': 'KMF', // Comoros
  'DJ': 'DJF', // Djibouti
  'SO': 'SOS', // Somalia
  'ER': 'ERN', // Eritrea
  'SS': 'SSP', // South Sudan
  'CF': 'XAF', // Central African Republic
  'TD': 'XAF', // Chad
  'CM': 'XAF', // Cameroon
  'GQ': 'XAF', // Equatorial Guinea
  'GA': 'XAF', // Gabon
  'CG': 'XAF', // Republic of the Congo
  'CD': 'CDF', // Democratic Republic of the Congo
  'AO': 'AOA', // Angola
  'MZ': 'MZN', // Mozambique
  'ZW': 'ZWL', // Zimbabwe
  
  // Americas
  'MX': 'MXN', // Mexico
  'BR': 'BRL', // Brazil
  'AR': 'ARS', // Argentina
  'CL': 'CLP', // Chile
  'CO': 'COP', // Colombia
  'PE': 'PEN', // Peru
  'VE': 'VES', // Venezuela
  'UY': 'UYU', // Uruguay
  'PY': 'PYG', // Paraguay
  'BO': 'BOB', // Bolivia
  'EC': 'USD', // Ecuador (uses USD)
  'GT': 'GTQ', // Guatemala
  'HN': 'HNL', // Honduras
  'SV': 'USD', // El Salvador (uses USD)
  'NI': 'NIO', // Nicaragua
  'CR': 'CRC', // Costa Rica
  'PA': 'PAB', // Panama
  'CU': 'CUP', // Cuba
  'JM': 'JMD', // Jamaica
  'HT': 'HTG', // Haiti
  'DO': 'DOP', // Dominican Republic
  'TT': 'TTD', // Trinidad and Tobago
  'BB': 'BBD', // Barbados
  'BS': 'BSD', // Bahamas
  'BZ': 'BZD', // Belize
  'GY': 'GYD', // Guyana
  'SR': 'SRD', // Suriname
  'FJ': 'FJD', // Fiji
  'PG': 'PGK', // Papua New Guinea
  'SB': 'SBD', // Solomon Islands
  'VU': 'VUV', // Vanuatu
  'TO': 'TOP', // Tonga
  'WS': 'WST', // Samoa
  'KI': 'AUD', // Kiribati (uses AUD)
  'TV': 'AUD', // Tuvalu (uses AUD)
  'NR': 'AUD', // Nauru (uses AUD)
  
  // European Non-EU Countries
  'NO': 'NOK', // Norway
  'SE': 'SEK', // Sweden
  'DK': 'DKK', // Denmark
  'IS': 'ISK', // Iceland
  'PL': 'PLN', // Poland
  'CZ': 'CZK', // Czech Republic
  'HU': 'HUF', // Hungary
  'RO': 'RON', // Romania
  'BG': 'BGN', // Bulgaria
  'HR': 'HRK', // Croatia
  'RS': 'RSD', // Serbia
  'BA': 'BAM', // Bosnia and Herzegovina
  'ME': 'EUR', // Montenegro (uses EUR)
  'MK': 'MKD', // North Macedonia
  'AL': 'ALL', // Albania
  'XK': 'EUR', // Kosovo (uses EUR)
  'MD': 'MDL', // Moldova
  'UA': 'UAH', // Ukraine
  'BY': 'BYN', // Belarus
  'RU': 'RUB', // Russia
  'KZ': 'KZT', // Kazakhstan
  'UZ': 'UZS', // Uzbekistan
  'KG': 'KGS', // Kyrgyzstan
  'TJ': 'TJS', // Tajikistan
  'TM': 'TMT', // Turkmenistan
  'MN': 'MNT', // Mongolia
  'AF': 'AFN', // Afghanistan
  'GE': 'GEL', // Georgia
  'AM': 'AMD', // Armenia
  'AZ': 'AZN', // Azerbaijan
};

// Function to get currency for a country
export function getCurrencyForCountry(countryCode: string): string {
  return countryToCurrency[countryCode] || 'USD'; // Default to USD if country not found
}

// Function to get country name from code
export function getCountryName(countryCode: string): string {
  const countries = [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Australia', code: 'AU' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Japan', code: 'JP' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Germany', code: 'DE' },
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Spain', code: 'ES' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Austria', code: 'AT' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Norway', code: 'NO' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Finland', code: 'FI' },
    { name: 'Poland', code: 'PL' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Romania', code: 'RO' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Greece', code: 'GR' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Malta', code: 'MT' },
    { name: 'Cyprus', code: 'CY' },
    { name: 'Slovenia', code: 'SI' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Estonia', code: 'EE' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Lithuania', code: 'LT' },
    { name: 'China', code: 'CN' },
    { name: 'India', code: 'IN' },
    { name: 'Pakistan', code: 'PK' },
    { name: 'South Korea', code: 'KR' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Hong Kong', code: 'HK' },
    { name: 'Taiwan', code: 'TW' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Myanmar', code: 'MM' },
    { name: 'Laos', code: 'LA' },
    { name: 'Cambodia', code: 'KH' },
    { name: 'Bangladesh', code: 'BD' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Nepal', code: 'NP' },
    { name: 'Bhutan', code: 'BT' },
    { name: 'Maldives', code: 'MV' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Oman', code: 'OM' },
    { name: 'Jordan', code: 'JO' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Israel', code: 'IL' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Iran', code: 'IR' },
    { name: 'Iraq', code: 'IQ' },
    { name: 'Syria', code: 'SY' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'Egypt', code: 'EG' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Tunisia', code: 'TN' },
    { name: 'Algeria', code: 'DZ' },
    { name: 'Libya', code: 'LY' },
    { name: 'Sudan', code: 'SD' },
    { name: 'Ethiopia', code: 'ET' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Burundi', code: 'BI' },
    { name: 'Malawi', code: 'MW' },
    { name: 'Zambia', code: 'ZM' },
    { name: 'Botswana', code: 'BW' },
    { name: 'Namibia', code: 'NA' },
    { name: 'Eswatini', code: 'SZ' },
    { name: 'Lesotho', code: 'LS' },
    { name: 'Madagascar', code: 'MG' },
    { name: 'Mauritius', code: 'MU' },
    { name: 'Seychelles', code: 'SC' },
    { name: 'Comoros', code: 'KM' },
    { name: 'Djibouti', code: 'DJ' },
    { name: 'Somalia', code: 'SO' },
    { name: 'Eritrea', code: 'ER' },
    { name: 'South Sudan', code: 'SS' },
    { name: 'Central African Republic', code: 'CF' },
    { name: 'Chad', code: 'TD' },
    { name: 'Cameroon', code: 'CM' },
    { name: 'Equatorial Guinea', code: 'GQ' },
    { name: 'Gabon', code: 'GA' },
    { name: 'Republic of the Congo', code: 'CG' },
    { name: 'Democratic Republic of the Congo', code: 'CD' },
    { name: 'Angola', code: 'AO' },
    { name: 'Mozambique', code: 'MZ' },
    { name: 'Zimbabwe', code: 'ZW' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Chile', code: 'CL' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Peru', code: 'PE' },
    { name: 'Venezuela', code: 'VE' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Guatemala', code: 'GT' },
    { name: 'Honduras', code: 'HN' },
    { name: 'El Salvador', code: 'SV' },
    { name: 'Nicaragua', code: 'NI' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Panama', code: 'PA' },
    { name: 'Cuba', code: 'CU' },
    { name: 'Jamaica', code: 'JM' },
    { name: 'Haiti', code: 'HT' },
    { name: 'Dominican Republic', code: 'DO' },
    { name: 'Trinidad and Tobago', code: 'TT' },
    { name: 'Barbados', code: 'BB' },
    { name: 'Bahamas', code: 'BS' },
    { name: 'Belize', code: 'BZ' },
    { name: 'Guyana', code: 'GY' },
    { name: 'Suriname', code: 'SR' },
    { name: 'Fiji', code: 'FJ' },
    { name: 'Papua New Guinea', code: 'PG' },
    { name: 'Solomon Islands', code: 'SB' },
    { name: 'Vanuatu', code: 'VU' },
    { name: 'Tonga', code: 'TO' },
    { name: 'Samoa', code: 'WS' },
    { name: 'Kiribati', code: 'KI' },
    { name: 'Tuvalu', code: 'TV' },
    { name: 'Nauru', code: 'NR' },
    { name: 'Russia', code: 'RU' },
    { name: 'Kazakhstan', code: 'KZ' },
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Kyrgyzstan', code: 'KG' },
    { name: 'Tajikistan', code: 'TJ' },
    { name: 'Turkmenistan', code: 'TM' },
    { name: 'Mongolia', code: 'MN' },
    { name: 'Afghanistan', code: 'AF' },
    { name: 'Georgia', code: 'GE' },
    { name: 'Armenia', code: 'AM' },
    { name: 'Azerbaijan', code: 'AZ' },
  ];
  
  const country = countries.find(c => c.code === countryCode);
  return country ? country.name : countryCode;
}
