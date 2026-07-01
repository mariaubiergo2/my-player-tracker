"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/components/LanguageProvider";
import type { CompleteMatch } from "@/types/match";

interface MatchCalendarProps {
  matches: CompleteMatch[];
}

export default function MatchCalendar({ matches }: MatchCalendarProps) {
  const { locale, t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // Day of the week for the 1st of the month: 0=Sunday, 1=Monday, ..., 6=Saturday
    // Adjust to make Monday = 0
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days = [];
    
    // Previous month padding
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthEnd - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    const currentMonthEnd = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentMonthEnd; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month padding
    const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7);
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getDayMatches = (dayDate: Date) => {
    return matches.filter((match) => {
      if (!match.date) return false;
      const matchDate = new Date(match.date);
      return isSameDay(matchDate, dayDate);
    });
  };

  const monthYearString = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const formattedMonthYear =
    monthYearString.charAt(0).toUpperCase() + monthYearString.slice(1);

  // Weekdays header starting on Monday
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    // June 1, 2026 is a Monday
    const d = new Date(2026, 5, i + 1);
    const label = d.toLocaleDateString(locale, { weekday: "short" });
    // Strip trailing period if any and capitalize first character
    const cleaned = label.replace(/\.$/, "");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  });

  const gridDays = getDaysInMonth(currentMonth);
  const today = new Date();

  return (
    <div className="card bg-base-100 shadow-md border border-base-200 overflow-hidden">
      <div className="card-body p-4 sm:p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-primary select-none">
            {t("dashboard_page.calendar_title")}
          </h3>
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              className="btn btn-sm btn-ghost btn-circle"
              aria-label={t("dashboard_page.prev_month")}
            >
              ❮
            </button>
            <button
              onClick={handleNextMonth}
              className="btn btn-sm btn-ghost btn-circle"
              aria-label={t("dashboard_page.next_month")}
            >
              ❯
            </button>
          </div>
        </div>

        {/* Calendar Info Row */}
        <div className="text-center font-semibold text-base-content/80 mb-4 select-none">
          {formattedMonthYear}
        </div>

        {/* Weekdays Header Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-base-content/50 mb-2 select-none">
          {weekdays.map((dayName, idx) => (
            <div key={idx} className="py-1">
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {gridDays.map((cell, idx) => {
            const dayMatches = getDayMatches(cell.date);
            const hasMatch = dayMatches.length > 0;
            const isToday = isSameDay(cell.date, today);

            return (
              <div
                key={idx}
                className="aspect-square flex items-center justify-center relative p-0.5"
              >
                {hasMatch ? (
                  (() => {
                    const firstMatch = dayMatches[0];
                    const tooltipText = `${firstMatch.name}${
                      firstMatch.opponent ? ` vs ${firstMatch.opponent}` : ""
                    }${
                      firstMatch.startTime ? ` (${firstMatch.startTime})` : ""
                    }`;
                    return (
                      <div
                        className="tooltip tooltip-primary w-full h-full flex items-center justify-center"
                        data-tip={tooltipText}
                      >
                        <Link
                          href={`/matches/${firstMatch.id}`}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover active:bg-primary-active text-primary-content flex items-center justify-center font-bold shadow-sm transition-all hover:scale-105 select-none">
                            {cell.date.getDate()}
                          </div>
                        </Link>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all select-none
                      ${
                        cell.isCurrentMonth
                          ? "text-base-content"
                          : "text-base-content/30"
                      }
                      ${
                        isToday
                          ? "border border-primary font-bold text-primary"
                          : ""
                      }
                    `}
                  >
                    {cell.date.getDate()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
