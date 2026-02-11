import { Sidebar } from '@/components/Sidebar';
import { useTranslation } from 'react-i18next';
import { Waves, Sparkles, Globe, BarChart3, Zap } from 'lucide-react';
import packageJson from '../../package.json';

export function AboutPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Waves,
      title: t('about.features.library.title'),
      description: t('about.features.library.desc'),
    },
    {
      icon: Zap,
      title: t('about.features.custom.title'),
      description: t('about.features.custom.desc'),
    },
    {
      icon: Sparkles,
      title: t('about.features.intuitive.title'),
      description: t('about.features.intuitive.desc'),
    },
    {
      icon: Globe,
      title: t('about.features.platform.title'),
      description: t('about.features.platform.desc'),
    },
    {
      icon: BarChart3,
      title: t('about.features.tracking.title'),
      description: t('about.features.tracking.desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-heading font-bold bg-active-frequency bg-clip-text text-transparent mb-4">
              ALCHEWAT Pulse
            </h1>
            <p className="text-2xl text-white font-semibold mb-2">
              {t('about.subtitle')}
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              {t('about.availability')}
            </p>
            <div className="text-sm text-muted-foreground">
              Version {packageJson.version}
            </div>
          </div>

          {/* Main Description */}
          <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-heading font-bold text-white mb-4">
              {t('about.hero.title')}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t('about.hero.description')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-8">
            <h3 className="text-2xl font-heading font-bold text-white mb-6">
              {t('about.features.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-white mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tagline */}
          <div className="backdrop-blur-md bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10 rounded-2xl p-8 mb-8 text-center">
            <h3 className="text-2xl font-heading font-bold text-white mb-3">
              {t('about.tagline')}
            </h3>
            <p className="text-muted-foreground">
              {t('about.taglineDesc')}
            </p>
          </div>

          {/* CTA */}
          <div className="text-center mb-8">
            <p className="text-xl font-semibold text-white mb-4">
              {t('about.cta')}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="backdrop-blur-md bg-destructive/10 border border-destructive/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5">⚠️</div>
              <div>
                <h4 className="font-semibold text-white mb-2">{t('about.disclaimer.title')}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('about.disclaimer.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
