import React from "react";

export default function PlayerVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="pv-glow" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BFF137" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#EDEDED" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1A1B1B" stopOpacity="0" />
        </linearGradient>
        <pattern id="pv-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EDEDED" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="400" height="220" fill="url(#pv-grid)" />

      {/* 45-degree diagonal dynamic lines */}
      <line x1="20" y1="200" x2="160" y2="60" stroke="#EDEDED" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="80" y1="210" x2="240" y2="50" stroke="#EDEDED" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="140" y1="220" x2="320" y2="40" stroke="#BFF137" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Velocity track polygon */}
      <polygon
        points="100,180 260,20 310,20 150,180"
        fill="url(#pv-glow)"
      />

      {/* Main Acceleration Vector line (45°) */}
      <path
        d="M 60 170 L 190 40 L 340 40"
        stroke="#BFF137"
        strokeWidth="2.5"
        strokeLinecap="square"
      />

      {/* Secondary Trajectory Vector */}
      <path
        d="M 120 190 L 250 60 L 370 60"
        stroke="#EDEDED"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="square"
      />

      {/* 45-degree tick marks */}
      <line x1="180" y1="50" x2="200" y2="30" stroke="#BFF137" strokeWidth="2" />
      <line x1="210" y1="50" x2="230" y2="30" stroke="#BFF137" strokeWidth="2" strokeOpacity="0.7" />
      <line x1="240" y1="50" x2="260" y2="30" stroke="#BFF137" strokeWidth="2" strokeOpacity="0.4" />

      {/* Telemetry nodes */}
      <circle cx="60" cy="170" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="190" cy="40" r="5" fill="#BFF137" />
      <circle cx="190" cy="40" r="10" stroke="#BFF137" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="340" cy="40" r="3" fill="#EDEDED" />

      {/* Data labels */}
      <text x="30" y="32" fill="#BFF137" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">
        VECTOR // 01 [VELOCITY]
      </text>
      <text x="30" y="46" fill="#EDEDED" fillOpacity="0.5" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
        TRAJECTORY: 45.0° | BURST
      </text>

      <text x="310" y="195" fill="#EDEDED" fillOpacity="0.4" fontSize="8" fontFamily="monospace" textAnchor="end">
        NODE.P-01 // ACCELERATION
      </text>
      <line x1="320" y1="192" x2="380" y2="192" stroke="#BFF137" strokeWidth="1.5" />
    </svg>
  );
}
