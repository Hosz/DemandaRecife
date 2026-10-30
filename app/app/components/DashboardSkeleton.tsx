function Block({ className }: { className: string }) {
  return <div className={`rounded-lg bg-white/[0.08] ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o briefing do dia"
      className="animate-pulse"
    >
      <div className="mb-4 h-16 w-64 rounded-2xl bg-white/[0.06]" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="panel">
            <div className="flex items-center justify-between">
              <Block className="size-10 rounded-xl" />
              <Block className="h-5 w-12 rounded-full" />
            </div>
            <Block className="mt-6 h-3 w-24" />
            <Block className="mt-3 h-8 w-32" />
            <Block className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div className="panel">
          <Block className="h-3 w-28" />
          <Block className="mt-3 h-5 w-40" />
          <Block className="mt-5 h-44 w-full" />
          <Block className="mt-5 h-3 w-32" />
        </div>

        <div className="panel">
          <Block className="h-3 w-28" />
          <Block className="mt-3 h-5 w-36" />
          <Block className="mt-5 h-20 w-full rounded-2xl" />
          <Block className="mt-3 h-20 w-full rounded-2xl" />
          <Block className="mt-3 h-20 w-full rounded-2xl" />
        </div>

        <div className="panel">
          <Block className="h-3 w-32" />
          <Block className="mt-3 h-5 w-40" />
          <Block className="mt-5 h-10 w-full" />
          <Block className="mt-3 h-10 w-full" />
          <Block className="mt-3 h-10 w-full" />
        </div>
      </div>

      <span className="sr-only">Carregando...</span>
    </div>
  );
}