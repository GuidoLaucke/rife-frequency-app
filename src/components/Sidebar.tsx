import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Play, 
  Radio, 
  FileText, 
  Users, 
  List, 
  Upload, 
  Settings,
  HelpCircle,
  Info,
  LogOut,
  Menu,
  X,
  Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '@/lib/i18n';
import { useState } from 'react';

const languages = [
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/player', icon: Play, label: t('nav.player') },
    { path: '/frequencies', icon: Radio, label: t('nav.frequencies') },
    { path: '/conditions', icon: FileText, label: t('nav.conditions') },
    { path: '/persons', icon: Users, label: t('nav.persons') },
    { path: '/sequences', icon: List, label: t('nav.sequences') },
    { path: '/import', icon: Upload, label: t('nav.import') },
    { path: '/admin', icon: Settings, label: t('nav.admin') },
    { path: '/help', icon: HelpCircle, label: t('nav.help') },
    { path: '/about', icon: Info, label: t('nav.about') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-primary rounded-lg text-white shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 
          bg-sidebar border-r border-white/5 
          backdrop-blur-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-heading font-bold text-primary mb-1">
            ALCHEWAT Pulse
          </h1>
          <p className="text-sm text-muted-foreground">{t('nav.dashboard')}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Selector */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
            <Globe className="w-4 h-4" />
            <span>Language</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  text-sm font-medium transition-all
                  ${
                    i18n.language === lang.code
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-xs">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
              text-muted-foreground hover:bg-white/5 hover:text-white
              transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Spacer for desktop to prevent content overlap */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
}
