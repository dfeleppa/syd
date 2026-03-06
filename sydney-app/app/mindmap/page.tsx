export default function MindmapPage() {
  return (
    <div className="min-h-screen bg-black px-6 py-8 text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-4">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Work
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Mindmap
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl">
            Blank canvas for mapping ideas, projects, and connections. We can
            turn this into a real node-based mindmap later; for now it is a
            simple placeholder screen.
          </p>
        </header>

        <section className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-10 text-center text-sm text-zinc-500">
          <p>Mindmap canvas coming soon.</p>
          <p className="mt-2">
            Use this space to sketch how you want your nodes and links to
            behave, and we will wire the interactions in the next pass.
          </p>
        </section>
      </div>
    </div>
  );
}

