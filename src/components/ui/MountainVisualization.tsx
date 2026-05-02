import React, { useMemo } from 'react';

interface MountainVisualizationProps {
  completionPercentage: number;
  theme?: 'alpine' | 'desert' | 'volcanic' | 'coastal' | 'forest';
  mode?: 'shrink' | 'grow';
  label?: string;
  size?: 'sm' | 'default';
}

export const MountainVisualization = ({
  completionPercentage = 0,
  theme = 'alpine',
  mode = 'shrink',
  label = 'Complete',
  size = 'default',
}: MountainVisualizationProps) => {
  // Ensure percentage is between 0 and 100
  const safePercentage = Math.max(0, Math.min(100, completionPercentage));
  // In "grow" mode, the mountain starts hidden and grows as score increases.
  // We invert the visibility level so existing transforms work the same way.
  const visibility = mode === 'grow' ? 100 - safePercentage : safePercentage;

  const mountainTranslateY = useMemo(() => {
    const max = size === 'sm' ? 80 : 180;
    return (visibility / 100) * max;
  }, [visibility, size]);

  const mountainOpacity = useMemo(() => {
    if (visibility < 50) return 1;
    return Math.max(0.3, 1 - ((visibility - 50) / 50) * 0.7);
  }, [visibility]);

  const northernLightsOpacity = useMemo(() => {
    // Northern lights appear gradually after 60% completion
    if (safePercentage < 60) return 0;
    return ((safePercentage - 60) / 40) * 0.8;
  }, [safePercentage]);

  const skyBrightness = useMemo(() => {
    // Sky gets brighter as mountain disappears
    return Math.min(1, 0.5 + (safePercentage / 100) * 0.5);
  }, [safePercentage]);

  const themeColors = {
    alpine: {
      mountain: '#4A5568',
      mountainShadow: '#2D3748',
      snow: '#FFFFFF',
      trees: '#22543D',
      foreground: '#38A169'
    },
    desert: {
      mountain: '#D69E2E',
      mountainShadow: '#B7791F',
      snow: '#FFF5F5',
      trees: '#744210',
      foreground: '#D69E2E'
    },
    volcanic: {
      mountain: '#4A5568',
      mountainShadow: '#2D3748',
      snow: '#E2E8F0',
      trees: '#1A202C',
      foreground: '#68D391'
    },
    coastal: {
      mountain: '#4299E1',
      mountainShadow: '#3182CE',
      snow: '#FFFFFF',
      trees: '#2F855A',
      foreground: '#48BB78'
    },
    forest: {
      mountain: '#2F855A',
      mountainShadow: '#22543D',
      snow: '#F7FAFC',
      trees: '#1A202C',
      foreground: '#48BB78'
    }
  };

  const colors = themeColors[theme];

  return (
    <div
      className={
        "relative w-full overflow-hidden rounded-lg bg-gradient-to-t from-blue-200 via-blue-300 to-yellow-100 transition-all duration-700 ease-out " +
        (size === 'sm' ? 'h-28' : 'h-64')
      }
      style={{
        backgroundImage: `linear-gradient(to top, 
          hsl(200 100% 80% / ${skyBrightness}), 
          hsl(200 100% 70% / ${skyBrightness}), 
          hsl(50 100% 80% / ${skyBrightness}))`
      }}
    >
      {/* Sky elements - always visible */}
      <div className="absolute inset-0">
        {/* Northern Lights - appear at high completion */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000 ease-out"
          style={{ opacity: northernLightsOpacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-green-400/30 via-blue-400/20 to-purple-400/30 animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-green-300/20 via-cyan-300/30 to-purple-300/20" 
               style={{ 
                 animation: 'pulse 4s ease-in-out infinite alternate',
                 filter: 'blur(1px)'
               }} />
          <div className="absolute top-8 left-16 w-64 h-8 bg-gradient-to-r from-emerald-300/40 to-teal-300/40 rounded-full"
               style={{ 
                 animation: 'pulse 3s ease-in-out infinite alternate-reverse',
                 filter: 'blur(2px)'
               }} />
        </div>
        
        {/* Clouds - more prominent as sky is revealed */}
        <div 
          className="absolute top-8 left-12 w-16 h-8 bg-white rounded-full shadow-lg transition-opacity duration-500" 
          style={{ opacity: 0.6 + (safePercentage / 100) * 0.4 }}
        />
        <div 
          className="absolute top-6 right-16 w-20 h-10 bg-white rounded-full shadow-md transition-opacity duration-500" 
          style={{ opacity: 0.5 + (safePercentage / 100) * 0.5 }}
        />
        <div 
          className="absolute top-16 left-32 w-12 h-6 bg-white rounded-full shadow-sm transition-opacity duration-500" 
          style={{ opacity: 0.7 + (safePercentage / 100) * 0.3 }}
        />
        
        {/* Sun - becomes more visible */}
        <div 
          className="absolute top-12 right-12 w-8 h-8 bg-yellow-300 rounded-full shadow-lg transition-all duration-700"
          style={{ 
            opacity: 0.7 + (safePercentage / 100) * 0.3,
            transform: `scale(${1 + (safePercentage / 100) * 0.3})`
          }}
        >
          <div className="absolute inset-1 bg-yellow-200 rounded-full opacity-60" />
        </div>
      </div>

      {/* Mountain Scene - moves down and fades as tasks are completed */}
      <div 
        className="absolute inset-0 transition-all duration-700 ease-out"
        style={{ 
          transform: `translateY(${mountainTranslateY}px)`,
          opacity: mountainOpacity
        }}
      >
        {/* Background Mountains */}
        <svg viewBox="0 0 650 300" className="absolute inset-0 w-full h-full">
          {/* Far background mountain - extended to fill wider area */}
          <path 
            d="M-100,300 L-40,100 L20,120 L80,60 L140,100 L200,80 L260,110 L320,90 L380,120 L440,100 L500,110 L560,125 L620,140 L680,155 L750,300 Z" 
            fill={colors.mountainShadow}
            opacity="0.6"
          />
          
          {/* Main mountain range - extended with wider coverage and 10 peaks total */}
          <path 
            d="M-100,300 L-50,140 L-20,110 L10,90 L40,65 L70,40 L100,55 L120,70 L150,45 L170,50 L200,65 L230,80 L260,60 L290,70 L320,90 L350,95 L380,115 L410,140 L440,160 L470,175 L500,185 L530,195 L560,205 L590,215 L620,225 L650,235 L680,245 L750,300 Z" 
            fill={colors.mountain}
          />
          
          {/* Mountain peaks with snow caps - updated for tallest peaks */}
          <path 
            d="M50,25 L70,25 L90,50 L70,40 Z" 
            fill={colors.snow}
          />
          <path 
            d="M130,45 L150,45 L170,70 L150,50 Z" 
            fill={colors.snow}
          />
          <path 
            d="M230,60 L260,60 L290,85 L260,70 Z" 
            fill={colors.snow}
          />
          <path 
            d="M280,70 L320,70 L350,100 L320,90 Z" 
            fill={colors.snow}
          />
        </svg>

        {/* Tree clusters - adjusted positions for new mountain width */}
        <div className="absolute bottom-24 left-8">
          <svg width="40" height="30" viewBox="0 0 40 30">
            <circle cx="8" cy="15" r="6" fill={colors.trees} />
            <circle cx="18" cy="12" r="5" fill={colors.trees} />
            <circle cx="28" cy="18" r="7" fill={colors.trees} />
            <circle cx="35" cy="14" r="4" fill={colors.trees} />
          </svg>
        </div>

        <div className="absolute bottom-20 right-12">
          <svg width="35" height="25" viewBox="0 0 35 25">
            <circle cx="7" cy="12" r="5" fill={colors.trees} />
            <circle cx="17" cy="10" r="6" fill={colors.trees} />
            <circle cx="28" cy="15" r="5" fill={colors.trees} />
          </svg>
        </div>

        {/* Additional tree cluster on the left */}
        <div className="absolute bottom-28 left-24">
          <svg width="30" height="20" viewBox="0 0 30 20">
            <circle cx="6" cy="10" r="4" fill={colors.trees} />
            <circle cx="15" cy="8" r="5" fill={colors.trees} />
            <circle cx="24" cy="12" r="4" fill={colors.trees} />
          </svg>
        </div>

        {/* Additional tree cluster on the right */}
        <div className="absolute bottom-26 right-32">
          <svg width="25" height="18" viewBox="0 0 25 18">
            <circle cx="5" cy="9" r="3" fill={colors.trees} />
            <circle cx="12" cy="7" r="4" fill={colors.trees} />
            <circle cx="20" cy="11" r="3" fill={colors.trees} />
          </svg>
        </div>

        {/* Foreground hill - reduced height by 50% */}
        <div 
          className="absolute bottom-0 left-0 w-full h-16"
          style={{ 
            background: `linear-gradient(to top, ${colors.foreground}, ${colors.foreground}dd)`,
            borderRadius: '0 0 0 0',
            clipPath: 'ellipse(100% 100% at 50% 100%)'
          }}
        />
      </div>
      
      {/* Progress indicator */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-2 rounded-lg text-sm font-medium shadow-lg border border-white/50">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: safePercentage < 25 ? '#ef4444' : safePercentage < 75 ? '#f59e0b' : '#10b981'
            }}
          />
          <span className="font-semibold">{Math.round(safePercentage)}%</span>
          <span className="text-xs text-slate-600">{label}</span>
        </div>
      </div>
    </div>
  );
};
