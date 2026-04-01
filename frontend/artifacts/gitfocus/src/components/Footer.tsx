export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          © 2026 Revv. 
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Built for developers, with</span>
          <span className="text-white text-base">♥</span>
        </div>
      </div>
    </footer>
  );
}
