'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  HeartHandshake,
  HandCoins,
  ExternalLink,
  QrCode,
  Share2,
  Check,
  ArrowRight,
  ShieldCheck,
  Gift,
  Wrench,
  GraduationCap,
  Hammer,
  Settings,
} from 'lucide-react';
import { DigitalThermometer } from '@/components/impact/DigitalThermometer';
import { GiveGetModule } from '@/components/impact/GiveGetModule';
import {
  fetchImpactCampaignSettings,
  fetchNeonCampaignDetail,
  DEFAULT_IMPACT_SETTINGS,
} from '@/lib/neon';
import { ImpactCampaignSettings } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useDevMode } from '@/context/DevModeContext';

const GIVING_TIERS = [
  {
    amount: 25,
    title: 'Maker Supplies & Filament',
    desc: 'Provides 3D printing filament, soldering supplies, and safety gear for open community workshop days.',
    icon: Wrench,
  },
  {
    amount: 50,
    title: 'Youth Workshop Kit',
    desc: 'Supplies materials, electronics, and craft components for a hands-on youth STEM & art session.',
    icon: GraduationCap,
  },
  {
    amount: 100,
    title: 'Community Materials Grant',
    desc: 'Offsets wood, acrylic, and hardware materials for emerging makers building their capstone projects.',
    icon: Hammer,
  },
  {
    amount: 250,
    title: 'Equipment Maintenance & Tooling',
    desc: 'Keeps our laser cutters, CNC routers, and heavy shop machinery tuned, calibrated, and ready.',
    icon: Gift,
  },
];

function ImpactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { member } = useAuth();
  const { isDevMode, isBoardMemberPreviewEnabled } = useDevMode();

  const isBoardMember = !!(member?.isBoardMember || isBoardMemberPreviewEnabled || isDevMode);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'campaign' | 'give-get'>(
    tabParam === 'give-get' && isBoardMember ? 'give-get' : 'campaign'
  );

  useEffect(() => {
    if (tabParam === 'give-get' && isBoardMember) {
      setActiveTab('give-get');
    } else if (tabParam === 'campaign') {
      setActiveTab('campaign');
    }
  }, [tabParam, isBoardMember]);

  const handleTabChange = (tab: 'campaign' | 'give-get') => {
    setActiveTab(tab);
    router.replace(tab === 'give-get' ? '/impact?tab=give-get' : '/impact');
  };

  const [settings, setSettings] = useState<ImpactCampaignSettings>(DEFAULT_IMPACT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCampaign() {
      setIsLoading(true);
      try {
        const current = await fetchImpactCampaignSettings();
        let liveRaised = current.raisedAmount;
        let liveGoal = current.goalAmount;
        let liveDonors = current.donorCount || 0;
        let liveFormUrl = current.donationFormUrl;

        // If configured to use live stats from campaign
        if ((current.autoSyncNeon !== false || current.useLiveNeonStats) && current.campaignId) {
          const detail = await fetchNeonCampaignDetail(current.campaignId);
          if (detail) {
            if (typeof detail.statistics?.grandTotal === 'number') {
              liveRaised = detail.statistics.grandTotal;
            } else if (typeof detail.statistics?.donationAmount === 'number') {
              liveRaised = detail.statistics.donationAmount;
            }

            if (typeof detail.statistics?.donationCount === 'number') {
              liveDonors = detail.statistics.donationCount;
            }

            if (typeof detail.goal === 'number' && detail.goal > 0) {
              liveGoal = detail.goal;
            }

            if (detail.donationFormUrl && !current.donationFormUrl) {
              liveFormUrl = detail.donationFormUrl;
            }
          }
        }

        if (mounted) {
          setSettings({
            ...current,
            goalAmount: liveGoal,
            raisedAmount: liveRaised,
            donorCount: liveDonors,
            donationFormUrl: liveFormUrl || current.donationFormUrl,
          });
        }
      } catch (err) {
        console.warn('Failed to load Impact campaign data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadCampaign();

    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setSettings((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('sm_impact_settings_updated', handleSettingsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('sm_impact_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const handleCopyLink = () => {
    if (!settings.donationFormUrl) return;
    navigator.clipboard.writeText(settings.donationFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    settings.donationFormUrl || 'https://www.socialmedium.space'
  )}`;

  return (
    <div className="min-h-screen bg-stone-50/50 py-8 px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
      {/* Tab Switcher for Board Members */}
      {isBoardMember && (
        <div className="flex items-center justify-center p-1.5 bg-stone-200/70 backdrop-blur-xs rounded-2xl max-w-md mx-auto shadow-inner border border-stone-300/60">
          <button
            type="button"
            onClick={() => handleTabChange('campaign')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'campaign'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Community Impact</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('give-get')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'give-get'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>Give / Get (Board)</span>
          </button>
        </div>
      )}

      {/* Render Give / Get Sub-Module if Active */}
      {activeTab === 'give-get' && isBoardMember ? (
        <GiveGetModule />
      ) : (
        <div className="space-y-10">
          {/* 1. HERO HEADER */}
          <div className="text-center space-y-3 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
              <HeartHandshake className="w-3.5 h-3.5 text-orange-600" />
              <span>Community Impact & Giving</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 font-fredoka tracking-tight">
              {settings.headline || 'Help Us Grow Social Medium Makerspace!'}
            </h1>

            <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto font-medium">
              {settings.description ||
                'Every gift directly powers accessible equipment, youth workshop materials, and community fabrication projects.'}
            </p>

            {isDevMode && (
              <div className="pt-2">
                <Link
                  href="/developer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-orange-600 px-3 py-1 rounded-lg bg-stone-100 hover:bg-orange-50 border border-stone-200 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Configure in Developer Mode</span>
                </Link>
              </div>
            )}
          </div>

          {/* 2. DIGITAL THERMOMETER SHOWCASE */}
          <DigitalThermometer
            goal={settings.goalAmount}
            raised={settings.raisedAmount}
            donorCount={settings.donorCount}
            primaryColor={settings.thermometerColor || '#f16622'}
          />

          {/* 3. CALL TO ACTION & DONATION OPTIONS */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-fredoka">
                  Support {settings.campaignName || 'Our Makerspace'}
                </h2>
                <p className="text-sm text-stone-500 font-medium">
                  Tax-deductible charitable contribution processed securely online.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <a
                  href={settings.donationFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Donate Now</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors shrink-0"
                  title="View Scan-to-Donate QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors shrink-0"
                  title="Copy Donation Form Link"
                >
                  {copiedLink ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Quick Giving Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
              {GIVING_TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <a
                    key={tier.amount}
                    href={settings.donationFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-5 rounded-2xl bg-stone-50/70 hover:bg-orange-50/50 border border-stone-200/80 hover:border-orange-300 transition-all text-left flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-xl font-black text-stone-900 font-fredoka group-hover:text-orange-600 transition-colors">
                          ${tier.amount}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-orange-950 transition-colors">
                        {tier.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        {tier.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Give ${tier.amount}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* 4. SECURITY & NON-PROFIT NOTICE */}
          <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200/80 flex items-center gap-3 text-xs text-stone-500">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Social Medium is a 501(c)(3) community-centered makerspace. Your charitable gift helps sustain creative access, youth scholarships, and open shop nights. All donations are securely processed via SSL.
            </span>
          </div>

          {/* 5. QR CODE MODAL FOR MOBILE GIVING */}
          {showQrModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-stone-200">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-black text-stone-900 font-fredoka">
                  Scan to Give on Phone
                </h3>
                <p className="text-xs text-stone-500">
                  Point your smartphone camera at the code below to open our secure donation page:
                </p>

                <div className="p-3 rounded-2xl bg-white border-2 border-stone-100 inline-block shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="Donation Form QR Code"
                    className="w-52 h-52 object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                  >
                    {copiedLink ? 'Copied URL!' : 'Copy Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-stone-500 font-mono text-sm">
          Loading Community Impact...
        </div>
      }
    >
      <ImpactContent />
    </Suspense>
  );
}
