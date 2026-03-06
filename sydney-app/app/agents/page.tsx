const agents = [
  {
    id: "sydney",
    name: "Sydney",
    role: "Orchestrator / Infra",
    model: "GPT 5.1 mini (cloud)",
    status: "Idle",
    lastActive: "about 1 hour ago",
    color: "from-sky-500/60 to-sky-400/10",
  },
  {
    id: "olivia",
    name: "Olivia",
    role: "Local Dev & UI",
    model: "Qwen3 8B (local)",
    status: "Idle",
    lastActive: "about 3 hours ago",
    color: "from-emerald-500/60 to-emerald-400/10",
  },
  {
    id: "elon",
    name: "Elon",
    role: "Strategy & Direction",
    model: "GPT 5.1 mini (strategy mode)",
    status: "Idle",
    lastActive: "about 1 day ago",
    color: "from-amber-500/60 to-amber-400/10",
  },
  {
    id: "scribe",
    name: "Scribe",
    role: "Notes & Summaries",
    model: "Lightweight local model",
    status: "Idle",
    lastActive: "about 5 hours ago",
    color: "from-fuchsia-500/60 to-fuchsia-400/10",
  },
  {
    id: "scout",
    name: "Scout",
    role: "Research & Links",
    model: "Web + GPT 5 mini",
    status: "Idle",
    lastActive: "about 8 hours ago",
    color: "from-blue-500/60 to-blue-400/10",
  },
  {
    id: "pixel",
    name: "Pixel",
    role: "Visual & Mindmap",
    model: "Local tools",
    status: "Idle",
    lastActive: "about 2 days ago",
    color: "from-violet-500/60 to-violet-400/10",
  },
];

const leader = {
  id: "daniel",
  name: "Daniel",
  role: "CEO",
  model: "Human",
  status: "Active",
  lastActive: "now",
  color: "from-rose-500/60 to-rose-400/10",
};

export default function AgentsPage() {
  return (
    <div className="min-h-screen px-6 py-8 text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Team
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Agents
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              High-level view of the crew: who they are, what they&apos;re for, and
              whether they&apos;re currently active. This is static for now; later
              we can wire it to real status.
            </p>
          </div>
          <div className="text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
              {agents.length} agents
            </span>
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex justify-center">
            <article className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-5 sm:py-5">
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${leader.color}`}
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-50">
                    {leader.name}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">{leader.role}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                  {leader.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span>Model: {leader.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span>Standing by</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span>Last active {leader.lastActive}</span>
                </div>
              </div>
            </article>
          </div>

          <div className="flex justify-center">
            <div className="h-6 w-px bg-zinc-800" />
          </div>

          <div className="flex justify-center">
            {agents
              .filter((agent) => agent.id === "sydney")
              .map((agent) => (
                <article
                  key={agent.id}
                  className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-5 sm:py-5"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${agent.color}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-50">
                        {agent.name}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400">{agent.role}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-300">
                      {agent.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Model: {agent.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Standing by</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Last active {agent.lastActive}</span>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-px bg-zinc-800" />
            <div className="h-px w-full max-w-3xl bg-zinc-800" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents
              .filter((agent) => agent.id !== "sydney")
              .map((agent) => (
                <article
                  key={agent.id}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 sm:px-5 sm:py-5"
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${agent.color}`}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-50">
                        {agent.name}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400">{agent.role}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-300">
                      {agent.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Model: {agent.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Standing by</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />
                      <span>Last active {agent.lastActive}</span>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

