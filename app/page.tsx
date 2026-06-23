import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-base-100 via-base-200 to-base-300">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 sm:px-8 lg:px-12 text-center flex flex-col items-center justify-center min-h-[75vh]">
        {/* Subtle decorative glow circles */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <span>⚽ Player Performance Tracking</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent pb-2">
            Track Matches. Share Feedback.<br />
            Elevate Player Performance.
          </h1>

          <p className="text-lg sm:text-xl text-base-content/75 max-w-2xl mx-auto leading-relaxed">
            The professional player tracker portal designed to record pitch minutes, log goals and assists, evaluate tactical ratings, and share trainer reflections.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Link 
              href="/dashboard" 
              className="btn btn-primary btn-lg shadow-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto px-8"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/about" 
              className="btn btn-outline btn-secondary btn-lg hover:scale-105 active:scale-95 transition-all w-full sm:w-auto px-8"
            >
              How it Works
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="container mx-auto px-6 max-w-5xl mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-base-100 rounded-3xl border border-base-content/10 shadow-2xl">
          <div className="text-center space-y-2 p-4 border-b sm:border-b-0 sm:border-r border-base-content/10">
            <div className="text-4xl font-extrabold text-primary">100%</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">Performance Centric</div>
            <p className="text-xs text-base-content/60 px-4">Track every metric including goals, assists, physical intensity, and attitude.</p>
          </div>
          <div className="text-center space-y-2 p-4 border-b sm:border-b-0 sm:border-r border-base-content/10">
            <div className="text-4xl font-extrabold text-secondary">Collaborative</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">Trainer + Player</div>
            <p className="text-xs text-base-content/60 px-4">Bridge the feedback loop with self-reflections and professional evaluations.</p>
          </div>
          <div className="text-center space-y-2 p-4">
            <div className="text-4xl font-extrabold text-accent">Active</div>
            <div className="text-sm font-semibold uppercase text-base-content/50">Realtime Dashboard</div>
            <p className="text-xs text-base-content/60 px-4">Instant dashboard reviews, status updates, and custom development paths.</p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="container mx-auto px-6 max-w-6xl py-12 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold">Key Platform Features</h2>
          <p className="text-base-content/60">Designed to give you deep insights into match performances and development.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-2xl text-primary">
                ⚽
              </div>
              <h3 className="card-title text-xl font-bold">Match Scheduling & Logs</h3>
              <p className="text-sm text-base-content/70">
                Log league games, cup fixtures, friendlies, and training sessions. Keep all match parameters like date, location, and status organized in a clear workspace.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-secondary/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-2xl text-secondary">
                📊
              </div>
              <h3 className="card-title text-xl font-bold">Comprehensive Metrics</h3>
              <p className="text-sm text-base-content/70">
                Grade performances with specific parameters like Work Intensity, Team Attitude, and Tactical Execution. View numerical stats like total goals, assists, and minutes.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="card bg-base-100 border border-base-content/10 shadow-xl hover:shadow-2xl hover:border-accent/30 transition-all duration-300">
            <div className="card-body space-y-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-2xl text-accent">
                💬
              </div>
              <h3 className="card-title text-xl font-bold">Expert Feedback Loop</h3>
              <p className="text-sm text-base-content/70">
                Trainers can review logs and provide expert critique, while players log self-reflections to evaluate their strengths, weaknesses, and concrete improvement plans.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Workflow Showcase */}
      <section className="container mx-auto px-6 max-w-5xl py-12">
        <div className="bg-base-100 rounded-3xl border border-base-content/10 shadow-2xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="badge badge-accent font-semibold">How it is structured</span>
            <h2 className="text-2xl sm:text-3xl font-bold">Seamless Trainer & Player Workflows</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-base-content/10">
            
            {/* Player block */}
            <div className="space-y-4 pt-6 md:pt-0">
              <div className="flex items-center gap-3 text-xl font-bold">
                <span>🏃‍♂️</span>
                <h3>For Players</h3>
              </div>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Log your own match minutes, input statistics, write self-reflections on what went right, note your key strengths or weaknesses, and build development plans under trainer reviews.
              </p>
              <ul className="text-xs text-base-content/60 space-y-1.5">
                <li>• Self-evaluate workload and team spirit</li>
                <li>• Review historical performance charts</li>
                <li>• Track improvement milestones</li>
              </ul>
            </div>

            {/* Trainer block */}
            <div className="space-y-4 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center gap-3 text-xl font-bold">
                <span>📋</span>
                <h3>For Trainers</h3>
              </div>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Oversee matches, assign tactical marks (scores out of 10), review player inputs, and leave expert technical feedback to boost player development.
              </p>
              <ul className="text-xs text-base-content/60 space-y-1.5">
                <li>• Mark matches as fully reviewed</li>
                <li>• Grade tactical compliance & attitude</li>
                <li>• Set training objectives for players</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="container mx-auto px-6 max-w-4xl py-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Start Tracking Today</h2>
        <p className="text-sm sm:text-base text-base-content/70 max-w-md mx-auto">
          Sign up to build player files, log matches, and start analyzing statistics with teammates.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="btn btn-primary hover:scale-105 active:scale-95 transition-all px-8">
            Get Started
          </Link>
          <Link href="/about" className="btn btn-ghost hover:scale-105 active:scale-95 transition-all">
            Read Docs
          </Link>
        </div>
      </section>

    </div>
  );
}
