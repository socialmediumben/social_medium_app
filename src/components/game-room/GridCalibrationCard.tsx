'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  AlertCircle,
} from 'lucide-react';

interface GridCalibrationCardProps {
  serverUrl: string;
  wsRef: React.MutableRefObject<WebSocket | null>;
  initialGridSize?: number;
  initialGridShape?: 'square' | 'hex';
  onNotification?: (msg: string) => void;
}

export function GridCalibrationCard({
  serverUrl,
  wsRef,
  initialGridSize = 22,
  initialGridShape = 'square',
  onNotification,
}: GridCalibrationCardProps) {
  const [gridSize, setGridSize] = useState<number>(initialGridSize);
  const [gridShape, setGridShape] = useState<'square' | 'hex'>(initialGridShape);
  const [gridEnabled, setGridEnabled] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  useEffect(() => {
    setGridSize(initialGridSize);
  }, [initialGridSize]);

  useEffect(() => {
    setGridShape(initialGridShape);
  }, [initialGridShape]);

  const handleApplyCalibration = async () => {
    setIsApplying(true);
    setApplySuccess(false);

    const payload = {
      grid_size: gridSize,
      grid_shape: gridShape,
      grid_enabled: gridEnabled,
    };

    // WebSocket dispatch
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          action: 'SET_DISPLAY',
          screen: 'table',
          display: payload,
        })
      );
    }

    // HTTP POST dispatch
    try {
      const res = await fetch(`${serverUrl}/api/display/table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setApplySuccess(true);
        onNotification?.(`Tabletop grid updated: ${gridSize}px (${gridShape})`);
        setTimeout(() => setApplySuccess(false), 3000);
      }
    } catch (err: any) {
      console.warn('Grid calibration error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetDefault = () => {
    setGridSize(22);
    setGridShape('square');
    setGridEnabled(true);
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-wider">
              Projector Alignment
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Developer Mode
            </span>
          </div>
          <h3 className="font-fredoka text-xl font-bold text-stone-900">
            Tabletop 1-Inch Grid Calibration
          </h3>
          <p className="text-stone-500 text-xs">
            Fine-tune the projected tactical battlemap grid so that 1 square exactly equals 1 physical inch on your gaming table.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default (22px)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Controls Column */}
        <div className="space-y-5">
          {/* Grid Size Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-[#344ea2]" />
                <span>Grid Cell Size:</span>
              </span>
              <span className="font-mono text-sm font-bold text-[#f16622] px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200">
                {gridSize} px
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full accent-[#f16622] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
              <span>10px (Dense)</span>
              <span>22px (Standard 1-Inch)</span>
              <span>60px (Jumbo)</span>
            </div>
          </div>

          {/* Grid Shape Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Tactical Grid Shape:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGridShape('square')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  gridShape === 'square'
                    ? 'bg-[#344ea2] text-white border-[#344ea2] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>⏹️ Square Grid (5 ft)</span>
              </button>

              <button
                type="button"
                onClick={() => setGridShape('hex')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  gridShape === 'hex'
                    ? 'bg-[#344ea2] text-white border-[#344ea2] shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span>⬡ Hexagonal Grid</span>
              </button>
            </div>
          </div>

          {/* Grid Visibility Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={gridEnabled}
                onChange={(e) => setGridEnabled(e.target.checked)}
                className="rounded border-stone-300 text-[#344ea2] focus:ring-[#344ea2]"
              />
              <span className="font-semibold">Project Grid Lines Over Battlemaps</span>
            </label>
          </div>

          {/* Apply Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleApplyCalibration}
              disabled={isApplying}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#f16622] to-[#d55214] hover:from-[#d55214] hover:to-[#bd440c] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{isApplying ? 'Applying...' : 'Apply Live Calibration to Projector'}</span>
            </button>
          </div>

          {applySuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Projector grid settings calibrated successfully!</span>
            </div>
          )}
        </div>

        {/* Live Visual Scale Preview */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Interactive Grid Preview
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              Scale: {gridSize}px / 1-inch mini base
            </span>
          </div>

          {/* Simulated Grid SVG */}
          <div className="relative w-full h-48 rounded-xl bg-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center">
            {gridShape === 'square' ? (
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern
                    id="tableGridPreview"
                    width={gridSize}
                    height={gridSize}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                      fill="none"
                      stroke={gridEnabled ? 'rgba(241, 102, 34, 0.4)' : 'transparent'}
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#tableGridPreview)" />
              </svg>
            ) : (
              // Hexagonal simulation
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle, #f16622 1px, transparent 1px)`,
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                }}
              />
            )}

            {/* Simulated 28mm miniature token placed on grid */}
            <div
              className="relative z-10 rounded-full border-2 border-amber-400 bg-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-200 shadow-lg pointer-events-none transition-all duration-150"
              style={{
                width: `${Math.max(16, gridSize)}px`,
                height: `${Math.max(16, gridSize)}px`,
              }}
              title="Standard 1-inch (28mm) base miniature"
            >
              🧙
            </div>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed mt-3">
            💡 The wizard icon represents a standard 1-inch D&D miniature. Place a real miniature on the gaming table while adjusting the slider until the grid squares match the base!
          </p>
        </div>
      </div>
    </div>
  );
}
