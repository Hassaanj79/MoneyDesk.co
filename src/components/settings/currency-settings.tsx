"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/hooks/use-currency"
import { useCountry } from "@/contexts/country-context"
import { 
  DollarSign, 
  Globe, 
  Save, 
  RotateCcw,
  CheckCircle,
  Search,
  ChevronDown
} from "lucide-react"

const CURRENCIES = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  { code: 'GBP', name: 'British Pound Sterling', symbol: '£', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand' },
  
  // Asian Currencies
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', country: 'Pakistan' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', country: 'South Korea' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', country: 'Hong Kong' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', country: 'Taiwan' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', country: 'Indonesia' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', country: 'Philippines' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', country: 'Vietnam' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', country: 'Myanmar' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', country: 'Laos' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', country: 'Cambodia' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', country: 'Brunei' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', country: 'Sri Lanka' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'Rs', country: 'Nepal' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu', country: 'Bhutan' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', country: 'Maldives' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', country: 'Afghanistan' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', country: 'Kazakhstan' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв', country: 'Uzbekistan' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'лв', country: 'Kyrgyzstan' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', country: 'Tajikistan' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', country: 'Turkmenistan' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', country: 'Mongolia' },
  
  // Middle East & Central Asia
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', country: 'Qatar' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', country: 'Bahrain' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', country: 'Oman' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', country: 'Jordan' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', country: 'Lebanon' },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£', country: 'Syria' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', country: 'Iraq' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', country: 'Iran' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', country: 'Israel' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'Egypt' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', country: 'Libya' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', country: 'Tunisia' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', country: 'Algeria' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', country: 'Morocco' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', country: 'Sudan' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', country: 'Ethiopia' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', country: 'Rwanda' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', country: 'Burundi' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', country: 'Djibouti' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'S', country: 'Somalia' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', country: 'Eritrea' },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', country: 'South Sudan' },
  
  // European Currencies
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', country: 'Sweden' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', country: 'Norway' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', country: 'Denmark' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr', country: 'Iceland' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', country: 'Poland' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', country: 'Czech Republic' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', country: 'Hungary' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', country: 'Romania' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', country: 'Bulgaria' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', country: 'Croatia' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', country: 'Serbia' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM', country: 'Bosnia and Herzegovina' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', country: 'North Macedonia' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', country: 'Albania' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', country: 'Moldova' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', country: 'Ukraine' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', country: 'Belarus' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', country: 'Georgia' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', country: 'Armenia' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', country: 'Azerbaijan' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', country: 'Turkey' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', country: 'Russia' },
  
  // African Currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', country: 'Nigeria' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', country: 'Ghana' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', country: 'West Africa' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', country: 'Central Africa' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', country: 'Malawi' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', country: 'Zambia' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', country: 'Botswana' },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', country: 'Eswatini' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', country: 'Lesotho' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', country: 'Namibia' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', country: 'Angola' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', country: 'Mozambique' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', country: 'Zimbabwe' },
  
  // Americas Currencies
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'Brazil' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', country: 'Uruguay' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', country: 'Paraguay' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', country: 'Bolivia' },
  { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs.S', country: 'Venezuela' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$', country: 'Guyana' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', country: 'Suriname' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: 'TT$', country: 'Trinidad and Tobago' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', country: 'Barbados' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$', country: 'Jamaica' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$', country: 'Belize' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', country: 'Guatemala' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', country: 'Honduras' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', symbol: 'C$', country: 'Nicaragua' },
  { code: 'CRC', name: 'Costa Rican Colon', symbol: '₡', country: 'Costa Rica' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', country: 'Panama' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$', country: 'Dominican Republic' },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', country: 'Haiti' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '$', country: 'Cuba' },
  
  // Oceania Currencies
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', country: 'Fiji' },
  { code: 'PGK', name: 'Papua New Guinea Kina', symbol: 'K', country: 'Papua New Guinea' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', country: 'Solomon Islands' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'Vt', country: 'Vanuatu' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', country: 'Samoa' },
  { code: 'TOP', name: 'Tongan Pa\'anga', symbol: 'T$', country: 'Tonga' },
  { code: 'KID', name: 'Kiribati Dollar', symbol: '$', country: 'Kiribati' },
  
  // Cryptocurrencies
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', country: 'Global' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', country: 'Global' },
  { code: 'LTC', name: 'Litecoin', symbol: 'Ł', country: 'Global' },
  { code: 'XRP', name: 'Ripple', symbol: 'XRP', country: 'Global' },
  { code: 'ADA', name: 'Cardano', symbol: '₳', country: 'Global' },
  { code: 'DOT', name: 'Polkadot', symbol: '●', country: 'Global' },
  { code: 'LINK', name: 'Chainlink', symbol: 'LINK', country: 'Global' },
  { code: 'BCH', name: 'Bitcoin Cash', symbol: 'BCH', country: 'Global' },
  { code: 'XLM', name: 'Stellar', symbol: 'XLM', country: 'Global' },
  { code: 'DOGE', name: 'Dogecoin', symbol: 'Ð', country: 'Global' }
]

