import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Waves,
  FileText,
  Users,
  ListOrdered,
  Play,
  Upload,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRole } from '@/lib/role';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const { t } = useTranslation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.player'), href: '/player', icon: Play },
    { name: t('nav.frequencies'), href: '/frequencies', icon: Waves },
    { name: t('nav.conditions'), href: '/conditions', icon: FileText },
    { name: t('nav.persons'), href: '/persons', icon: Users },
    { name: t('nav.sequences'), href: '/sequences', icon: ListOrdered },
    { name: t('nav.import'), href: '/import', icon: Upload },
  ];

  // Add admin link if user is admin
  if (isAdmin) {
    navigation.push({ name: t('nav.admin'), href: '/admin', icon: Settings });
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-64 backdrop-blur-xl bg-black/40 border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-2xl font-heading font-bold bg-active-frequency bg-clip-text text-transparent">
          ALCHEWAT Pulse
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Healing Frequencies</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-accent'}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <LanguageSwitcher />
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );
}
