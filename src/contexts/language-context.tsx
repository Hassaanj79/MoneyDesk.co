"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = string

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  availableLanguages: { code: string; name: string }[]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'pl', name: 'Polski' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' },
  { code: 'no', name: 'Norsk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
  { code: 'ro', name: 'Română' },
  { code: 'bg', name: 'Български' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'et', name: 'Eesti' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'he', name: 'עברית' },
  { code: 'th', name: 'ไทย' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'tl', name: 'Filipino' },
  { code: 'uk', name: 'Українська' },
  { code: 'be', name: 'Беларуская' },
  { code: 'ka', name: 'ქართული' },
  { code: 'hy', name: 'Հայերեն' },
  { code: 'az', name: 'Azərbaycan' },
  { code: 'kk', name: 'Қазақ' },
  { code: 'ky', name: 'Кыргызча' },
  { code: 'uz', name: 'O\'zbek' },
  { code: 'tg', name: 'Тоҷикӣ' },
  { code: 'mn', name: 'Монгол' },
  { code: 'my', name: 'မြန်မာ' },
  { code: 'km', name: 'ខ្មែរ' },
  { code: 'lo', name: 'ລາວ' },
  { code: 'si', name: 'සිංහල' },
  { code: 'ne', name: 'नेपाली' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'অসমীয়া' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ur', name: 'اردو' },
  { code: 'fa', name: 'فارسی' },
  { code: 'ps', name: 'پښتو' },
  { code: 'sd', name: 'سنڌي' },
  { code: 'bo', name: 'བོད་ཡིག' },
  { code: 'dz', name: 'རྫོང་ཁ' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'am', name: 'አማርኛ' },
  { code: 'ti', name: 'ትግርኛ' },
  { code: 'om', name: 'Afaan Oromoo' },
  { code: 'so', name: 'Soomaali' },
  { code: 'yo', name: 'Yorùbá' },
  { code: 'ig', name: 'Igbo' },
  { code: 'ha', name: 'Hausa' },
  { code: 'zu', name: 'IsiZulu' },
  { code: 'xh', name: 'IsiXhosa' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Shqip' },
  { code: 'eu', name: 'Euskera' },
  { code: 'ca', name: 'Català' },
  { code: 'gl', name: 'Galego' },
  { code: 'cy', name: 'Cymraeg' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'gd', name: 'Gàidhlig' },
  { code: 'mt', name: 'Malti' },
  { code: 'is', name: 'Íslenska' },
  { code: 'fo', name: 'Føroyskt' },
  { code: 'lb', name: 'Lëtzebuergesch' },
  { code: 'rm', name: 'Rumantsch' },
  { code: 'fy', name: 'Frysk' },
  { code: 'li', name: 'Limburgs' },
  { code: 'wa', name: 'Walon' },
  { code: 'co', name: 'Corsu' },
  { code: 'sc', name: 'Sardu' },
  { code: 'vec', name: 'Vèneto' },
  { code: 'lmo', name: 'Lombard' },
  { code: 'pms', name: 'Piemontèis' },
  { code: 'lij', name: 'Ligure' },
  { code: 'eml', name: 'Emiliàn e rumagnòl' },
  { code: 'nap', name: 'Nnapulitano' },
  { code: 'scn', name: 'Sicilianu' },
  { code: 'lrc', name: 'لری' },
  { code: 'mzn', name: 'مازرونی' },
  { code: 'glk', name: 'گیلکی' },
  { code: 'luz', name: 'لری جنوبی' },
  { code: 'bqi', name: 'بختیاری' },
  { code: 'sgl', name: 'سنگسری' },
  { code: 'deh', name: 'دهواری' },
  { code: 'jdt', name: 'ז\'ודיאו-טאט' },
  { code: 'tly', name: 'تالشی' },
  { code: 'tkr', name: 'تاتی' },
  { code: 'xmf', name: 'მარგალური' },
  { code: 'lzz', name: 'ლაზური' },
  { code: 'sva', name: 'სვანური' },
  { code: 'bbl', name: 'ბაცბური' },
  { code: 'ce', name: 'нохчийн' },
  { code: 'inh', name: 'гӀалгӀай' },
  { code: 'av', name: 'авар' },
  { code: 'lbe', name: 'лакку' },
  { code: 'dar', name: 'дарган' },
  { code: 'lez', name: 'лезги' },
  { code: 'tab', name: 'табасаран' },
  { code: 'rut', name: 'рутул' },
  { code: 'tcy', name: 'ತುಳು' },
  { code: 'gom', name: 'कोंकणी' },
  { code: 'mni', name: 'মৈতৈলোন্' },
  { code: 'lus', name: 'Mizo' },
  { code: 'bho', name: 'भोजपुरी' },
  { code: 'mag', name: 'मगही' },
  { code: 'mai', name: 'मैथिली' },
  { code: 'new', name: 'नेपाल भाषा' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱞᱤ' }
]

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language')
    if (savedLanguage && availableLanguages.find(lang => lang.code === savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
