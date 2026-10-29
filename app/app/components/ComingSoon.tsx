type ComingSoonProps = {
  eyebrow: string;
  title: string;
};

export function ComingSoon({ eyebrow, title }: ComingSoonProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
      </header>

      <section className="panel mt-6">
        <p className="text-sm text-muted">Esta tela ainda está em construção.</p>
      </section>
    </main>
  );
}