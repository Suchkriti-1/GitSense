import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  onGetStarted?: () => void;
}

export function Header({ onGetStarted }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Preview", href: "#preview" },
    { name: "FAQ", href: "#faq" },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 80;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-header py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="/" className="z-50 group">
            <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:opacity-80 transition-opacity">
              Revv
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleScrollTo(e, link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onGetStarted}
              className="text-sm font-medium text-white hover:text-white/80 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 text-sm font-semibold bg-white text-black hover:bg-white/90 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>

          <button
            className="md:hidden text-white z-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-black/95 backdrop-blur-xl z-40 transition-all duration-300 md:hidden flex flex-col justify-center items-center gap-8 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {navLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            onClick={(e) => handleScrollTo(e, link.href)}
            className="text-2xl font-display font-bold text-white/80 hover:text-white transition-colors"
          >
            {link.name}
          </a>
        ))}
        <div className="flex flex-col gap-4 mt-8 w-64">
          <button
            onClick={() => { setMobileMenuOpen(false); onGetStarted?.(); }}
            className="w-full px-5 py-4 text-center font-medium border border-white/20 text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => { setMobileMenuOpen(false); onGetStarted?.(); }}
            className="w-full px-5 py-4 text-center font-bold bg-white text-black rounded-xl hover:bg-white/90 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </header>
  );
}
