import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar, Footer } from "@/components/layout";
import { useListDesigns, useGetAvailableSlots, useCreateBooking, getGetAvailableSlotsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function Book() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialDesignId = searchParams.get("designId") ? parseInt(searchParams.get("designId")!) : null;

  const [step, setStep] = useState(initialDesignId ? 2 : 1);
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(initialDesignId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<{startTime: string, endTime: string} | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [isSuccess, setIsSuccess] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: designs, isLoading: designsLoading } = useListDesigns();
  
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  
  const { data: availableSlotsResponse, isLoading: slotsLoading } = useGetAvailableSlots(
    { date: dateStr, designId: selectedDesignId! },
    { query: { enabled: !!selectedDate && !!selectedDesignId } }
  );

  const createBooking = useCreateBooking();

  const handleDesignSelect = (id: number) => {
    setSelectedDesignId(id);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
  };

  const handleSlotSelect = (slot: {startTime: string, endTime: string}) => {
    setSelectedSlot(slot);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignId || !selectedDate || !selectedSlot || !customerName) return;

    createBooking.mutate({
      data: {
        designId: selectedDesignId,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        notes: notes || undefined
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        // Invalidate slots
        queryClient.invalidateQueries({ queryKey: getGetAvailableSlotsQueryKey({ date: format(selectedDate, "yyyy-MM-dd"), designId: selectedDesignId }) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      onError: (error: any) => {
        toast({
          title: "Booking failed",
          description: error?.message || "There was an error booking your appointment.",
          variant: "destructive"
        });
      }
    });
  };

  const selectedDesign = designs?.find(d => d.id === selectedDesignId);

  if (isSuccess) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-muted/30">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="w-full max-w-lg shadow-xl border-none">
            <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Appointment Confirmed!</h2>
              <p className="text-muted-foreground text-lg">
                Thank you, {customerName}. We've received your booking for{" "}
                <strong className="text-foreground">{selectedDesign?.name}</strong>.
              </p>
              <div className="bg-muted w-full p-6 rounded-xl flex flex-col gap-2 mt-4 text-left">
                <div className="flex items-center gap-3 text-foreground/80">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span>{selectedDate && format(selectedDate, "EEEE, MMMM do, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{selectedSlot?.startTime} (Duration: {selectedDesign?.durationHours} hrs)</span>
                </div>
              </div>
              <Button 
                className="mt-8 rounded-full" 
                size="lg"
                onClick={() => {
                  setStep(1);
                  setSelectedDesignId(null);
                  setSelectedDate(undefined);
                  setSelectedSlot(null);
                  setIsSuccess(false);
                }}
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">Book Your Appointment</h1>
          <p className="text-muted-foreground text-lg">Let's get you scheduled for your next beautiful style.</p>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center justify-center mb-12 max-w-2xl mx-auto">
          <div className={`flex items-center \${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-medium \${step >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>1</div>
            <span className="ml-2 font-medium hidden sm:inline">Style</span>
          </div>
          <div className={`h-1 w-12 sm:w-24 mx-2 sm:mx-4 rounded-full \${step >= 2 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex items-center \${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-medium \${step >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>2</div>
            <span className="ml-2 font-medium hidden sm:inline">Date & Time</span>
          </div>
          <div className={`h-1 w-12 sm:w-24 mx-2 sm:mx-4 rounded-full \${step >= 3 ? 'bg-primary' : 'bg-border'}`}></div>
          <div className={`flex items-center \${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-medium \${step >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>3</div>
            <span className="ml-2 font-medium hidden sm:inline">Details</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-semibold mb-6">Select a Style</h2>
              {designsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                </div>
              ) : designs && designs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map(design => (
                    <div 
                      key={design.id}
                      onClick={() => handleDesignSelect(design.id)}
                      className={`cursor-pointer border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50 group \${selectedDesignId === design.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                    >
                      <div className="h-32 bg-muted overflow-hidden relative">
                        {design.imageUrl ? (
                          <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <span className="font-serif italic text-primary/60">{design.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-card">
                        <h3 className="font-serif text-lg font-semibold">{design.name}</h3>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>\${design.price}</span>
                          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{design.durationHours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No styles available.</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="mr-2 -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-serif font-semibold">Select Date & Time</h2>
                  <p className="text-sm text-muted-foreground">For {selectedDesign?.name} ({selectedDesign?.durationHours} hrs)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    className="rounded-xl border shadow-sm p-4 bg-background"
                  />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Available Times {selectedDate && `for \${format(selectedDate, "MMM do")}`}
                  </h3>
                  
                  {!selectedDate ? (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
                      Please select a date from the calendar to see available times.
                    </div>
                  ) : slotsLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                    </div>
                  ) : availableSlotsResponse?.slots && availableSlotsResponse.slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 auto-rows-max">
                      {availableSlotsResponse.slots.map((slot, i) => (
                        <Button
                          key={i}
                          variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                          className={`h-12 \${selectedSlot?.startTime === slot.startTime ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {slot.startTime}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center bg-muted/30">
                      <p className="text-muted-foreground mb-2">No availability on this date.</p>
                      <p className="text-sm text-muted-foreground/70">Please try selecting another day.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(2)} className="mr-2 -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-serif font-semibold">Your Details</h2>
                  <p className="text-sm text-muted-foreground">Almost done!</p>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-5 mb-8 border border-primary/10">
                <h3 className="font-serif font-medium text-lg mb-3">Appointment Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">STYLE</span>
                    <span className="font-medium text-foreground">{selectedDesign?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">DATE & TIME</span>
                    <span className="font-medium text-foreground">
                      {selectedDate && format(selectedDate, "MMM do, yyyy")} at {selectedSlot?.startTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">DURATION</span>
                    <span className="font-medium text-foreground">{selectedDesign?.durationHours} hours</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">PRICE</span>
                    <span className="font-medium text-foreground">\${selectedDesign?.price}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="Jane Doe" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                    required 
                    className="h-12 bg-background"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="(555) 123-4567" 
                      value={customerPhone} 
                      onChange={e => setCustomerPhone(e.target.value)} 
                      className="h-12 bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="jane@example.com" 
                      value={customerEmail} 
                      onChange={e => setCustomerEmail(e.target.value)} 
                      className="h-12 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any specific requests or information we should know?" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="min-h-[100px] bg-background"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg rounded-full mt-4" 
                  disabled={!customerName || createBooking.isPending}
                >
                  {createBooking.isPending ? "Confirming..." : "Confirm Appointment"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
