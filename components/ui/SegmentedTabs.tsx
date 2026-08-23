"use client";

import React from "react";

export interface TabOption<T extends string> {
  id: T;
  label: React.ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  fitContent?: boolean;
}

export default function SegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
  fitContent = true,
}: SegmentedTabsProps<T>) {
  return (
    <div className={`tabs tabs-boxed bg-base-200/50 p-1 rounded-xl ${fitContent ? "w-fit" : "w-full flex"} ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab rounded-lg transition-all duration-200 ${fitContent ? "" : "flex-1 font-semibold"} ${
              isActive
                ? "tab-active bg-primary text-primary-content font-bold shadow-sm"
                : "text-base-content/70 hover:text-base-content hover:bg-base-200/30"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
