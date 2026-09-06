import React from "react";

export default function GoalkeeperVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="gv-glow" cx="50%" cy="100%" r="80%" fx="50%" fy="100%">
          <stop offset="0%" stopColor="#BFF137" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#EDEDED" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1A1B1B" stopOpacity="0" />
        </radialGradient>
        <pattern id="gv-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EDEDED" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="400" height="220" fill="url(#gv-grid)" />

      {/* Coverage Fan / Zone */}
      <path
        d="M 200 200 L 70 50 L 330 50 Z"
        fill="url(#gv-glow)"
      />

      {/* Angular deflection lines (45°) */}
      <line x1="200" y1="200" x2="60" y2="60" stroke="#BFF137" strokeWidth="2" />
      <line x1="200" y1="200" x2="340" y2="60" stroke="#BFF137" strokeWidth="2" />
      <line x1="200" y1="200" x2="200" y2="30" stroke="#EDEDED" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 4" />

      {/* 45-degree cross vectors */}
      <line x1="130" y1="130" x2="270" y2="130" stroke="#EDEDED" strokeOpacity="0.2" strokeWidth="1" />
      <line x1="100" y1="100" x2="300" y2="100" stroke="#EDEDED" strokeOpacity="0.25" strokeWidth="1" />
      <line x1="70" y1="70" x2="330" y2="70" stroke="#BFF137" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Intercept coordinate polygon */}
      <polygon
        points="170,110 230,110 250,70 150,70"
        stroke="#BFF137"
        strokeWidth="1.5"
        fill="#BFF137"
        fillOpacity="0.08"
      />

      {/* Reaction target nodes */}
      <circle cx="200" cy="200" r="5" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="60" cy="60" r="4" fill="#BFF137" />
      <circle cx="340" cy="60" r="4" fill="#BFF137" />
      <circle cx="200" cy="70" r="5" fill="#BFF137" />
      <circle cx="200" cy="70" r="11" stroke="#BFF137" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* 45-degree angle indicators */}
      <path d="M 80 80 L 95 80 L 95 95" stroke="#EDEDED" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
      <path d="M 320 80 L 305 80 L 305 95" stroke="#EDEDED" strokeOpacity="0.5" strokeWidth="1.5" fill="none" />

      {/* Data labels */}
      <text x="30" y="32" fill="#BFF137" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">
        VECTOR // 03 [REACTION]
      </text>
      <text x="30" y="46" fill="#EDEDED" fillOpacity="0.5" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
        INTERCEPT CONE | RANGE: 140°
      </text>

      <text x="370" y="195" fill="#EDEDED" fillOpacity="0.4" fontSize="8" fontFamily="monospace" textAnchor="end">
        NODE.GK-03 // DEFLECTION
      </text>
      <line x1="280" y1="192" x2="340" y2="192" stroke="#BFF137" strokeWidth="1.5" />
    </svg>
  );
}
