import { useMemo } from "react";

export function TumpalSpinner({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`tumpal-spinner inline-block ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id="tumpalGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(42 80% 70%)" />
            <stop offset="100%" stopColor="hsl(38 60% 42%)" />
          </linearGradient>
        </defs>
        <g fill="url(#tumpalGold)" stroke="hsl(38 60% 38%)" strokeWidth="0.5" strokeLinejoin="round">
          <path d="M30 4 L36 16 L24 16 Z" />
          <path d="M56 30 L44 36 L44 24 Z" />
          <path d="M30 56 L24 44 L36 44 Z" />
          <path d="M4 30 L16 24 L16 36 Z" />
        </g>
        <circle cx="30" cy="30" r="4" fill="hsl(42 75% 55%)" stroke="hsl(38 60% 38%)" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

export function PucukRebungDivider({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 14" className={`w-full h-3 ${className}`} preserveAspectRatio="none" aria-hidden>
      <g fill="hsl(var(--accent))" opacity="0.7">
        <circle cx="6" cy="7" r="1.4" />
        <path d="M14 7 Q20 1 26 7 Q20 13 14 7 Z" />
        <circle cx="34" cy="7" r="1.4" />
        <path d="M44 4 L48 7 L44 10 L40 7 Z" />
        <circle cx="56" cy="7" r="1.4" />
        <path d="M66 7 Q74 1 82 7 Q74 13 66 7 Z" />
        <circle cx="92" cy="7" r="2.4" />
        <circle cx="92" cy="7" r="0.9" fill="hsl(var(--background))" />
        <path d="M104 7 Q112 1 120 7 Q112 13 104 7 Z" />
        <circle cx="130" cy="7" r="1.4" />
        <path d="M140 4 L144 7 L140 10 L136 7 Z" />
        <circle cx="152" cy="7" r="1.4" />
        <path d="M162 7 Q168 1 174 7 Q168 13 162 7 Z" />
        <circle cx="184" cy="7" r="1.4" />
        <path d="M192 4 L196 7 L192 10 L188 7 Z" />
      </g>
    </svg>
  );
}

export function OndelOndelSilhouette({ className = "", color = "hsl(42 70% 55%)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 200" className={className} aria-hidden>
      <g fill={color}>
        {/* Head */}
        <circle cx="50" cy="32" r="22" />
        {/* Crown / kembang kelapa */}
        <g transform="translate(50,8)">
          {Array.from({ length: 9 }).map((_, i) => {
            const a = -60 + i * 15;
            const x = Math.sin((a * Math.PI) / 180) * 18;
            const y = -Math.cos((a * Math.PI) / 180) * 18;
            return <circle key={i} cx={x} cy={y} r="2.4" />;
          })}
          <path d="M-22 4 Q0 -10 22 4 L18 8 Q0 -2 -18 8 Z" opacity="0.7" />
        </g>
        {/* Eyes (cutouts) */}
        <circle cx="42" cy="30" r="2" fill="hsl(220 50% 8%)" />
        <circle cx="58" cy="30" r="2" fill="hsl(220 50% 8%)" />
        {/* Body */}
        <path d="M22 60 L78 60 L84 200 L16 200 Z" />
        {/* Sash */}
        <path d="M22 60 L78 60 L75 78 L25 78 Z" opacity="0.6" />
        {/* Belt */}
        <rect x="20" y="120" width="60" height="6" opacity="0.5" />
      </g>
    </svg>
  );
}

interface DustOptions { count?: number; className?: string }
export function GoldDustField({ count = 26, className = "" }: DustOptions) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = 1 + Math.random() * 3.2;
      return {
        id: i,
        left: Math.random() * 100,
        size,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.6,
      };
    });
  }, [count]);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map(p => (
        <span
          key={p.id}
          className="gold-dust-particle absolute"
          style={{
            left: `${p.left}%`,
            bottom: `-10px`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

export function BatikCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <g fill="none" stroke="hsl(var(--accent))" strokeWidth="0.9" opacity="0.55">
        <path d="M0 60 L30 0 L60 60 L30 120 Z" />
        <path d="M30 30 L45 0 L60 30" />
        <circle cx="30" cy="60" r="6" />
        <circle cx="30" cy="60" r="2" fill="hsl(var(--accent))" />
        <path d="M0 30 Q15 45 30 30" />
        <path d="M0 90 Q15 75 30 90" />
      </g>
    </svg>
  );
}
