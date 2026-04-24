import { Link } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { getFrequencies, getConditions, getPersons, getSequences, type Frequency } from '@/lib/db';
import { Waves, FileText, Users, ListOrdered, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    frequencies: 0,
    conditions: 0,
    persons: 0,
    sequences: 0,
  });
  const [recentFrequencies, setRecentFrequencies] = useState<Frequency[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [frequencies, conditions, persons, sequences] = await Promise.all([
      getFrequencies(),
      getConditions(),
      getPersons(),
      getSequences(),
    ]);

    setStats({
      frequencies: frequencies.length,
      conditions: conditions.length,
      persons: persons.length,
      sequences: sequences.length,
    });

    setRecentFrequencies(frequencies.slice(0, 5));
  };

  const statCards = [
    { name: t('dashboard.stats.frequencies'), value: stats.frequencies, icon: Waves, href: '/frequencies', color: 'primary' },
    { name: t('dashboard.stats.conditions'), value: stats.conditions, icon: FileText, href: '/conditions', color: 'accent' },
    { name: t('dashboard.stats.persons'), value: stats.persons, icon: Users, href: '/persons', color: 'primary' },
    { name: t('dashboard.stats.sequences'), value: stats.sequences, icon: ListOrdered, href: '/sequences', color: 'accent' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      {/* FIXED: Mobile padding + desktop margin */}
      <main className="flex-1 p-4 pt-20 md:p-8 md:ml-64">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>

        {/* Quick Action */}
        <Link
          to="/player"
          className="group block mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8 border border-white/10 hover:border-primary/30 transition-all duration-500"
        >
          <div className="relative z-10 flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-white mb-1">{t('dashboard.quickPlay')}</h3>
              <p className="text-sm md:text-base text-muted-foreground">{t('dashboard.quickPlayDesc')}</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-hero-glow opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="group backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-4 md:p-6 hover:border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-${stat.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 text-${stat.color}`} />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-heading font-bold text-white">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Frequencies */}
        <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-white">{t('dashboard.recentFrequencies')}</h2>
            <Link to="/frequencies" className="text-primary hover:text-primary/80 text-sm font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>

          {recentFrequencies.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('dashboard.noFrequencies')}</p>
          ) : (
            <div className="space-y-3">
              {recentFrequencies.map((freq) => (
                <div
                  key={freq.id}
                  className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Waves className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm md:text-base truncate">{freq.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{freq.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-mono font-bold text-accent text-sm md:text-base">{freq.hz} Hz</p>
                    {freq.isPredefined && (
                      <span className="text-xs text-muted-foreground hidden md:inline">{t('dashboard.predefined')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
