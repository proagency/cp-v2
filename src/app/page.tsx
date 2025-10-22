export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Tailwind Smoke Test</h1>
      <p className="text-sm text-muted-foreground">If this is gray and blocks below are styled, Tailwind v3 is live.</p>
      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Muted block</div>
      <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Primary Button</button>
      <div className="rounded-md border p-3">Bordered card</div>
      <div className="pt-4">
        <a href="/signin" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in</a>
      </div>
    </main>
  );
}
