import React from 'react';
import { AvatarConfig } from '../types';
import { SKINS, ACCESSORIES, AURAS } from '../data/shopItems';

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  config,
  size = 'md',
  animate = true
}) => {
  const activeSkin = SKINS.find((s) => s.id === config.skin) || SKINS[0];
  const activeAccessory = ACCESSORIES.find((a) => a.id === config.accessory) || ACCESSORIES[0];
  const activeAura = AURAS.find((au) => au.id === config.aura) || AURAS[0];

  // Sizing definitions
  const sizeClasses = {
    xs: {
      container: 'w-8 h-8',
      skinSize: 'w-6 h-6 text-xs border',
      accessorySize: 'text-[10px] -top-1.5',
      auraOffset: 'inset-0'
    },
    sm: {
      container: 'w-10 h-10',
      skinSize: 'w-8 h-8 text-lg border-2',
      accessorySize: 'text-sm -top-2',
      auraOffset: 'inset-0.5'
    },
    md: {
      container: 'w-20 h-20',
      skinSize: 'w-16 h-16 text-3xl border-3',
      accessorySize: 'text-2xl -top-4',
      auraOffset: 'inset-1'
    },
    lg: {
      container: 'w-36 h-36',
      skinSize: 'w-28 h-28 text-5xl border-4',
      accessorySize: 'text-4xl -top-6',
      auraOffset: 'inset-2'
    },
    xl: {
      container: 'w-56 h-56',
      skinSize: 'w-44 h-44 text-7xl border-4',
      accessorySize: 'text-6xl -top-8',
      auraOffset: 'inset-3'
    }
  }[size] || {
    container: 'w-20 h-20',
    skinSize: 'w-16 h-16 text-3xl border-3',
    accessorySize: 'text-2xl -top-4',
    auraOffset: 'inset-1'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses.container} select-none`}>
      {/* 1. Aura Glow Background Effect */}
      {activeAura.id !== 'none' && (
        <div
          className={`absolute rounded-full transition-all duration-500 ${sizeClasses.auraOffset} ${
            activeAura.effectClass
          }`}
          style={{
            boxShadow: `0 0 20px 4px ${activeAura.color === 'cyan' ? 'rgba(6,182,212,0.6)' : activeAura.color === 'orange' ? 'rgba(249,115,22,0.6)' : activeAura.color === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(253,224,71,0.6)'}`
          }}
        />
      )}

      {/* 2. Skin Body Wrapper */}
      <div
        className={`relative flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${
          activeSkin.color
        } ${sizeClasses.skinSize} ${animate ? 'animate-bounce' : ''}`}
        style={{ animationDuration: '3s' }}
      >
        {/* 3. Accessory Overlay (Hats, Sunglasses, Crown, etc.) */}
        {activeAccessory.id !== 'none' && (
          <div
            className={`absolute z-10 transition-transform duration-300 ${sizeClasses.accessorySize} ${
              animate ? 'hover:scale-110' : ''
            }`}
          >
            {activeAccessory.emoji}
          </div>
        )}

        {/* 4. Skin Emoji Body */}
        <span className="relative z-0">{activeSkin.emoji}</span>
      </div>
    </div>
  );
};
