// components/ui/StatsBlock.tsx
"use client";

import type { ReactNode } from "react";

interface StatItem {
  title: ReactNode;
  value: ReactNode;
  valueClassName?: string;
  desc?: ReactNode;
}

interface StatsBlockProps {
  items: StatItem[];
  className?: string;
}

export default function StatsBlock({ items, className = "" }: StatsBlockProps) {
  return (
    <div
      className={`stats stats-vertical sm:stats-horizontal shadow-md border border-base-200 w-full bg-base-100 rounded-3xl overflow-hidden ${className}`}
    >
      {items.map((item, i) => (
        <div className="stat" key={i}>
          <div className="stat-title text-base-content/60 font-semibold">
            {item.title}
          </div>
          <div className={`stat-value ${item.valueClassName ?? "text-base-content"}`}>
            {item.value}
          </div>
          {item.desc && <div className="stat-desc">{item.desc}</div>}
        </div>
      ))}
    </div>
  );
}