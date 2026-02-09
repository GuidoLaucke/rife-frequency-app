import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'de', label: '🇩🇪 Deutsch', flag: '🇩🇪' },
    { code: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
    { code: 'it', label: '🇮🇹 Italiano', flag: '🇮🇹' },
    { code: 'ru', label: '🇷🇺 Русский', flag: '🇷🇺' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all w-full">
        <Globe className="w-5 h-5" />
        <span className="flex-1 text-left">
          {languages.find((l) => l.code === i18n.language)?.flag || '🌍'}
        </span>
      </button>
      <div className="absolute left-0 right-0 bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <div className="backdrop-blur-xl bg-black/80 rounded-lg border border-white/10 py-2 shadow-xl">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                i18n.language === lang.code ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
