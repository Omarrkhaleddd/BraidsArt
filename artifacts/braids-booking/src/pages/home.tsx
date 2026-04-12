import { Navbar, Footer } from "@/components/layout";
import { Link } from "wouter";
import { useListDesigns } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: designs, isLoading } = useListDesigns();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-16 md:py-28 lg:py-40 bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center opacity-40 mix-blend-multiply" />
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="flex flex-col items-center space-y-6 text-center">
              <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-serif text-foreground leading-none">
                Your Crown,{" "}
                <span className="text-primary italic">Crafted</span>
              </h1>
              <p className="mx-auto max-w-[600px] text-foreground/70 md:text-xl lg:text-2xl font-sans">
                A premium braiding experience rooted in artistry and culture.
              </p>
              <Link href="/book">
                <Button size="lg" className="h-13 px-10 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 mt-2">
                  Book an Appointment <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="w-full py-16 md:py-28 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl font-serif mb-3">
                Signature Styles
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                A curated collection of our most loved protective styles.
              </p>
            </div>

            {isLoading ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="break-inside-avoid">
                    <Skeleton className={`w-full rounded-2xl ${i % 3 === 0 ? "h-[400px]" : i % 3 === 1 ? "h-[280px]" : "h-[340px]"}`} />
                  </div>
                ))}
              </div>
            ) : designs && designs.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {designs.map((design, i) => (
                  <Link key={design.id} href={`/book?designId=${design.id}`} className="block break-inside-avoid group">
                    <div className="relative rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300">
                      {design.imageUrl ? (
                        <img
                          src={design.imageUrl}
                          alt={design.name}
                          className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full flex items-center justify-center bg-secondary/40"
                          style={{ height: `${280 + (i % 3) * 80}px` }}
                        >
                          <Scissors className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      {/* Hover overlay with name */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <div>
                          <p className="text-white font-serif text-xl font-semibold leading-tight">{design.name}</p>
                          <p className="text-white/70 text-sm mt-1">Tap to book →</p>
                        </div>
                      </div>
                      {/* Always-visible name bar at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 group-hover:opacity-0 transition-opacity duration-300">
                        <p className="text-white font-serif font-medium text-base leading-snug">{design.name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-muted/40 rounded-2xl">
                <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-xl font-medium text-muted-foreground">No styles available yet.</h3>
              </div>
            )}

            {designs && designs.length > 0 && (
              <div className="text-center mt-14">
                <Link href="/book">
                  <Button size="lg" className="rounded-full px-10 h-12 text-base">
                    Book Your Style <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