const COUNTRIES = [
  // North America
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  { code: 'GT', name: 'Guatemala', currency: 'GTQ' },
  { code: 'BZ', name: 'Belize', currency: 'BZD' },
  { code: 'SV', name: 'El Salvador', currency: 'USD' },
  { code: 'HN', name: 'Honduras', currency: 'HNL' },
  { code: 'NI', name: 'Nicaragua', currency: 'NIO' },
  { code: 'CR', name: 'Costa Rica', currency: 'CRC' },
  { code: 'PA', name: 'Panama', currency: 'PAB' },
  { code: 'CU', name: 'Cuba', currency: 'CUP' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD' },
  { code: 'HT', name: 'Haiti', currency: 'HTG' },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP' },
  { code: 'BB', name: 'Barbados', currency: 'BBD' },
  { code: 'TT', name: 'Trinidad and Tobago', currency: 'TTD' },
  { code: 'GY', name: 'Guyana', currency: 'GYD' },
  { code: 'SR', name: 'Suriname', currency: 'SRD' },
  
  // South America
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'AR', name: 'Argentina', currency: 'ARS' },
  { code: 'CL', name: 'Chile', currency: 'CLP' },
  { code: 'CO', name: 'Colombia', currency: 'COP' },
  { code: 'PE', name: 'Peru', currency: 'PEN' },
  { code: 'VE', name: 'Venezuela', currency: 'VES' },
  { code: 'EC', name: 'Ecuador', currency: 'USD' },
  { code: 'BO', name: 'Bolivia', currency: 'BOB' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU' },
  { code: 'FK', name: 'Falkland Islands', currency: 'FKP' },
  { code: 'GF', name: 'French Guiana', currency: 'EUR' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', currency: 'EUR' },
  { code: 'LU', name: 'Luxembourg', currency: 'EUR' },
  { code: 'AT', name: 'Austria', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF' },
  { code: 'LI', name: 'Liechtenstein', currency: 'CHF' },
  { code: 'MC', name: 'Monaco', currency: 'EUR' },
  { code: 'AD', name: 'Andorra', currency: 'EUR' },
  { code: 'SM', name: 'San Marino', currency: 'EUR' },
  { code: 'VA', name: 'Vatican City', currency: 'EUR' },
  { code: 'DK', name: 'Denmark', currency: 'DKK' },
  { code: 'SE', name: 'Sweden', currency: 'SEK' },
  { code: 'NO', name: 'Norway', currency: 'NOK' },
  { code: 'FI', name: 'Finland', currency: 'EUR' },
  { code: 'IS', name: 'Iceland', currency: 'ISK' },
  { code: 'PL', name: 'Poland', currency: 'PLN' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR' },
  { code: 'HU', name: 'Hungary', currency: 'HUF' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR' },
  { code: 'HR', name: 'Croatia', currency: 'HRK' },
  { code: 'BA', name: 'Bosnia and Herzegovina', currency: 'BAM' },
  { code: 'RS', name: 'Serbia', currency: 'RSD' },
  { code: 'ME', name: 'Montenegro', currency: 'EUR' },
  { code: 'MK', name: 'North Macedonia', currency: 'MKD' },
  { code: 'AL', name: 'Albania', currency: 'ALL' },
  { code: 'GR', name: 'Greece', currency: 'EUR' },
  { code: 'BG', name: 'Bulgaria', currency: 'BGN' },
  { code: 'RO', name: 'Romania', currency: 'RON' },
  { code: 'MD', name: 'Moldova', currency: 'MDL' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH' },
  { code: 'BY', name: 'Belarus', currency: 'BYN' },
  { code: 'LT', name: 'Lithuania', currency: 'EUR' },
  { code: 'LV', name: 'Latvia', currency: 'EUR' },
  { code: 'EE', name: 'Estonia', currency: 'EUR' },
  { code: 'RU', name: 'Russia', currency: 'RUB' },
  { code: 'GE', name: 'Georgia', currency: 'GEL' },
  { code: 'AM', name: 'Armenia', currency: 'AMD' },
  { code: 'AZ', name: 'Azerbaijan', currency: 'AZN' },
  { code: 'TR', name: 'Turkey', currency: 'TRY' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR' },
  { code: 'MT', name: 'Malta', currency: 'EUR' },
  
  // Asia
  { code: 'CN', name: 'China', currency: 'CNY' },
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', currency: 'KRW' },
  { code: 'KP', name: 'North Korea', currency: 'KPW' },
  { code: 'MN', name: 'Mongolia', currency: 'MNT' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD' },
  { code: 'MO', name: 'Macau', currency: 'MOP' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'TH', name: 'Thailand', currency: 'THB' },
  { code: 'VN', name: 'Vietnam', currency: 'VND' },
  { code: 'LA', name: 'Laos', currency: 'LAK' },
  { code: 'KH', name: 'Cambodia', currency: 'KHR' },
  { code: 'MM', name: 'Myanmar', currency: 'MMK' },
  { code: 'BN', name: 'Brunei', currency: 'BND' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'TL', name: 'East Timor', currency: 'USD' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR' },
  { code: 'MV', name: 'Maldives', currency: 'MVR' },
  { code: 'NP', name: 'Nepal', currency: 'NPR' },
  { code: 'BT', name: 'Bhutan', currency: 'BTN' },
  { code: 'AF', name: 'Afghanistan', currency: 'AFN' },
  { code: 'KZ', name: 'Kazakhstan', currency: 'KZT' },
  { code: 'UZ', name: 'Uzbekistan', currency: 'UZS' },
  { code: 'KG', name: 'Kyrgyzstan', currency: 'KGS' },
  { code: 'TJ', name: 'Tajikistan', currency: 'TJS' },
  { code: 'TM', name: 'Turkmenistan', currency: 'TMT' },
  { code: 'IR', name: 'Iran', currency: 'IRR' },
  { code: 'IQ', name: 'Iraq', currency: 'IQD' },
  { code: 'SY', name: 'Syria', currency: 'SYP' },
  { code: 'LB', name: 'Lebanon', currency: 'LBP' },
  { code: 'JO', name: 'Jordan', currency: 'JOD' },
  { code: 'IL', name: 'Israel', currency: 'ILS' },
  { code: 'PS', name: 'Palestine', currency: 'ILS' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'QA', name: 'Qatar', currency: 'QAR' },
  { code: 'BH', name: 'Bahrain', currency: 'BHD' },
  { code: 'KW', name: 'Kuwait', currency: 'KWD' },
  { code: 'OM', name: 'Oman', currency: 'OMR' },
  { code: 'YE', name: 'Yemen', currency: 'YER' },
  
  // Africa
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'LY', name: 'Libya', currency: 'LYD' },
  { code: 'TN', name: 'Tunisia', currency: 'TND' },
  { code: 'DZ', name: 'Algeria', currency: 'DZD' },
  { code: 'MA', name: 'Morocco', currency: 'MAD' },
  { code: 'SD', name: 'Sudan', currency: 'SDG' },
  { code: 'SS', name: 'South Sudan', currency: 'SSP' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
  { code: 'ER', name: 'Eritrea', currency: 'ERN' },
  { code: 'DJ', name: 'Djibouti', currency: 'DJF' },
  { code: 'SO', name: 'Somalia', currency: 'SOS' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
  { code: 'BI', name: 'Burundi', currency: 'BIF' },
  { code: 'MW', name: 'Malawi', currency: 'MWK' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL' },
  { code: 'BW', name: 'Botswana', currency: 'BWP' },
  { code: 'NA', name: 'Namibia', currency: 'NAD' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'LS', name: 'Lesotho', currency: 'LSL' },
  { code: 'SZ', name: 'Eswatini', currency: 'SZL' },
  { code: 'MZ', name: 'Mozambique', currency: 'MZN' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA' },
  { code: 'MU', name: 'Mauritius', currency: 'MUR' },
  { code: 'SC', name: 'Seychelles', currency: 'SCR' },
  { code: 'KM', name: 'Comoros', currency: 'KMF' },
  { code: 'YT', name: 'Mayotte', currency: 'EUR' },
  { code: 'RE', name: 'Réunion', currency: 'EUR' },
  { code: 'AO', name: 'Angola', currency: 'AOA' },
  { code: 'CD', name: 'Democratic Republic of the Congo', currency: 'CDF' },
  { code: 'CG', name: 'Republic of the Congo', currency: 'XAF' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF' },
  { code: 'TD', name: 'Chad', currency: 'XAF' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF' },
  { code: 'GA', name: 'Gabon', currency: 'XAF' },
  { code: 'ST', name: 'São Tomé and Príncipe', currency: 'STN' },
  { code: 'NE', name: 'Niger', currency: 'XOF' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'BJ', name: 'Benin', currency: 'XOF' },
  { code: 'TG', name: 'Togo', currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF' },
  { code: 'ML', name: 'Mali', currency: 'XOF' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'GM', name: 'Gambia', currency: 'GMD' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF' },
  { code: 'GN', name: 'Guinea', currency: 'GNF' },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLE' },
  { code: 'LR', name: 'Liberia', currency: 'LRD' },
  { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'CV', name: 'Cape Verde', currency: 'CVE' },
  { code: 'MR', name: 'Mauritania', currency: 'MRU' },
  
  // Oceania
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'FJ', name: 'Fiji', currency: 'FJD' },
  { code: 'PG', name: 'Papua New Guinea', currency: 'PGK' },
  { code: 'SB', name: 'Solomon Islands', currency: 'SBD' },
  { code: 'VU', name: 'Vanuatu', currency: 'VUV' },
  { code: 'NC', name: 'New Caledonia', currency: 'XPF' },
  { code: 'PF', name: 'French Polynesia', currency: 'XPF' },
  { code: 'WS', name: 'Samoa', currency: 'WST' },
  { code: 'TO', name: 'Tonga', currency: 'TOP' },
  { code: 'KI', name: 'Kiribati', currency: 'AUD' },
  { code: 'TV', name: 'Tuvalu', currency: 'AUD' },
  { code: 'NR', name: 'Nauru', currency: 'AUD' },
  { code: 'PW', name: 'Palau', currency: 'USD' },
  { code: 'FM', name: 'Micronesia', currency: 'USD' },
  { code: 'MH', name: 'Marshall Islands', currency: 'USD' },
  { code: 'CK', name: 'Cook Islands', currency: 'NZD' },
  { code: 'NU', name: 'Niue', currency: 'NZD' },
  { code: 'TK', name: 'Tokelau', currency: 'NZD' },
  { code: 'WF', name: 'Wallis and Futuna', currency: 'XPF' },
  { code: 'AS', name: 'American Samoa', currency: 'USD' },
  { code: 'GU', name: 'Guam', currency: 'USD' },
  { code: 'MP', name: 'Northern Mariana Islands', currency: 'USD' },
  { code: 'VI', name: 'U.S. Virgin Islands', currency: 'USD' },
  { code: 'PR', name: 'Puerto Rico', currency: 'USD' }
]

export function CurrencySettings() {
  const { toast } = useToast()
  const { currency, setCurrency, formatCurrency } = useCurrency()
  const { country, setCountry } = useCountry()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [selectedCurrency, setSelectedCurrency] = useState(currency)
  const [selectedCountry, setSelectedCountry] = useState(country)
  const [customSymbol, setCustomSymbol] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [currencyOpen, setCurrencyOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [currencySearch, setCurrencySearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")

  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency)
  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry)

  const filteredCurrencies = CURRENCIES.filter(currency =>
    currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(currencySearch.toLowerCase()) ||
    currency.country.toLowerCase().includes(currencySearch.toLowerCase())
  )

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  useEffect(() => {
    setSelectedCurrency(currency)
    setSelectedCountry(country)
  }, [currency, country])

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency)
    setHasChanges(true)
    
    // Auto-select country if currency matches
    const matchingCountry = COUNTRIES.find(c => c.currency === newCurrency)
    if (matchingCountry) {
      setSelectedCountry(matchingCountry.code)
    }
  }

  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry)
    setHasChanges(true)
    
    // Auto-select currency if country matches
    const matchingCurrency = COUNTRIES.find(c => c.code === newCountry)?.currency
    if (matchingCurrency) {
      setSelectedCurrency(matchingCurrency)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save currency and country settings
      setCurrency(selectedCurrency)
      setCountry(selectedCountry)
      
      // Save to localStorage for persistence
      localStorage.setItem('currency', selectedCurrency)
      localStorage.setItem('country', selectedCountry)
      
      setHasChanges(false)
      
      toast({
        title: "Settings Saved",
        description: "Currency and country settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedCurrency('USD')
    setSelectedCountry('US')
    setCustomSymbol('')
    setCustomCode('')
    setHasChanges(true)
  }

  const addCustomCurrency = () => {
    if (!customCode.trim() || !customSymbol.trim()) {
      toast({
        title: "Error",
        description: "Please enter both currency code and symbol.",
        variant: "destructive",
      })
      return
    }

    // Add custom currency to the list
    const customCurrency = {
      code: customCode.toUpperCase(),
      name: `Custom (${customCode.toUpperCase()})`,
      symbol: customSymbol,
      country: 'Custom'
    }
    
    CURRENCIES.push(customCurrency)
    setSelectedCurrency(customCode.toUpperCase())
    setCustomCode('')
    setCustomSymbol('')
    setHasChanges(true)
    
    toast({
      title: "Custom Currency Added",
      description: "Your custom currency has been added to the list.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Current Settings */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <DollarSign className="h-5 w-5" />
            Current Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentCurrency?.symbol || '$'}</div>
              <div>
                <div className="font-medium">{currentCurrency?.name || 'US Dollar'}</div>
                <div className="text-sm text-muted-foreground">{currentCurrency?.code || 'USD'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="font-medium">{currentCountry?.name || 'United States'}</div>
                <div className="text-sm text-muted-foreground">{currentCountry?.code || 'US'}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Preview:</div>
            <div className="text-lg font-mono">
              {formatCurrency(1234.56)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Select your preferred currency for all financial displays
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currency-select">Currency</Label>
            <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={currencyOpen}
                  className="w-full justify-between"
                >
                  {currentCurrency ? (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{currentCurrency.symbol}</span>
                      <span>{currentCurrency.code} - {currentCurrency.name}</span>
                    </span>
                  ) : (
                    "Select a currency..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search currencies..." 
                    value={currencySearch}
                    onValueChange={setCurrencySearch}
                  />
                  <CommandList>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCurrencies.map((currency) => (
                        <CommandItem
                          key={currency.code}
                          value={currency.code}
                          onSelect={() => {
                            handleCurrencyChange(currency.code)
                            setCurrencyOpen(false)
                            setCurrencySearch("")
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-lg">{currency.symbol}</span>
                            <div className="flex-1">
                              <div className="font-medium">{currency.code} - {currency.name}</div>
                              <div className="text-sm text-muted-foreground">{currency.country}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Custom Currency */}
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Add Custom Currency</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Currency Code (e.g., BTC)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="w-32"
              />
              <Input
                placeholder="Symbol (e.g., ₿)"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                className="w-20"
              />
              <Button onClick={addCustomCurrency} variant="outline" size="sm">
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Country Settings</CardTitle>
          <CardDescription>
            Select your country for regional formatting and default currency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="country-select">Country</Label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryOpen}
                  className="w-full justify-between"
                >
                  {currentCountry ? (
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(currentCountry.code)}</span>
                      <span>{currentCountry.name}</span>
                    </span>
                  ) : (
                    "Select a country..."
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search countries..." 
                    value={countrySearch}
                    onValueChange={setCountrySearch}
                  />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCountries.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={country.code}
                          onSelect={() => {
                            handleCountryChange(country.code)
                            setCountryOpen(false)
                            setCountrySearch("")
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-lg">{getCountryFlag(country.code)}</span>
                            <div className="flex-1">
                              <div className="font-medium">{country.name}</div>
                              <div className="text-sm text-muted-foreground">{country.code} - {country.currency}</div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          onClick={handleSave} 
          disabled={loading || !hasChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            Unsaved changes
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
