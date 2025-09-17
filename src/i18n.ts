import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = [
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
  'tr',    // Turkish
  'pl',    // Polish
  'nl',    // Dutch
  'sv',    // Swedish
  'da',    // Danish
  'no',    // Norwegian
  'fi',    // Finnish
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
  'he',    // Hebrew
  'th',    // Thai
  'vi',    // Vietnamese
  'id',    // Indonesian
  'ms',    // Malay
  'tl',    // Filipino
  'uk',    // Ukrainian
  'be',    // Belarusian
  'ka',    // Georgian
  'hy',    // Armenian
  'az',    // Azerbaijani
  'kk',    // Kazakh
  'ky',    // Kyrgyz
  'uz',    // Uzbek
  'tg',    // Tajik
  'mn',    // Mongolian
  'my',    // Burmese
  'km',    // Khmer
  'lo',    // Lao
  'si',    // Sinhala
  'ne',    // Nepali
  'bn',    // Bengali
  'gu',    // Gujarati
  'pa',    // Punjabi
  'ta',    // Tamil
  'te',    // Telugu
  'ml',    // Malayalam
  'kn',    // Kannada
  'or',    // Odia
  'as',    // Assamese
  'mr',    // Marathi
  'ur',    // Urdu
  'fa',    // Persian
  'ps',    // Pashto
  'sd',    // Sindhi
  'bo',    // Tibetan
  'dz',    // Dzongkha
  'sw',    // Swahili
  'am',    // Amharic
  'ti',    // Tigrinya
  'om',    // Oromo
  'so',    // Somali
  'yo',    // Yoruba
  'ig',    // Igbo
  'ha',    // Hausa
  'zu',    // Zulu
  'xh',    // Xhosa
  'af',    // Afrikaans
  'sq',    // Albanian
  'eu',    // Basque
  'ca',    // Catalan
  'gl',    // Galician
  'cy',    // Welsh
  'ga',    // Irish
  'gd',    // Scottish Gaelic
  'mt',    // Maltese
  'is',    // Icelandic
  'fo',    // Faroese
  'lb',    // Luxembourgish
  'rm',    // Romansh
  'fy',    // Frisian
  'li',    // Limburgish
  'wa',    // Walloon
  'co',    // Corsican
  'sc',    // Sardinian
  'vec',   // Venetian
  'lmo',   // Lombard
  'pms',   // Piedmontese
  'lij',   // Ligurian
  'eml',   // Emilian-Romagnol
  'nap',   // Neapolitan
  'scn',   // Sicilian
  'lrc',   // Luri
  'mzn',   // Mazanderani
  'glk',   // Gilaki
  'luz',   // Southern Luri
  'bqi',   // Bakhtiari
  'sgl',   // Sangisari
  'deh',   // Dehwari
  'jdt',   // Judeo-Tat
  'tly',   // Talysh
  'tkr',   // Tat
  'xmf',   // Mingrelian
  'lzz',   // Laz
  'sva',   // Svan
  'bbl',   // Bats
  'ce',    // Chechen
  'inh',   // Ingush
  'av',    // Avar
  'lbe',   // Lak
  'dar',   // Dargwa
  'lez',   // Lezghian
  'tab',   // Tabasaran
  'rut',   // Rutul
  'tcy',   // Tulu
  'gom',   // Konkani
  'mni',   // Manipuri
  'lus',   // Mizo
  'bho',   // Bhojpuri
  'mag',   // Magahi
  'mai',   // Maithili
  'new',   // Newari
  'sat',   // Santali
  'mni-Mtei', // Meitei
  'kok',   // Konkani
  'doi',   // Dogri
  'ks',    // Kashmiri
  'brx',   // Bodo
  'mni-Mtei', // Meitei (Manipuri)
  'lus',   // Mizo
  'bho',   // Bhojpuri
  'mag',   // Magahi
  'mai',   // Maithili
  'new',   // Newari
  'sat',   // Santali
] as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
