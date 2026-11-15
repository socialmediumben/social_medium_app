'use client';

import React, { useMemo } from 'react';
import { BuddyConfig } from '@/lib/types';
import { loadMemberBuddyConfig } from '@/lib/buddy';
import { BuddyCanvas } from './BuddyCanvas';

interface BuddyAvatarBadgeProps {
  config?: BuddyConfig;
  accountId?: string;
  avatarJson?: string;
  size?: number;
  className?: string;
  borderClassName?: string;
}

/**
 * Compact, reusable Buddy Avatar Badge for profile cards, navigation bars, and leaderboards.
 */
export const BuddyAvatarBadge: React.FC<BuddyAvatarBadgeProps> = ({
  config,
  accountId,
  avatarJson,
  size = 48,
  className = '',
  borderClassName = 'border-2 border-stone-200 bg-stone-50 shadow-xs',
}) => {
  const activeConfig = useMemo(() => {
    if (config) return config;
    return loadMemberBuddyConfig(accountId, avatarJson);
  }, [config, accountId, avatarJson]);

  return (
    <div
      className={`relative rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${borderClassName} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title="Social Medium Mascot Avatar (Buddy)"
    >
      <div className="w-[130%] h-[130%] flex items-center justify-center -mb-1">
        <BuddyCanvas config={activeConfig} size={size * 1.3} showShadow={false} />
      </div>
    </div>
  );
};
