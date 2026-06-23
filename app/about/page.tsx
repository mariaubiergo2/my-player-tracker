"use client";

import Link from "next/link";
import { useState } from "react";

interface TabContent {
  title: string;
  badge: string;
  description: string;
  emoji: string;
  features: string[];
  mockData: Record<string, string | number | string[]>;
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<string>("tracking");

  const tabs: Record<string, TabContent> = {
    tracking: {
      title: "Match Tracking & Log",
      badge: "Structure",
      emoji: "⚽",
      description: "Organize every game, training session, or friendly with rich contextual data. Know where, when, and who you played.",
      features: [
        "Track Match Types: League, Cup, Friendly, or Training sessions",
        "Record opponent name, location, and match date/time",
        "Manage status workflows: Scheduled, Completed, or Cancelled",
      ],
      mockData: {
        "Match Type": "League Game 🏆",
        "Opponent": "F.C. Dynamo",
        "Location": "Estadio Central, Field 2",
        "Status": "Completed",
      }
    },
    performance: {
      title: "Player Performance Statistics",
      badge: "Numbers",
      emoji: "📈",
      description: "Hard data is the key to tracking progress. Log standard key indicators for each player's match contribution.",
      features: [
        "Log goals scored and goal assists in every match",
        "Track exact minutes played to measure stamina and workload",
        "Accumulate data over time to view seasonal averages",
      ],
      mockData: {
        "Minutes Played": 90,
        "Goals": 2,
        "Assists": 1,
        "Pass Accuracy": "88%",
      }
    },
    metrics: {
      title: "Core Evaluation Metrics",
      badge: "Ratings",
      emoji: "🎯",
      description: "Evaluate qualitative performance using our standard 1-10 scoring sliders to track physical and psychological indicators.",
      features: [
        "Mark: Standard score representing the overall performance quality",
        "Intensity: Physical engagement and workload rate during the match",
        "Attitude: Sportspersonship, team spirit, and mental resilience",
        "Performance: Tactical execution and consistency on the pitch",
      ],
      mockData: {
        "Overall Mark": "8/10",
        "Intensity Score": "9/10",
        "Attitude Score": "10/10",
        "Tactical Performance": "8/10",
      }
    },
    collaboration: {
      title: "Trainer & Player Collaboration",
      badge: "Feedback",
      emoji: "💬",
      description: "Build communication between trainers and players. Combine structured feedback with player self-reflections.",
      features: [
        "Trainer Feedback: Expert guidance and tactical instructions from trainers",
        "Player Reflection: Self-evaluation space for players to express feelings",
        "General Match Comments: Contextual notes on tactical patterns or events",
      ],
      mockData: {
        "Trainer Feedback": "Great positioning on transition. Work on weak foot distribution.",
        "Player Reflection": "Felt confident in the first half, but fatigued around the 75th minute.",
      }
    },
    growth: {
      title: "Growth & Actionable Plans",
      badge: "Development",
      emoji: "🚀",
      description: "Translate match logs into structured growth templates. Track strengths, weaknesses, and improvement areas.",
      features: [
        "List key match strengths to build player confidence",
        "Identify specific weaknesses to target in upcoming training",
        "Formulate explicit improvement areas for action plans",
      ],
      mockData: {
        "Strengths": ["Aerial duels", "Off-the-ball runs", "Tactical awareness"],
        "Weaknesses": ["Right-foot crossing"],
        "Improvement Areas": ["Corner kick positioning", "Cardio endurance"],
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>⚡ Next-Gen Sports Analytics</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Agent Matches Hub
          </h1>
          <p className="text-lg text-base-content/75 leading-relaxed">
            Welcome to the ultimate player tracker application. Designed for teams, trainers, and aspiring athletes, Agent Matches bridges quantitative statistics with qualitative feedback to elevate player development.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/dashboard" className="btn btn-primary shadow-lg hover:scale-105 active:scale-95 transition-all">
              Go to Dashboard
            </Link>
            <a href="#features" className="btn btn-outline btn-secondary hover:scale-105 active:scale-95 transition-all">
              Explore Features
            </a>
          </div>
        </div>

        {/* Highlight Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-base-100/50 backdrop-blur-md rounded-2xl border border-base-content/10 shadow-xl">
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">⚽</span>
            <div className="text-2xl font-bold text-primary">Log Matches</div>
            <div className="text-xs text-base-content/65">Full Match Scheduling</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">📊</span>
            <div className="text-2xl font-bold text-secondary">Track Stats</div>
            <div className="text-xs text-base-content/65">Goals, Assists & Minutes</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">🎯</span>
            <div className="text-2xl font-bold text-accent">Rate Metrics</div>
            <div className="text-xs text-base-content/65">Workload & Attitude</div>
          </div>
          <div className="text-center space-y-1">
            <span className="text-3xl sm:text-4xl">🤝</span>
            <div className="text-2xl font-bold text-info">Collaborate</div>
            <div className="text-xs text-base-content/65">Trainer-Player Feedback</div>
          </div>
        </div>

        {/* Main Features Exploration Section */}
        <div id="features" className="space-y-8 scroll-mt-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Comprehensive Feature Suite</h2>
            <p className="text-base-content/60 mt-1">Select a category below to explore how we track player development.</p>
          </div>

          {/* Feature Tabs Buttons */}
          <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-base-300 rounded-xl max-w-4xl mx-auto">
            {Object.keys(tabs).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tabKey
                    ? "bg-primary text-primary-content shadow-md scale-105"
                    : "hover:bg-base-200 text-base-content/80"
                }`}
              >
                <span>{tabs[tabKey].emoji}</span>
                <span>{tabs[tabKey].title.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-2xl transition-all duration-300">
            {/* Tab Info */}
            <div className="lg:col-span-3 space-y-6 flex flex-col justify-center">
              <div className="space-y-3">
                <div className="badge badge-accent font-semibold">{tabs[activeTab].badge}</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-base-content flex items-center gap-3">
                  <span>{tabs[activeTab].emoji}</span>
                  <span>{tabs[activeTab].title}</span>
                </h3>
                <p className="text-base-content/75 leading-relaxed text-base sm:text-lg">
                  {tabs[activeTab].description}
                </p>
              </div>

              <div className="divider">Core Highlights</div>

              <ul className="space-y-3">
                {tabs[activeTab].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-base-content/85">
                    <span className="text-success text-lg mt-0.5">✔</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Preview / Mockup Card */}
            <div className="lg:col-span-2 bg-base-200/80 rounded-2xl p-6 border border-base-300/50 shadow-inner flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-base-300 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/40">Visual Database Preview</span>
                  <span className="badge badge-sm badge-success">Live Fields</span>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(tabs[activeTab].mockData).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="text-xs font-semibold text-base-content/50">{key}</div>
                      {Array.isArray(val) ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {val.map((item) => (
                            <span key={item} className="badge badge-sm badge-outline text-xs">{item}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm font-bold bg-base-100 p-2.5 rounded-lg border border-base-300 shadow-sm text-primary">
                          {val}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-base-300 text-center">
                <span className="text-xs text-base-content/40 italic">
                  * Saved directly inside database using Prisma ORM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Roles section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Player Role Card */}
          <div className="card bg-gradient-to-br from-primary/10 to-base-100 border border-primary/20 hover:border-primary/40 transition-all duration-300 shadow-xl">
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏃‍♂️</span>
                <div>
                  <h3 className="card-title text-xl font-bold">The Player Workflow</h3>
                  <p className="text-xs text-primary font-semibold">Self-Reflective Development</p>
                </div>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed">
                Players utilize the tracker to review statistics, enter post-match reflections, and maintain a historical ledger of their pitch minutes, goals, and assists. Identifying strengths and addressing personal weaknesses directly boosts performance.
              </p>
              <div className="card-actions justify-end pt-2">
                <div className="badge badge-primary badge-outline text-xs">Self-reflection</div>
                <div className="badge badge-primary badge-outline text-xs">Personal Ledger</div>
              </div>
            </div>
          </div>

          {/* Trainer Role Card */}
          <div className="card bg-gradient-to-br from-secondary/10 to-base-100 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 shadow-xl">
            <div className="card-body space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <h3 className="card-title text-xl font-bold">The Trainer Workflow</h3>
                  <p className="text-xs text-secondary font-semibold">Insight & Mentorship</p>
                </div>
              </div>
              <p className="text-sm text-base-content/75 leading-relaxed">
                Trainers gain administrative capacity to view player records, add notes, and finalize professional matches. By checking reviews, trainers can assign values for Intensity, Attitude, and Performance, offering concrete action items.
              </p>
              <div className="card-actions justify-end pt-2">
                <div className="badge badge-secondary badge-outline text-xs">Grading Metrics</div>
                <div className="badge badge-secondary badge-outline text-xs">Review Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Call to Action */}
        <div className="hero bg-base-100 rounded-3xl border border-base-content/10 shadow-2xl p-6 sm:p-12 text-center max-w-5xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="max-w-md mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl font-extrabold">Ready to track player progress?</h2>
            <p className="text-sm sm:text-base text-base-content/70">
              Start creating matches, recording stats, and collaborating with your team today. Log in or create a player profile.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="btn btn-primary hover:scale-105 active:scale-95 transition-all px-6">
                Enter Dashboard
              </Link>
              <Link href="/" className="btn btn-ghost hover:scale-105 active:scale-95 transition-all">
                Home Page
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}