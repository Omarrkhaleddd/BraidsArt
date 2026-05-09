import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center mx-auto px-4">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-serif font-semibold text-foreground tracking-tight">BraidsArt</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium ml-auto">
          <Link 
            href="/" 
            className={`transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-foreground/80'}`}
          >
            Gallery
          </Link>
          <Link 
            href="/book" 
            className={`transition-colors hover:text-primary ${location === '/book' ? 'text-primary' : 'text-foreground/80'}`}
          >
            Book Now
          </Link>
          <Link 
            href="/admin" 
            className={`transition-colors hover:text-primary ${location.startsWith('/admin') ? 'text-primary' : 'text-foreground/80'}`}
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 mx-auto px-4 text-center md:text-left">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm leading-loose text-muted-foreground">
            © 2025 BraidsArt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
