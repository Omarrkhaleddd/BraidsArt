import { Navbar, Footer } from "@/components/layout";
import { Link } from "wouter";
import { useListDesigns } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: designs, isLoading } = useListDesigns();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero.png')] bg-cover bg-center opacity-40 mix-blend-multiply" />
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-[800px]">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-serif text-foreground">
                  Your Crown, <span className="text-primary italic">Crafted</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl lg:text-2xl mt-6 font-sans">
                  A premium braiding experience. We celebrate the artistry of Black hair culture with warmth, precision, and joy.
                </p>
              </div>
              <div className="space-x-4 mt-8">
                <Link href="/book">
                  <Button size="lg" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                    Book an Appointment <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-serif">Signature Styles</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Explore our curated collection of beautiful, protective styles.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="overflow-hidden border-none shadow-md">
                    <Skeleton className="w-full h-[300px]" />
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-4/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : designs && designs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {designs.map(design => (
                  <Card key={design.id} className="overflow-hidden border-border shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full bg-card">
                    <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                      {design.imageUrl ? (
                        <img 
                          src={design.imageUrl} 
                          alt={design.name}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 p-6 text-center">
                          <span className="font-serif text-2xl text-primary/60 font-medium italic">{design.name}</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-foreground shadow-sm flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {design.price}
                      </div>
                    </div>
                    <CardHeader className="flex-none">
                      <CardTitle className="font-serif text-2xl group-hover:text-primary transition-colors">{design.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="grow flex flex-col justify-between">
                      <p className="text-muted-foreground line-clamp-3 mb-4">
                        {design.description || "A beautiful, carefully crafted protective style."}
                      </p>
                      <div className="flex items-center text-sm font-medium text-foreground/80 bg-muted/50 w-fit px-3 py-1.5 rounded-md">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        {design.durationHours} hours
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t border-border/50">
                      <Link href={`/book?designId=${design.id}`} className="w-full">
                        <Button className="w-full rounded-full" variant="outline">
                          Select Style
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted rounded-xl">
                <h3 className="text-xl font-medium text-muted-foreground">No designs available yet.</h3>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
