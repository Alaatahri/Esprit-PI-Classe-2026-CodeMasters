export default function EspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="bmp-app-vignette" aria-hidden />
      <main className="relative z-10 mx-auto w-full max-w-7xl bmp-page">
        {children}
      </main>
    </div>
  );
}