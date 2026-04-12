import { useState } from "react";
import { Navbar, Footer } from "@/components/layout";
import { useListDesigns, useGetAvailableSlots, useCreateBooking, getGetAvailableSlotsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon, CheckCircle2, ArrowLeft, Sparkles, CreditCard, Scissors } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const EXTENSION_PRICE = 400;
const EXTENSION_HOURS = 1;
const DEPOSIT_PERCENT = 0.2;

export default function Book() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialDesignId = searchParams.get("designId") ? parseInt(searchParams.get("designId")!) : null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDesignId, setSelectedDesignId] = useState<number | null>(initialDesignId);
  const [withExtension, setWithExtension] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: designs, isLoading: designsLoading } = useListDesigns();
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: availableSlotsResponse, isLoading: slotsLoading } = useGetAvailableSlots(
    { date: dateStr, designId: selectedDesignId!, withExtension },
    { query: { enabled: !!selectedDate && !!selectedDesignId } }
  );

  const createBooking = useCreateBooking();

  const selectedDesign = designs?.find((d) => d.id === selectedDesignId);
  const basePrice = selectedDesign ? parseFloat(String(selectedDesign.price)) : 0;
  const baseDuration = selectedDesign ? parseFloat(String(selectedDesign.durationHours)) : 0;
  const finalPrice = withExtension ? basePrice + EXTENSION_PRICE : basePrice;
  const finalDuration = withExtension ? baseDuration + EXTENSION_HOURS : baseDuration;
  const depositAmount = Math.round(finalPrice * DEPOSIT_PERCENT);

  const handleDesignSelect = (id: number) => {
    setSelectedDesignId(id);
    setWithExtension(false);
    setSelectedDate(undefined);
    setSelectedSlot(null);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: { startTime: string; endTime: string }) => {
    setSelectedSlot(slot);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePayment = () => {
    if (!selectedDesignId || !selectedDate || !selectedSlot || !customerName) return;
    setPaymentLoading(true);

    createBooking.mutate(
      {
        data: {
          designId: selectedDesignId,
          date: format(selectedDate, "yyyy-MM-dd"),
          startTime: selectedSlot.startTime,
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          notes: notes || undefined,
          withExtension,
          depositPaid: true,
          paymentStatus: "deposit_paid",
        },
      },
      {
        onSuccess: () => {
          setPaymentLoading(false);
          setIsSuccess(true);
          queryClient.invalidateQueries({
            queryKey: getGetAvailableSlotsQueryKey({ date: format(selectedDate!, "yyyy-MM-dd"), designId: selectedDesignId! }),
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: (error: any) => {
          setPaymentLoading(false);
          toast({
            title: "Booking failed",
            description: error?.message || "There was an error booking your appointment.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedDesignId(null);
    setWithExtension(false);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    setIsSuccess(false);
  };

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
              <h2 className="text-3xl font-serif font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground text-lg">
                Thank you, <strong className="text-foreground">{customerName}</strong>. Your{" "}
                <strong className="text-foreground">{selectedDesign?.name}</strong>
                {withExtension ? " with Extension" : ""} appointment is booked.
              </p>
              <div className="bg-muted w-full p-6 rounded-xl flex flex-col gap-3 mt-2 text-left">
                <div className="flex items-center gap-3 text-foreground/80">
                  <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
                  <span>{selectedDate && format(selectedDate, "EEEE, MMMM do, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <span>{selectedSlot?.startTime} — {finalDuration} hrs</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/80">
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <span>Deposit paid: <strong>{depositAmount} EGP</strong> (20% of {finalPrice} EGP)</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Remaining balance of <strong>{finalPrice - depositAmount} EGP</strong> is due on the day of your appointment.</p>
              <Button className="mt-4 rounded-full" size="lg" onClick={resetFlow}>
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const stepLabels = ["Style", "Date & Time", "Details", "Payment"];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">Book Your Appointment</h1>
          <p className="text-muted-foreground text-lg">Let's get you scheduled for your next beautiful style.</p>
        </div>

        {/* 4-step progress bar */}
        <div className="flex items-center justify-center mb-10 max-w-2xl mx-auto">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const active = step >= n;
            const current = step === n;
            return (
              <div key={n} className="flex items-center">
                <div className={`flex items-center ${active ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-sm transition-colors ${
                    current ? "border-primary bg-primary text-primary-foreground shadow-md" :
                    active ? "border-primary bg-primary/10 text-primary" :
                    "border-muted-foreground/40 text-muted-foreground/40"
                  }`}>{n}</div>
                  <span className={`ml-2 font-medium text-sm hidden sm:inline transition-colors ${active ? "text-primary" : "text-muted-foreground/40"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 mx-2 sm:mx-3 rounded-full transition-colors ${step > n ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6 md:p-8">

          {/* ─── STEP 1: Select Style + Extension Toggle ─── */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-serif font-semibold mb-6">Select a Style</h2>

              {designsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
                </div>
              ) : designs && designs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {designs.map((design) => (
                    <div
                      key={design.id}
                      onClick={() => handleDesignSelect(design.id)}
                      className={`cursor-pointer border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50 group ${
                        selectedDesignId === design.id
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border"
                      }`}
                    >
                      <div className="h-32 bg-muted overflow-hidden">
                        {design.imageUrl ? (
                          <img src={design.imageUrl} alt={design.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                            <span className="font-serif italic text-primary/60">{design.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-card">
                        <h3 className="font-serif text-base font-semibold leading-tight">{design.name}</h3>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>{parseFloat(String(design.price)).toLocaleString()} EGP</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{design.durationHours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No styles available.</p>
              )}

              {/* Extension toggle — shows once a design is selected */}
              {selectedDesignId && selectedDesign && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`border-2 rounded-xl p-5 transition-all duration-200 cursor-pointer ${withExtension ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    onClick={() => setWithExtension(!withExtension)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${withExtension ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                        {withExtension && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground text-base">Add Extension Hair</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">Premium imported hair extension included in your style</p>
                          </div>
                          <div className="text-right">
                            <span className="text-primary font-bold text-base">+{EXTENSION_PRICE} EGP</span>
                            <p className="text-xs text-muted-foreground">+{EXTENSION_HOURS} hour</p>
                          </div>
                        </div>
                        <div className={`mt-3 pt-3 border-t border-border flex items-center justify-between text-sm transition-all ${withExtension ? "opacity-100" : "opacity-50"}`}>
                          <span className="text-muted-foreground">Updated total</span>
                          <div className="text-right">
                            <span className="font-bold text-foreground text-base">{withExtension ? finalPrice.toLocaleString() : basePrice.toLocaleString()} EGP</span>
                            <span className="text-muted-foreground ml-2">· {withExtension ? finalDuration : baseDuration}h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 h-12 rounded-full text-base font-semibold"
                    onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    Continue — Select Date & Time
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: Date & Time ─── */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="mr-2 -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-serif font-semibold">Select Date & Time</h2>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-sm text-muted-foreground">
                      {selectedDesign?.name}
                      {withExtension && <span className="ml-1 text-primary font-medium">+ Extension</span>}
                    </p>
                    <span className="text-sm font-semibold text-primary">
                      {finalPrice.toLocaleString()} EGP · {finalDuration}h
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
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
                    Available Times{selectedDate && ` for ${format(selectedDate, "MMM do")}`}
                  </h3>

                  {!selectedDate ? (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground">
                      Please select a date to see available times.
                    </div>
                  ) : slotsLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                    </div>
                  ) : availableSlotsResponse?.slots && availableSlotsResponse.slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 auto-rows-max">
                      {availableSlotsResponse.slots.map((slot, i) => (
                        <Button
                          key={i}
                          variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                          className={`h-12 ${selectedSlot?.startTime === slot.startTime ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}
                          onClick={() => handleSlotSelect(slot)}
                        >
                          {slot.startTime}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center bg-muted/30">
                      <p className="text-muted-foreground mb-2">No availability on this date.</p>
                      <p className="text-sm text-muted-foreground/70">Please try another day.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Customer Details ─── */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(2)} className="mr-2 -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-serif font-semibold">Your Details</h2>
                  <p className="text-sm text-muted-foreground">Almost done — just a few details.</p>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-primary/5 rounded-xl p-5 mb-7 border border-primary/10">
                <h3 className="font-serif font-medium text-base mb-3">Appointment Summary</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">STYLE</span>
                    <span className="font-medium">
                      {selectedDesign?.name}
                      {withExtension && <span className="text-primary ml-1 text-xs font-semibold">+Extension</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">DATE & TIME</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, "MMM do, yyyy")} at {selectedSlot?.startTime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">DURATION</span>
                    <span className="font-medium">{finalDuration} hours</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">TOTAL PRICE</span>
                    <span className="font-bold text-primary">{finalPrice.toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="Jane Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="h-12 bg-background" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+20 100 000 0000" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-12 bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="jane@example.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="h-12 bg-background" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea id="notes" placeholder="Any specific requests or information we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] bg-background" />
                </div>

                <Button type="submit" className="w-full h-13 text-base rounded-full mt-2" disabled={!customerName}>
                  Continue to Payment
                </Button>
              </form>
            </div>
          )}

          {/* ─── STEP 4: Payment (Instapay Simulation) ─── */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
              <div className="flex items-center mb-6">
                <Button variant="ghost" size="icon" onClick={() => setStep(3)} className="mr-2 -ml-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-serif font-semibold">Deposit Payment</h2>
                  <p className="text-sm text-muted-foreground">Pay 20% to secure your slot</p>
                </div>
              </div>

              {/* Booking summary compact */}
              <div className="bg-muted/60 rounded-xl p-4 mb-6 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Style</span>
                  <span className="font-medium">{selectedDesign?.name}{withExtension ? " + Extension" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMM do")} at {selectedSlot?.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{finalDuration} hours</span>
                </div>
              </div>

              {/* Payment breakdown */}
              <div className="border border-border rounded-xl overflow-hidden mb-6">
                <div className="bg-primary/5 px-5 py-4 border-b border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Total appointment price</span>
                    <span className="font-semibold text-foreground">{finalPrice.toLocaleString()} EGP</span>
                  </div>
                </div>
                <div className="px-5 py-5 bg-card">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg text-foreground">Deposit Required (20%)</p>
                      <p className="text-muted-foreground text-sm mt-0.5">Remaining {(finalPrice - depositAmount).toLocaleString()} EGP due on the day</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-3xl text-primary">{depositAmount.toLocaleString()}</p>
                      <p className="text-muted-foreground text-sm">EGP</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instapay instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Pay via Instapay</p>
                    <p className="text-amber-800 text-sm leading-relaxed">
                      Send <strong>{depositAmount.toLocaleString()} EGP</strong> to the Instapay number provided by your salon.<br />
                      Once you have completed the transfer, click the button below to confirm your booking.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-14 text-lg rounded-full font-bold"
                onClick={handlePayment}
                disabled={paymentLoading || createBooking.isPending}
              >
                {paymentLoading || createBooking.isPending ? (
                  <span className="flex items-center gap-2"><Scissors className="h-5 w-5 animate-spin" /> Confirming Booking...</span>
                ) : (
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> I Have Paid — Confirm Booking</span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                By confirming, you agree that you have completed the Instapay deposit of {depositAmount.toLocaleString()} EGP.
              </p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}
