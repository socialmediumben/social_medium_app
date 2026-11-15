'use client';

import React, { useMemo } from 'react';
import { BuddyConfig, BuddyItem } from '@/lib/types';
import { getAllBuddyItems, BUDDY_BASE_COLORS } from '@/lib/buddy';

interface BuddyCanvasProps {
  config: BuddyConfig;
  size?: number | string;
  className?: string;
  showShadow?: boolean;
}

/**
 * Multi-layer composite renderer for Buddy avatars.
 * Layers are stacked in strict z-index order so capes render behind the body,
 * while outfits, hats, expressions, and props render in front.
 */
export const BuddyCanvas: React.FC<BuddyCanvasProps> = ({
  config,
  size = 360,
  className = '',
  showShadow = true,
}) => {
  const allItems = useMemo(() => getAllBuddyItems(), []);

  // Resolve equipped items and sort by zIndex ascending
  const activeLayers = useMemo(() => {
    const layers: BuddyItem[] = [];
    const equipped = config.equipped || {};

    Object.entries(equipped).forEach(([, itemId]) => {
      if (!itemId) return;
      const found = allItems.find((i) => i.id === itemId);
      if (found) {
        layers.push(found);
      }
    });

    // Ensure strict z-index sorting: low z-index at the back, high z-index on top
    return layers.sort((a, b) => (a.zIndex || 50) - (b.zIndex || 50));
  }, [config.equipped, allItems]);

  // Determine base body asset and color tint
  const baseColorDef = useMemo(() => {
    return (
      BUDDY_BASE_COLORS.find((c) => c.id === config.baseColor) ||
      BUDDY_BASE_COLORS[0]
    );
  }, [config.baseColor]);

  // Compute CSS filter for non-standard base colors if using base_cyan as template
  const colorFilterStyle = useMemo(() => {
    switch (config.baseColor) {
      case 'orange':
        return {}; // Uses base_orange.png directly
      case 'purple':
        return { filter: 'hue-rotate(85deg) saturate(1.4)' };
      case 'green':
        return { filter: 'hue-rotate(220deg) saturate(0.8) brightness(0.95)' };
      case 'dark-blue':
        return { filter: 'hue-rotate(35deg) saturate(1.6) brightness(0.85)' };
      case 'yellow':
        return { filter: 'hue-rotate(340deg) saturate(1.8) brightness(1.15)' };
      case 'pink':
        return { filter: 'hue-rotate(150deg) saturate(1.5) brightness(1.05)' };
      case 'slate':
        return { filter: 'grayscale(0.85) brightness(0.95)' };
      case 'cyan':
      default:
        return {};
    }
  }, [config.baseColor]);

  const baseBodyItem = activeLayers.find((l) => l.category === 'base_body');
  const baseImgUrl =
    config.baseColor === 'orange' || baseBodyItem?.id === 'body_orange'
      ? '/buddies/base_orange.png'
      : baseBodyItem?.assetUrl || baseColorDef.assetUrl || '/buddies/base_cyan.png';

  // Layers that sit behind the body (zIndex < 30, e.g. capes, back hair)
  const backLayers = activeLayers.filter((l) => l.zIndex < 30);
  // Layers that sit on top of the body (zIndex >= 40, e.g. tops, headwear, props)
  const frontLayers = activeLayers.filter((l) => l.zIndex >= 40 && l.category !== 'base_body');

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        aspectRatio: '1 / 1',
      }}
    >
      {/* Optional Character Drop Shadow on Floor */}
      {showShadow && (
        <div
          className="absolute bottom-[6%] w-[42%] h-[6%] rounded-full bg-stone-900/15 blur-[2.5px] pointer-events-none transition-all"
          style={{ zIndex: 5 }}
        />
      )}

      {/* 1. BACK LAYERS (Z-Index < 30: Capes, Back Accessories, Wings) */}
      {backLayers.map((layer) => (
        <div
          key={layer.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: layer.zIndex }}
        >
          {layer.assetUrl ? (
            <img
              src={layer.assetUrl}
              alt={layer.name}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : null}
        </div>
      ))}

      {/* 2. BASE BODY LAYER (Z-Index 30: The mascot body) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300"
        style={{ zIndex: 30, ...colorFilterStyle }}
      >
        <img
          src={baseImgUrl}
          alt={`Buddy (${baseColorDef.name})`}
          className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
        />
      </div>

      {/* 3. FRONT LAYERS (Z-Index >= 40: Clothes, Face, Hats, Props) */}
      {frontLayers.map((layer) => (
        <div
          key={layer.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: layer.zIndex }}
        >
          {layer.assetUrl ? (
            <img
              src={layer.assetUrl}
              alt={layer.name}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};
