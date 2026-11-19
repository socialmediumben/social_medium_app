'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Camera,
  QrCode,
  Users,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Award,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { CustomBubbleGroup, MemberProfile, BuddyBubbleMember } from '@/lib/types';
import {
  getLocalDateString,
  getBubbleTodayCheckIn,
  hasMemberCheckedInToday,
  checkInMemberToBubble,
  generateBubbleCheckInUrl,
  generateBubbleCheckInQrCodeUrl,
  BubbleCheckInResult,
} from '@/lib/bubble';
import { normalizeNfcTapCard } from '@/lib/neon';
import { BuddyAvatarBadge } from '@/components/buddy/BuddyAvatarBadge';
import jsQR from 'jsqr';

interface BubbleCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubble: CustomBubbleGroup | null;
  adminMember: MemberProfile | null | undefined;
  allBuddies?: BuddyBubbleMember[];
  onCheckInSuccess?: (result: BubbleCheckInResult) => void;
}

export const BubbleCheckInModal: React.FC<BubbleCheckInModalProps> = ({
  isOpen,
  onClose,
  bubble,
  adminMember,
  allBuddies = [],
  onCheckInSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'show-qr'>('scan');
  const [currentBubble, setCurrentBubble] = useState<CustomBubbleGroup | null>(bubble);

  // Status and feedback
  const [lastResult, setLastResult] = useState<BubbleCheckInResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // NFC Scanner State
  const [hasNfc, setHasNfc] = useState(false);
  const [isNfcListening, setIsNfcListening] = useState(false);

  // Camera Scanner State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Synchronize internal bubble with prop
  useEffect(() => {
    setCurrentBubble(bubble);
  }, [bubble]);

  // Check Web NFC support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasNfc(true);
    } else {
      setHasNfc(false);
    }
  }, []);

  // Stop camera helper
  const stopCameraStream = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Close cleanup
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setLastResult(null);
      setFeedbackError(null);
    }
  }, [isOpen]);

  // Start Camera QR Scanner when scan tab is active
  const startCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported on this browser.');
      return;
    }
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanningFrames();
      }
    } catch (err: any) {
      console.warn('Camera start notice:', err);
      setCameraError('Camera unavailable or permission denied. Use Band NFC or the Quick Roster.');
    }
  };

  const startScanningFrames = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        return;
      }
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleRawDetectedInput(code.data);
      }
    }, 250);
  };

  // Web NFC Reader Effect
  useEffect(() => {
    if (!isOpen || activeTab !== 'scan' || !hasNfc || !currentBubble) {
      setIsNfcListening(false);
      return;
    }

    let isMounted = true;
    let abortController: AbortController | null = null;

    const startNfc = async () => {
      try {
        abortController = new AbortController();
        const NDEFReaderClass = (window as any).NDEFReader;
        const ndef = new NDEFReaderClass();
        await ndef.scan({ signal: abortController.signal });
        if (isMounted) setIsNfcListening(true);

        ndef.onreading = (event: any) => {
          let detected = '';
          if (event.serialNumber) {
            detected = normalizeNfcTapCard(event.serialNumber);
          } else if (event.message?.records) {
            for (const record of event.message.records) {
              if (record.recordType === 'text') {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                const text = decoder.decode(record.data).trim();
                if (text) {
                  detected = text;
                  break;
                }
              }
            }
          }
          if (detected && isMounted) {
            handleRawDetectedInput(detected);
          }
        };
      } catch (err) {
        console.warn('NFC start notice:', err);
        if (isMounted) setIsNfcListening(false);
      }
    };

    startNfc();

    return () => {
      isMounted = false;
      if (abortController) abortController.abort();
      setIsNfcListening(false);
    };
  }, [isOpen, activeTab, hasNfc, currentBubble]);

  // Handle scanned or tapped raw value
  const handleRawDetectedInput = async (raw: string) => {
    if (isProcessing || !currentBubble) return;

    let targetAccountId = raw.trim();

    // Check if input is a JSON payload from Buddy Pass
    try {
      if (targetAccountId.startsWith('{') && targetAccountId.endsWith('}')) {
        const parsed = JSON.parse(targetAccountId);
        if (parsed.accountId) targetAccountId = String(parsed.accountId).trim();
        else if (parsed.tapCard) targetAccountId = String(parsed.tapCard).trim();
      }
    } catch (_) {}

    // Check if it's a URL
    try {
      if (targetAccountId.startsWith('http://') || targetAccountId.startsWith('https://')) {
        const url = new URL(targetAccountId);
        const cardParam = url.searchParams.get('card') || url.searchParams.get('account') || url.searchParams.get('accountId');
        if (cardParam) targetAccountId = cardParam.trim();
      }
    } catch (_) {}

    // Resolve name from buddy list
    const foundBuddy = allBuddies.find(
      (b) =>
        b.accountId.toLowerCase() === targetAccountId.toLowerCase() ||
        (b.tapCard && b.tapCard.toLowerCase() === targetAccountId.toLowerCase())
    );

    const resolvedId = foundBuddy ? foundBuddy.accountId : targetAccountId;
    const resolvedName = foundBuddy ? (foundBuddy.preferredName || foundBuddy.name) : undefined;

    await executeCheckIn(resolvedId, resolvedName);
  };

  // Perform Check-In Execution
  const executeCheckIn = async (memberAccountId: string, memberName?: string) => {
    if (!currentBubble || isProcessing) return;
    setIsProcessing(true);
    setFeedbackError(null);

    try {
      const res = await checkInMemberToBubble(
        currentBubble.id,
        memberAccountId,
        memberName,
        adminMember?.accountId
      );

      if (res.success) {
        setCurrentBubble(res.bubble);
        setLastResult(res);
        setFeedbackError(null);
        if (onCheckInSuccess) onCheckInSuccess(res);
      } else {
        setFeedbackError(res.error || 'Check-in failed.');
      }
    } catch (err: any) {
      setFeedbackError(err?.message || 'Check-in error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !currentBubble) return null;

  const today = getLocalDateString();
  const todayRecord = getBubbleTodayCheckIn(currentBubble, today);
  const checkedInCount = todayRecord?.checkedInAccountIds?.length || 0;
  const totalMembers = Math.max(1, currentBubble.memberAccountIds.length);
  const isFullParty = checkedInCount >= totalMembers;
  const percentComplete = Math.min(100, Math.round((checkedInCount / totalMembers) * 100));

  const checkInUrl = generateBubbleCheckInUrl(currentBubble, adminMember);
  const qrCodeUrl = generateBubbleCheckInQrCodeUrl(checkInUrl, 300);

  const handleCopyLink = () => {
    if (!checkInUrl) return;
    navigator.clipboard.writeText(checkInUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-900 via-teal-800 to-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1 bg-white/10 rounded-xl">{currentBubble.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-fredoka text-lg font-bold">{currentBubble.name} Check-In</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30">
                  Kiosk
                </span>
              </div>
              <p className="text-[11px] text-teal-100">
                In-person attendance & +5 Buddy Bucks reward
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bubble Treasury & Today's Attendance Progress Banner */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Bubble Wallet Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-900 shadow-2xs">
              <span className="text-base">🪙</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Bubble Wallet
                </div>
                <div className="font-fredoka text-sm sm:text-base font-bold">
                  {currentBubble.buddyBucks || 0}{' '}
                  <span className="text-xs font-normal">Buddy Bucks</span>
                </div>
              </div>
            </div>

            {/* Attendance Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-teal-200 text-teal-900 shadow-2xs">
              <Users className="w-4 h-4 text-teal-600" />
              <div className="text-xs font-bold">
                {checkedInCount} / {totalMembers} Checked In Today
              </div>
            </div>
          </div>

          {/* Progress Bar towards Full Party */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 mb-1">
              <span>Today's Party Progress</span>
              <span className={isFullParty ? 'font-bold text-amber-600' : 'text-teal-700'}>
                {isFullParty
                  ? '🎉 100% Full Party Bonus!'
                  : `${totalMembers - checkedInCount} more needed for Full Party!`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden shadow-inner flex">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isFullParty
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-teal-500 to-teal-400'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Feedback Toast */}
        {lastResult && (
          <div
            className={`p-3.5 mx-4 mt-3 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shrink-0 ${
              lastResult.fullPartyBonus
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl text-lg ${
                lastResult.fullPartyBonus ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {lastResult.fullPartyBonus ? '🌟' : '🎉'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">
                {lastResult.memberName} Checked In! (+5 Buddy Bucks)
              </div>
              <div className="text-xs mt-0.5">
                {lastResult.fullPartyBonus ? (
                  <span className="font-bold text-amber-800">
                    🎉 FULL PARTY BONUS UNLOCKED! Every member & the bubble wallet received +5 extra Buddy Bucks!
                  </span>
                ) : (
                  <span>+5 Buddy Bucks added to member & +5 to {currentBubble.name} wallet!</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastResult(null)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Feedback Rejection Notice */}
        {feedbackError && (
          <div className="p-3 mx-4 mt-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{feedbackError}</span>
            <button
              type="button"
              onClick={() => setFeedbackError(null)}
              className="text-rose-400 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('scan');
              stopCameraStream();
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-white text-teal-800 border-t-2 border-x border-stone-200 border-t-teal-600 -mb-[1px]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span>NFC & Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('show-qr');
              stopCameraStream();
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-t-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'show-qr'
                ? 'bg-white text-teal-800 border-t-2 border-x border-stone-200 border-t-teal-600 -mb-[1px]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-teal-600" />
            <span>Display QR Pass</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* TAB 1: NFC & CAMERA SCANNER */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {/* NFC Beam Listening Pod */}
              <div className="p-4 bg-gradient-to-b from-teal-50 to-white rounded-2xl border border-teal-200 text-center flex flex-col items-center space-y-2">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-teal-500/10 flex items-center justify-center animate-ping absolute" />
                  <div className="w-14 h-14 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md relative z-10">
                    <Radio className="w-7 h-7 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h4 className="font-fredoka text-base font-bold text-stone-900">
                    Ready for Band or Phone Tap
                  </h4>
                  <p className="text-xs text-stone-600 max-w-xs mt-0.5">
                    {hasNfc
                      ? "Hold member's Buddy Band or smartphone against this device."
                      : 'NFC listening active. You can also scan their QR code below.'}
                  </p>
                </div>
              </div>

              {/* Camera QR Scanner section */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50/70">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>Scan Member's Buddy Pass QR</span>
                  </div>
                  {isCameraActive ? (
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Stop Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Start Camera</span>
                    </button>
                  )}
                </div>

                {isCameraActive ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-teal-500 shadow-inner">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-dashed border-teal-300/70 m-8 rounded-lg pointer-events-none animate-pulse" />
                  </div>
                ) : (
                  <div
                    onClick={startCamera}
                    className="p-6 border-2 border-dashed border-stone-300 rounded-xl bg-white text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <Camera className="w-6 h-6 text-stone-400" />
                    <span className="text-xs font-semibold text-stone-600">
                      Tap to open camera scanner
                    </span>
                  </div>
                )}

                {cameraError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">{cameraError}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAY CHECK-IN QR */}
          {activeTab === 'show-qr' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                <Radio className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>Today's Bubble Check-In Pass ({today})</span>
              </div>

              {/* Clean high-contrast QR Container */}
              <div className="p-3.5 bg-white rounded-3xl border-2 border-stone-800 shadow-md">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt={`${currentBubble.name} Check-In QR Code`}
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 bg-stone-100 flex items-center justify-center text-stone-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="max-w-xs space-y-1">
                <p className="text-xs text-stone-700 font-semibold">
                  Makers can scan this with their phone's camera
                </p>
                <p className="text-[11px] text-stone-500">
                  Awards +5 Buddy Bucks to the member and +5 to the {currentBubble.name} wallet!
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2 px-4 rounded-xl text-xs font-bold border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Check-In Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                    <span>Copy Check-In Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
          <div className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>Full Party = +5 Extra BB for everyone!</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
