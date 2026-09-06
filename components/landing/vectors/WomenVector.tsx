import React from "react";

export default function WomenVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="wv-glow" x1="400" y1="0" x2="0" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BFF137" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#EDEDED" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1A1B1B" stopOpacity="0" />
        </linearGradient>
        <pattern id="wv-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EDEDED" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="400" height="220" fill="url(#wv-grid)" />

      {/* Dynamic diagonal coordinate lines */}
      <line x1="380" y1="200" x2="240" y2="60" stroke="#EDEDED" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="320" y1="210" x2="160" y2="50" stroke="#EDEDED" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="260" y1="220" x2="80" y2="40" stroke="#BFF137" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Kinetic agility polygon */}
      <polygon
        points="300,180 140,20 90,20 250,180"
        fill="url(#wv-glow)"
      />

      {/* Primary Agility Vector line (45° angles with rapid direction switch) */}
      <path
        d="M 50 140 L 130 60 L 220 150 L 330 40 L 380 40"
        stroke="#BFF137"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Parallel cadence tracking vector */}
      <path
        d="M 80 170 L 160 90 L 250 180 L 360 70"
        stroke="#EDEDED"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="square"
      />

      {/* 45-degree angled hash marks */}
      <line x1="120" y1="50" x2="140" y2="70" stroke="#BFF137" strokeWidth="2" strokeOpacity="0.8" />
      <line x1="210" y1="140" x2="230" y2="160" stroke="#BFF137" strokeWidth="2" strokeOpacity="0.8" />
      <line x1="320" y1="30" x2="340" y2="50" stroke="#BFF137" strokeWidth="2" />

      {/* Telemetry nodes */}
      <circle cx="50" cy="140" r="4" fill="#1A1B1B" stroke="#EDEDED" strokeWidth="2" />
      <circle cx="130" cy="60" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="220" cy="150" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="330" cy="40" r="5" fill="#BFF137" />
      <circle cx="330" cy="40" r="10" stroke="#BFF137" strokeOpacity="0.35" strokeWidth="1.5" />

      {/* Data labels */}
      <text x="30" y="32" fill="#BFF137" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">
        VECTOR // 02 [AGILITY]
      </text>
      <text x="30" y="46" fill="#EDEDED" fillOpacity="0.5" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
        CADENCE MATRIX | LOAD OPTIMAL
      </text>

      <text x="370" y="195" fill="#EDEDED" fillOpacity="0.4" fontSize="8" fontFamily="monospace" textAnchor="end">
        NODE.W-02 // BIOMECHANICAL
      </text>
      <line x1="220" y1="192" x2="280" y2="192" stroke="#BFF137" strokeWidth="1.5" />
    </svg>
  );
}
