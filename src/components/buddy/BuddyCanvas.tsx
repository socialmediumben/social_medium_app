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
 * Layers are rendered strictly by their computed Z-Index order,
 * allowing full customization of front-to-back layer depth.
 */
export const BuddyCanvas: React.FC<BuddyCanvasProps> = ({
  config,
  size = 360,
  className = '',
  showShadow = true,
}) => {
  const allItems = useMemo(() => getAllBuddyItems(), []);

  // Compute CSS filter for non-standard base colors
  const colorFilterStyle = useMemo(() => {
    switch (config.baseColor) {
      case 'orange':
        return {};
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

  // Resolve equipped items and sort strictly by zIndex ascending
  const activeLayers = useMemo(() => {
    const layers: BuddyItem[] = [];
    const equipped = config.equipped || {};

    Object.entries(equipped).forEach(([category, itemId]) => {
      if (!itemId) return;
      const found = allItems.find((i) => i.id === itemId);
      if (found) {
        layers.push(found);
      }
    });

    // If no base_body item is equipped, supply the default base body so the character is visible
    const hasBase = layers.some((l) => l.category === 'base_body');
    if (!hasBase) {
      const defaultBody = allItems.find((i) => i.category === 'base_body') || {
        id: 'default_body',
        name: 'Blue Buddy',
        category: 'base_body',
        assetUrl: '/buddies/blue_buddy.png',
        zIndex: 30,
        price: 0,
      };
      layers.push(defaultBody);
    }

    // Sort strictly by zIndex ascending (lowest renders first/behind, highest renders on top)
    return layers.sort((a, b) => (a.zIndex || 50) - (b.zIndex || 50));
  }, [config.equipped, allItems]);

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

      {/* Render all active layers in strict ascending z-index order */}
      {activeLayers.map((layer, index) => {
        const isBaseBody = layer.category === 'base_body';
        return (
          <div
            key={`${layer.id}-${index}`}
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200"
            style={{
              zIndex: layer.zIndex,
              ...(isBaseBody ? colorFilterStyle : {}),
            }}
          >
            {layer.assetUrl ? (
              <img
                src={layer.assetUrl}
                alt={layer.name}
                className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
