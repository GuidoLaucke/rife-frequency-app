import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useTranslation } from 'react-i18next';
import { db } from '@/lib/db';
import { ChevronDown, ChevronUp, BookOpen, HelpCircle, Rocket } from 'lucide-react';
import type { FAQ } from '@/types';

export function HelpPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'about' | 'faq' | 'start'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    const allFaqs = await db.getAll('faqs');
    const visible = allFaqs
      .filter(faq => faq.visible)
      .sort((a, b) => a.order - b.order);
    setFaqs(visible);
  };

  const getFaqText = (faq: FAQ) => {
    const lang = i18n.language;
    return {
      question: faq[`question_${lang}` as keyof FAQ] || faq.question_en,
      answer: faq[`answer_${lang}` as keyof FAQ] || faq.answer_en,
    };
  };

  const tabs = [
    { id: 'faq' as const, label: t('help.tabs.faq'), icon: HelpCircle },
    { id: 'start' as const, label: t('help.tabs.gettingStarted'), icon: Rocket },
    { id: 'about' as const, label: t('help.tabs.about'), icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-heading font-bold text-white mb-2">
              {t('help.title')}
            </h1>
            <p className="text-muted-foreground">{t('help.subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.length === 0 ? (
                <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-8 text-center">
                  <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('help.faq.empty')}</p>
                </div>
              ) : (
                faqs.map((faq) => {
                  const { question, answer } = getFaqText(faq);
                  const isExpanded = expandedFaq === faq.id;

                  return (
                    <div
                      key={faq.id}
                      className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="font-medium text-white">{question}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-0">
                          <div className="pl-8 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {answer}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Getting Started Tab */}
          {activeTab === 'start' && (
            <div className="space-y-6">
              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  {t('help.start.step1.title')}
                </h3>
                <p className="text-muted-foreground pl-10">
                  {t('help.start.step1.desc')}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  {t('help.start.step2.title')}
                </h3>
                <p className="text-muted-foreground pl-10">
                  {t('help.start.step2.desc')}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  {t('help.start.step3.title')}
                </h3>
                <p className="text-muted-foreground pl-10">
                  {t('help.start.step3.desc')}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  {t('help.start.step4.title')}
                </h3>
                <p className="text-muted-foreground pl-10">
                  {t('help.start.step4.desc')}
                </p>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="backdrop-blur-md bg-white/5 border border-white/5 rounded-xl p-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('about.hero.description')}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.taglineDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
