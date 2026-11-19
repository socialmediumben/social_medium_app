'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  Camera,
  Keyboard,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { BuddyBubbleMember } from '@/lib/types';
import { resolveBuddyFromScanOrUid } from '@/lib/bubble';
import { normalizeNfcTapCard } from '@/lib/neon';

interface AddBuddyScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuddyFound: (buddy: BuddyBubbleMember) => void;
}

export const AddBuddyScannerModal: React.FC<AddBuddyScannerModalProps> = ({
  isOpen,
  onClose,
  onBuddyFound,
}) => {
  const [activeTab, setActiveTab] = useState<'nfc' | 'camera' | 'manual'>('nfc');
  const [hasNfc, setHasNfc] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);

  // Camera scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Manual entry state
  const [manualInput, setManualInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasNfc(true);
      setActiveTab('nfc');
    } else {
      setHasNfc(false);
      setActiveTab('camera');
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

  // NFC scanning effect
  useEffect(() => {
    if (!isOpen || activeTab !== 'nfc' || !hasNfc) {
      setIsNfcScanning(false);
      return;
    }

    let isMounted = true;
    let abortController: AbortController | null = null;

    const startScan = async () => {
      try {
        setNfcError(null);
        setIsNfcScanning(true);
        abortController = new AbortController();
        const NDEFReaderClass = (window as any).NDEFReader;
        const ndef = new NDEFReaderClass();
        await ndef.scan({ signal: abortController.signal });

        ndef.onreadingerror = () => {
          if (isMounted) {
            setNfcError('Could not read NFC tag. Hold it closer to your phone.');
          }
        };

        ndef.onreading = async (event: any) => {
          let detected = '';
          if (event.serialNumber) {
            detected = normalizeNfcTapCard(event.serialNumber);
          }
          if (event.message?.records) {
            for (const record of event.message.records) {
              if (record.recordType === 'url') {
                const decoder = new TextDecoder();
                detected = decoder.decode(record.data);
                break;
              } else if (record.recordType === 'text') {
                const decoder = new TextDecoder(record.encoding || 'utf-8');
                detected = decoder.decode(record.data);
                break;
              }
            }
          }

          if (detected && isMounted) {
            setIsResolving(true);
            const res = await resolveBuddyFromScanOrUid(detected);
            setIsResolving(false);
            if (res.success && res.member) {
              onBuddyFound(res.member);
            } else {
              setNfcError(res.error || 'No maker profile found for this tag.');
            }
          }
        };
      } catch (err: any) {
        if (isMounted) {
          setIsNfcScanning(false);
          if (err.name === 'NotAllowedError') {
            setNfcError('NFC permission was denied.');
          } else {
            setNfcError(err.message || 'Failed to start NFC scan.');
          }
        }
      }
    };

    startScan();

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [isOpen, activeTab, hasNfc, onBuddyFound]);

  // Camera start effect
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraStream();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          setCameraError('Camera access is not supported in this browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);

        // Check for native BarcodeDetector API
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code'],
          });

          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  const rawValue = barcodes[0].rawValue;
                  stopCameraStream();
                  setIsResolving(true);
                  const res = await resolveBuddyFromScanOrUid(rawValue);
                  setIsResolving(false);
                  if (res.success && res.member) {
                    onBuddyFound(res.member);
                  } else {
                    setCameraError(res.error || 'Invalid Buddy QR Code.');
                  }
                }
              } catch (_) {}
            }
          }, 350);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsCameraActive(false);
          setCameraError(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : 'Could not access device camera.'
          );
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [isOpen, activeTab, onBuddyFound]);

  // Close cleanup
  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;

    setManualError(null);
    setIsResolving(true);
    const res = await resolveBuddyFromScanOrUid(clean);
    setIsResolving(false);

    if (res.success && res.member) {
      onBuddyFound(res.member);
    } else {
      setManualError(res.error || `No maker found matching "${clean}".`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-fredoka text-xl font-bold leading-tight">Add to Bubble</h3>
              <p className="text-white/80 text-xs font-mono">Scan wristband or phone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pairing Mode Switcher */}
        <div className="flex items-center p-1.5 bg-stone-100 border-b border-stone-200">
          {hasNfc && (
            <button
              onClick={() => setActiveTab('nfc')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'nfc'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>NFC Tap</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-teal-600" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-cyan-600" />
            <span>Enter Band</span>
          </button>
        </div>

        {/* Body content based on active mode */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* TAB 1: NFC TAP */}
          {activeTab === 'nfc' && (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="relative w-28 h-28 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-40 pointer-events-none" />
                <Radio className="w-12 h-12 text-emerald-600 animate-pulse" />
              </div>

              <div>
                <h4 className="font-fredoka text-lg font-bold text-stone-900">
                  Ready to Tap!
                </h4>
                <p className="text-stone-600 text-xs mt-1 max-w-[260px] mx-auto">
                  Hold your friend&apos;s <strong>Buddy Band</strong> or phone against the back of your device.
                </p>
              </div>

              {isResolving && (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting with maker...</span>
                </div>
              )}

              {nfcError && (
                <div className="w-full text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{nfcError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA QR SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-3 w-full flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[240px] bg-black rounded-2xl overflow-hidden border-2 border-stone-800 shadow-md flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target Finder Overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none m-6" />

                {!isCameraActive && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/80 text-white gap-2 p-4">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                    <span className="text-xs font-mono">Opening camera...</span>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="w-full text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Camera Note</span>
                  </div>
                  <p>{cameraError}</p>
                </div>
              ) : (
                <p className="text-stone-500 text-xs">
                  Frame the QR code inside the box to connect.
                </p>
              )}

              {/* iPhone Native Camera Tip */}
              <div className="w-full p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] text-left flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Tip for iPhone users:</strong> You can also just open your standard iPhone Camera app and scan their QR code to add them instantly!
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL BAND ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualLookup} className="space-y-4 w-full">
              <div className="text-left space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Buddy Band Number or Account ID
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. 1029384756 or demo-buddy-sam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                  autoFocus
                />
              </div>

              {manualError && (
                <div className="w-full text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{manualError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResolving || !manualInput.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Buddy</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
