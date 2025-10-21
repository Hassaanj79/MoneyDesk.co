import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
const locales = [
  'en',    // English
  'es',    // Spanish
  'fr',    // French
  'de',    // German
  'it',    // Italian
  'pt',    // Portuguese
  'ru',    // Russian
  'ja',    // Japanese
  'ko',    // Korean
  'zh',    // Chinese (Simplified)
  'ar',    // Arabic
  'hi',    // Hindi
  'nl',    // Dutch
  'sv',    // Swedish
  'da',    // Danish
  'no',    // Norwegian
  'fi',    // Finnish
  'pl',    // Polish
  'tr',    // Turkish
  'th',    // Thai
  'vi',    // Vietnamese
  'id',    // Indonesian
  'ms',    // Malay
  'tl',    // Filipino
  'he',    // Hebrew
  'uk',    // Ukrainian
  'cs',    // Czech
  'hu',    // Hungarian
  'ro',    // Romanian
  'bg',    // Bulgarian
  'hr',    // Croatian
  'sk',    // Slovak
  'sl',    // Slovenian
  'et',    // Estonian
  'lv',    // Latvian
  'lt',    // Lithuanian
  'el',    // Greek
  'is',    // Icelandic
  'mt',    // Maltese
  'cy',    // Welsh
  'ga',    // Irish
  'eu',    // Basque
  'ca',    // Catalan
  'gl',    // Galician
  'af',    // Afrikaans
  'sw',    // Swahili
  'am',    // Amharic
  'bn',    // Bengali
  'gu',    // Gujarati
  'kn',    // Kannada
  'ml',    // Malayalam
  'mr',    // Marathi
  'ne',    // Nepali
  'pa',    // Punjabi
  'ta',    // Tamil
  'te',    // Telugu
  'ur',    // Urdu
  'fa',    // Persian
  'ps',    // Pashto
  'sd',    // Sindhi
  'si',    // Sinhala
  'my',    // Burmese
  'km',    // Khmer
  'lo',    // Lao
  'ka',    // Georgian
  'hy',    // Armenian
  'az',    // Azerbaijani
  'kk',    // Kazakh
  'ky',    // Kyrgyz
  'mn',    // Mongolian
  'uz',    // Uzbek
  'tg',    // Tajik
  'tk',    // Turkmen
  'be',    // Belarusian
  'mk',    // Macedonian
  'sq',    // Albanian
  'sr',    // Serbian
  'bs',    // Bosnian
  'me',    // Montenegrin
  'lb',    // Luxembourgish
  'fo',    // Faroese
  'sm',    // Samoan
  'to',    // Tongan
  'fj',    // Fijian
  'haw',   // Hawaiian
  'mi',    // Maori
  'ty',    // Tahitian
  'mg',    // Malagasy
  'sw',    // Swahili
  'zu',    // Zulu
  'xh',    // Xhosa
  'st',    // Sesotho
  'tn',    // Tswana
  'ss',    // Swati
  've',    // Venda
  'ts',    // Tsonga
  'nr',    // Ndebele
  'nso',   // Northern Sotho
  'sot',   // Southern Sotho
  'tso',   // Tsonga
  'ven',   // Venda
  'nbl',   // Northern Ndebele
  'sot',   // Southern Sotho
  'ssw',   // Swati
  'tsn',   // Tswana
  'xho',   // Xhosa
  'zul'    // Zulu
];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default
  };
});