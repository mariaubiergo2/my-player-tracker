import React from "react";

export default function StaffVector({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sv-glow" x1="0" y1="0" x2="400" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EDEDED" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#BFF137" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1A1B1B" stopOpacity="0" />
        </linearGradient>
        <pattern id="sv-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EDEDED" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Grid background */}
      <rect width="400" height="220" fill="url(#sv-grid)" />

      {/* Tactical zone polygon (interconnecting 4 tactical nodes) */}
      <polygon
        points="90,140 180,60 310,80 250,170"
        fill="url(#sv-glow)"
        stroke="#BFF137"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />

      {/* Strategic 45-degree guide vectors */}
      <line x1="40" y1="190" x2="160" y2="70" stroke="#EDEDED" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="160" y1="200" x2="280" y2="80" stroke="#EDEDED" strokeOpacity="0.15" strokeWidth="1" />
      <line x1="280" y1="210" x2="380" y2="110" stroke="#EDEDED" strokeOpacity="0.1" strokeWidth="1" />

      {/* Inter-node tactical links */}
      <line x1="90" y1="140" x2="180" y2="60" stroke="#BFF137" strokeWidth="2" />
      <line x1="180" y1="60" x2="310" y2="80" stroke="#BFF137" strokeWidth="2" />
      <line x1="310" y1="80" x2="250" y2="170" stroke="#BFF137" strokeWidth="2" />
      <line x1="250" y1="170" x2="90" y2="140" stroke="#BFF137" strokeWidth="2" />

      {/* Internal diagonal passing/pressure line */}
      <line x1="90" y1="140" x2="310" y2="80" stroke="#EDEDED" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="180" y1="60" x2="250" y2="170" stroke="#EDEDED" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Center of pressure node */}
      <circle cx="205" cy="115" r="5" fill="#BFF137" />
      <circle cx="205" cy="115" r="14" stroke="#BFF137" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Tactical Nodes */}
      <circle cx="90" cy="140" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="180" cy="60" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="310" cy="80" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />
      <circle cx="250" cy="170" r="4" fill="#1A1B1B" stroke="#BFF137" strokeWidth="2" />

      {/* Angle markers at 45° */}
      <path d="M 180 80 L 195 80 L 195 95" stroke="#BFF137" strokeOpacity="0.6" strokeWidth="1" fill="none" />

      {/* Data labels */}
      <text x="30" y="32" fill="#BFF137" fontSize="9" fontFamily="monospace" letterSpacing="0.15em">
        VECTOR // 04 [TACTICAL MATRIX]
      </text>
      <text x="30" y="46" fill="#EDEDED" fillOpacity="0.5" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">
        SPATIAL DENSITY | SYNCHRONY 96.2%
      </text>

      <text x="370" y="195" fill="#EDEDED" fillOpacity="0.4" fontSize="8" fontFamily="monospace" textAnchor="end">
        NODE.ST-04 // METHODOLOGY
      </text>
      <line x1="280" y1="192" x2="340" y2="192" stroke="#BFF137" strokeWidth="1.5" />
    </svg>
  );
}
