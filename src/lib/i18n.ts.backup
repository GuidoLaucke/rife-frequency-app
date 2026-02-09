import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Load translations from localStorage or use defaults
const loadTranslations = () => {
  const stored = localStorage.getItem('alchewat_translations');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load translations from localStorage');
    }
  }
  return getDefaultTranslations();
};

// Default translations
export function getDefaultTranslations() {
  return {
    de: {
      translation: {
        // App
        'app.title': 'ALCHEWAT Pulse',
        'app.subtitle': 'Heilende Frequenzen',
        
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.player': 'Player',
        'nav.frequencies': 'Frequenzen',
        'nav.conditions': 'Krankheiten',
        'nav.persons': 'Personen',
        'nav.sequences': 'Sequenzen',
        'nav.import': 'Import',
        'nav.admin': 'Admin',
        'nav.logout': 'Abmelden',
        
        // Player
        'player.title': 'Frequenz Player',
        'player.subtitle': 'Heilende Frequenzen abspielen',
        'player.mode': 'Modus',
        'player.single': 'Einzeln',
        'player.sequence': 'Sequenz',
        'player.custom': 'Benutzerdefinierte Frequenz',
        'player.duration': 'Dauer',
        'player.play': 'Abspielen',
        'player.pause': 'Pause',
        'player.stop': 'Stop',
        'player.volume': 'Lautstärke',
        'player.waveform': 'Wellenform',
        'player.ready': 'Bereit zum Abspielen',
        'player.playing': 'Wird abgespielt',
        
        // Color Visualizer
        'color.active': 'Farbe aktiv',
        'color.inactive': 'Keine Frequenz',
        'color.chakra': 'Chakra Frequenzen',
        
        // Common
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'common.delete': 'Löschen',
        'common.edit': 'Bearbeiten',
        'common.create': 'Erstellen',
        'common.search': 'Suchen',
        'common.name': 'Name',
        'common.description': 'Beschreibung',
        'common.close': 'Schließen',
      },
    },
    en: {
      translation: {
        // App
        'app.title': 'ALCHEWAT Pulse',
        'app.subtitle': 'Healing Frequencies',
        
        // Navigation
        'nav.dashboard': 'Dashboard',
        'nav.player': 'Player',
        'nav.frequencies': 'Frequencies',
        'nav.conditions': 'Conditions',
        'nav.persons': 'Persons',
        'nav.sequences': 'Sequences',
        'nav.import': 'Import',
        'nav.admin': 'Admin',
        'nav.logout': 'Logout',
        
        // Player
        'player.title': 'Frequency Player',
        'player.subtitle': 'Play healing frequencies',
        'player.mode': 'Mode',
        'player.single': 'Single',
        'player.sequence': 'Sequence',
        'player.custom': 'Custom Frequency',
        'player.duration': 'Duration',
        'player.play': 'Play',
        'player.pause': 'Pause',
        'player.stop': 'Stop',
        'player.volume': 'Volume',
        'player.waveform': 'Waveform',
        'player.ready': 'Ready to Play',
        'player.playing': 'Playing',
        
        // Color Visualizer
        'color.active': 'Color Active',
        'color.inactive': 'No frequency',
        'color.chakra': 'Chakra Frequencies',
        
        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.create': 'Create',
        'common.search': 'Search',
        'common.name': 'Name',
        'common.description': 'Description',
        'common.close': 'Close',
      },
    },
    it: {
      translation: {
        // App
        'app.title': 'ALCHEWAT Pulse',
        'app.subtitle': 'Frequenze Curative',
        
        // Navigation
        'nav.dashboard': 'Cruscotto',
        'nav.player': 'Lettore',
        'nav.frequencies': 'Frequenze',
        'nav.conditions': 'Condizioni',
        'nav.persons': 'Persone',
        'nav.sequences': 'Sequenze',
        'nav.import': 'Importa',
        'nav.admin': 'Admin',
        'nav.logout': 'Esci',
        
        // Player
        'player.title': 'Lettore di Frequenze',
        'player.subtitle': 'Riproduci frequenze curative',
        'player.mode': 'Modalità',
        'player.single': 'Singola',
        'player.sequence': 'Sequenza',
        'player.custom': 'Frequenza Personalizzata',
        'player.duration': 'Durata',
        'player.play': 'Riproduci',
        'player.pause': 'Pausa',
        'player.stop': 'Stop',
        'player.volume': 'Volume',
        'player.waveform': 'Forma d\'onda',
        'player.ready': 'Pronto per la riproduzione',
        'player.playing': 'In riproduzione',
        
        // Color Visualizer
        'color.active': 'Colore Attivo',
        'color.inactive': 'Nessuna frequenza',
        'color.chakra': 'Frequenze Chakra',
        
        // Common
        'common.save': 'Salva',
        'common.cancel': 'Annulla',
        'common.delete': 'Elimina',
        'common.edit': 'Modifica',
        'common.create': 'Crea',
        'common.search': 'Cerca',
        'common.name': 'Nome',
        'common.description': 'Descrizione',
        'common.close': 'Chiudi',
      },
    },
    ru: {
      translation: {
        // App
        'app.title': 'ALCHEWAT Pulse',
        'app.subtitle': 'Целебные частоты',
        
        // Navigation
        'nav.dashboard': 'Панель',
        'nav.player': 'Плеер',
        'nav.frequencies': 'Частоты',
        'nav.conditions': 'Состояния',
        'nav.persons': 'Люди',
        'nav.sequences': 'Последовательности',
        'nav.import': 'Импорт',
        'nav.admin': 'Админ',
        'nav.logout': 'Выход',
        
        // Player
        'player.title': 'Плеер частот',
        'player.subtitle': 'Воспроизведение целебных частот',
        'player.mode': 'Режим',
        'player.single': 'Одиночная',
        'player.sequence': 'Последовательность',
        'player.custom': 'Своя частота',
        'player.duration': 'Длительность',
        'player.play': 'Воспроизвести',
        'player.pause': 'Пауза',
        'player.stop': 'Стоп',
        'player.volume': 'Громкость',
        'player.waveform': 'Форма волны',
        'player.ready': 'Готов к воспроизведению',
        'player.playing': 'Воспроизведение',
        
        // Color Visualizer
        'color.active': 'Цвет активен',
        'color.inactive': 'Нет частоты',
        'color.chakra': 'Частоты чакр',
        
        // Common
        'common.save': 'Сохранить',
        'common.cancel': 'Отмена',
        'common.delete': 'Удалить',
        'common.edit': 'Редактировать',
        'common.create': 'Создать',
        'common.search': 'Поиск',
        'common.name': 'Название',
        'common.description': 'Описание',
        'common.close': 'Закрыть',
      },
    },
  };
}

// Save translations to localStorage
export function saveTranslations(translations: any) {
  try {
    localStorage.setItem('alchewat_translations', JSON.stringify(translations));
    return true;
  } catch (e) {
    console.error('Failed to save translations');
    return false;
  }
}

// Initialize i18n
const storedLanguage = localStorage.getItem('alchewat_language') || 'de';

i18n
  .use(initReactI18next)
  .init({
    resources: loadTranslations(),
    lng: storedLanguage,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('alchewat_language', lng);
});

export default i18n;
