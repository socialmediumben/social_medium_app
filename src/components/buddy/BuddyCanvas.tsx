'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { BuddyConfig, BuddyItem } from '@/lib/types';
import { getAllBuddyItems, BUDDY_BASE_COLORS, DEFAULT_BUDDY_ITEMS, normalizeGoogleDriveUrl } from '@/lib/buddy';

interface BuddyCanvasProps {
  config: BuddyConfig;
  items?: BuddyItem[];
  size?: number | string;
  className?: string;
  showShadow?: boolean;
}

/**
 * Multi-layer composite renderer for Buddy avatars.
 * Layers are rendered strictly by their computed Z-Index order,
 * allowing full customization of front-to-back layer depth.
 * 
 * Supports dynamic skin color tinting on top of the clean white/black-outline Basic Buddy base.
 */
export const BuddyCanvas: React.FC<BuddyCanvasProps> = ({
  config,
  items: propItems,
  size = 360,
  className = '',
  showShadow = true,
}) => {
  const [catalogItems, setCatalogItems] = useState<BuddyItem[]>([]);

  useEffect(() => {
    setCatalogItems(getAllBuddyItems());
    const handleUpdate = () => {
      setCatalogItems(getAllBuddyItems());
    };
    window.addEventListener('sm_buddy_catalog_updated', handleUpdate);
    return () => window.removeEventListener('sm_buddy_catalog_updated', handleUpdate);
  }, []);

  const allItems = useMemo(() => {
    if (propItems && propItems.length > 0) return propItems;
    if (catalogItems.length > 0) return catalogItems;
    return getAllBuddyItems();
  }, [propItems, catalogItems]);

  // Determine active skin color hex
  const activeColor = useMemo(() => {
    return (
      BUDDY_BASE_COLORS.find(
        (c) =>
          c.id === config.baseColor ||
          (c.id === 'navy' && config.baseColor === 'dark-blue')
      ) || BUDDY_BASE_COLORS[0]
    );
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

    // If no base_body item is equipped or equipped points to legacy ID, supply Basic Buddy
    const hasBase = layers.some((l) => l.category === 'base_body');
    if (!hasBase) {
      const defaultBody =
        allItems.find((i) => i.category === 'base_body') ||
        DEFAULT_BUDDY_ITEMS.find((i) => i.category === 'base_body') || {
          id: 'sheet_1_basic_buddy',
          name: 'Basic Buddy',
          category: 'base_body',
          assetUrl: '/buddies/basic_buddy.png',
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
        const isTintable = isBaseBody || layer.colorPicker || !!config.equippedColors?.[layer.category] || !!config.equippedColors?.[layer.id];
        const layerColorHex = isBaseBody
          ? activeColor.hex
          : (config.equippedColors?.[layer.category] || config.equippedColors?.[layer.id] || '#ffffff');

        const assetUrl = normalizeGoogleDriveUrl(layer.assetUrl);

        return (
          <div
            key={`${layer.id}-${index}`}
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200"
            style={{
              zIndex: layer.zIndex,
            }}
          >
            {assetUrl ? (
              isTintable ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Color Tint Silhouette Layer */}
                  <div
                    className="absolute inset-0 w-full h-full transition-colors duration-200"
                    style={{
                      backgroundColor: layerColorHex,
                      WebkitMaskImage: `url(${assetUrl})`,
                      maskImage: `url(${assetUrl})`,
                      WebkitMaskSize: 'contain',
                      maskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      maskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskPosition: 'center',
                    }}
                  />
                  {/* Crisp Ink/Line Art on top */}
                  <img
                    src={assetUrl}
                    alt={layer.name}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xs"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
              ) : (
                <img
                  src={assetUrl}
                  alt={layer.name}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                />
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
