import { useState } from "react";
import {
  ArrowLeft,
  Droplets,
  CreditCard,
  Clock,
  Truck,
  CheckCircle2,
  Copy,
  Users,
  CircleHelp,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import type { ClientStep, ClientViewProps, RequestMode } from "@/types/client";
import {
  BATCH_PRICE_PER_LITER,
  PRIORITY_FULL_TANKER_PRICE,
  PRIORITY_PRICE_PER_LITER,
  TANK_SIZES,
  TIME_SLOTS,
} from "@/constants/water"; 

// interface ClientViewProps {
//   onBack: () => void;
// }

// type ClientStep = "request" | "payment" | "batch" | "tanker" | "delivery" | "completed";
// type RequestMode = "batch" | "priority";

// const BATCH_PRICE_PER_LITER = 5;
// const PRIORITY_PRICE_PER_LITER = 7;
// const TANK_SIZES = [500, 1000, 1500, 2000, 2500, 3000, 5000];
// const TIME_SLOTS = [
//   "Within 2 hours",
//   "6:00 AM - 9:00 AM",
//   "9:00 AM - 12:00 PM",
//   "12:00 PM - 3:00 PM",
//   "3:00 PM - 6:00 PM",
// ];

const ClientView = ({ onBack }: ClientViewProps) => {
  const [step, setStep] = useState<ClientStep>("request");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [requestMode, setRequestMode] = useState<RequestMode>("batch");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaveBatchWarning, setShowLeaveBatchWarning] = useState(false);
  const [otp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  const unitPrice =
    requestMode === "batch" ? BATCH_PRICE_PER_LITER : PRIORITY_PRICE_PER_LITER;

  // const price = selectedSize ? selectedSize * unitPrice : 0;
  const price =
  requestMode === "priority"
    ? PRIORITY_FULL_TANKER_PRICE
    : selectedSize
    ? selectedSize * BATCH_PRICE_PER_LITER
    : 0;

  const canContinueToPayment =
    !!selectedSize && (requestMode === "batch" || !!selectedTimeSlot);

  const copyOtp = () => {
    navigator.clipboard.writeText(otp);
    toast.success("OTP copied to clipboard");
  };

  const goBack = () => {
    if (step === "request") {
      onBack();
      return;
    }

    if (step === "payment") {
      setStep("request");
      return;
    }

    if (step === "batch") {
      setStep("payment");
      return;
    }

    if (step === "tanker") {
      setStep(requestMode === "batch" ? "batch" : "payment");
      return;
    }

    if (step === "delivery") {
      setStep("tanker");
      return;
    }

    if (step === "completed") {
      setStep("delivery");
    }
  };

  const handlePayment = () => {
    toast.success("Payment confirmed!");

    if (requestMode === "batch") {
      setStep("batch");
    } else {
      setStep("tanker");
    }
  };

  const handleCancelBeforePayment = () => {
    setSelectedSize(null);
    setSelectedTimeSlot(null);
    setRequestMode("batch");
    toast.success("Request cancelled before payment");
    onBack();
  };

  const handleLeaveBatch = () => {
    setShowLeaveBatchWarning(false);
    setStep("request");
    setSelectedSize(null);
    setSelectedTimeSlot(null);
    setRequestMode("batch");
    toast.error("You left the batch. Your payment was forfeited.");
  };

  const pageTitle =
    step === "request"
      ? "Request Water"
      : step === "payment"
      ? "Confirm Payment"
      : step === "batch"
      ? "Your Batch"
      : step === "tanker"
      ? requestMode === "priority"
        ? "Priority Delivery"
        : "Tanker Assigned"
      : step === "delivery"
      ? "Delivery"
      : "Completed";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-foreground text-lg">{pageTitle}</h1>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground hover:border-primary/30 transition-colors"
            aria-label="Help"
          >
            <CircleHelp className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-5">
        {/* Step: Request */}
        {step === "request" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Choose your delivery option</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick the plan that works best for you
              </p>
            </div>

            {/* Request mode selection */}
            <div className="space-y-3">
              <button
                onClick={() => setRequestMode("batch")}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  requestMode === "batch"
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">Batch Saver</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Lower Cost
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Join nearby customers in your area and pay less. Delivery starts
                      when the batch is filled.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRequestMode("priority")}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                  requestMode === "priority"
                    ? "border-warning bg-warning/5 shadow-md"
                    : "border-border bg-card hover:border-warning/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">Priority Delivery</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                        Premium
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get faster delivery in your preferred time window. full tanker payment required.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Time slot for priority */}
            {requestMode === "priority" && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">Select delivery period</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Priority requests need a preferred time window
                  </p>
                </div>

                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                        selectedTimeSlot === slot
                          ? "border-warning bg-warning/5 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-warning/30"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tank size */}
            <div>
              <div className="mb-3">
                <h3 className="font-semibold text-foreground">How much water do you need?</h3>
                <p className="text-sm text-muted-foreground mt-1">Select your tank size</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TANK_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-xl border-2 p-4 text-center transition-all duration-200 active:scale-95 ${
                      selectedSize === size
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-2xl font-bold text-foreground">
                      {(size / 1000).toFixed(size < 1000 ? 1 : 0)}k
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {size.toLocaleString()} Liters
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedSize && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery type</span>
                  <span className="font-medium text-foreground">
                    {requestMode === "batch" ? "Batch Saver" : "Priority Delivery"}
                  </span>
                </div>

                {requestMode === "priority" && selectedTimeSlot && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preferred period</span>
                    <span className="font-medium text-foreground">{selectedTimeSlot}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Water quantity</span>
                  <span className="font-medium text-foreground">
                    {selectedSize.toLocaleString()}L
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">₦{unitPrice}/liter</span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground text-xl">
                    ₦{price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full h-14 rounded-xl text-base"
                disabled={!canContinueToPayment}
                onClick={() => setStep("payment")}
              >
                Continue to Payment
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base"
                onClick={handleCancelBeforePayment}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Request
              </Button>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-4xl font-extrabold text-foreground">₦{price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  for {selectedSize?.toLocaleString()}L of water
                </p>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery type</span>
                  <span className="font-medium text-foreground">
                    {requestMode === "batch" ? "Batch Saver" : "Priority Delivery"}
                  </span>
                </div>

                {requestMode === "priority" && selectedTimeSlot && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery period</span>
                    <span className="font-medium text-foreground">{selectedTimeSlot}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">₦{unitPrice}/liter</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full h-14 rounded-xl text-base"
                onClick={handlePayment}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₦{price.toLocaleString()}
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base"
                onClick={handleCancelBeforePayment}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Before Payment
              </Button>

              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  Payment is held securely until delivery is confirmed. Batch orders can be
                  cancelled freely before payment. Once you pay and join a batch, leaving the
                  batch means you may forfeit your payment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Batch Status */}
        {step === "batch" && (
          <div className="space-y-6">
            {/* OTP Card */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Delivery OTP</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-extrabold tracking-[0.3em] text-primary">
                  {otp}
                </span>
                <button onClick={copyOtp} className="text-primary hover:text-primary/70">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Share this with the driver to confirm delivery
              </p>
            </div>

            {/* Batch Progress */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Batch Progress</h3>
                <span className="text-sm font-medium text-primary">7,500L / 10,000L</span>
              </div>

              <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: "75%" }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">4 members in this batch</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Waiting for 2,500L more to fill batch
                  </span>
                </div>
              </div>
            </div>

            {/* Your order */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">Your Order</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery type</span>
                <span className="text-foreground font-medium">Batch Saver</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Quantity</span>
                <span className="text-foreground font-medium">{selectedSize?.toLocaleString()}L</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="text-foreground font-medium">₦{price.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="success"
                className="w-full h-14 rounded-xl text-base"
                onClick={() => setStep("tanker")}
              >
                Batch Filled — View Tanker
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-base border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => setShowLeaveBatchWarning(true)}
              >
                Leave Batch
              </Button>
            </div>
          </div>
        )}

        {/* Step: Tanker Assigned / Priority Delivery */}
        {step === "tanker" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Truck className="h-7 w-7 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {requestMode === "priority" ? "Priority Delivery Scheduled" : "Tanker Assigned"}
                  </h3>
                  <p className="text-sm text-muted-foreground">Toyota Dyna • ABC-123-XY</p>
                </div>
              </div>

              {requestMode === "priority" && selectedTimeSlot && (
                <div className="mb-5 rounded-xl bg-warning/5 border border-warning/20 p-4">
                  <p className="text-sm text-muted-foreground">Preferred delivery period</p>
                  <p className="font-semibold text-foreground mt-1">{selectedTimeSlot}</p>
                </div>
              )}

              <div className="space-y-4">
                {requestMode === "batch"
                  ? [
                      { label: "Tanker accepted batch", done: true },
                      { label: "Loading water", done: true },
                      { label: "Water loaded — en route", done: true },
                      { label: "Delivering to members", done: false, active: true },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            s.done
                              ? "bg-success"
                              : s.active
                              ? "bg-primary animate-pulse"
                              : "bg-secondary"
                          }`}
                        >
                          {s.done ? (
                            <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                          ) : (
                            <span
                              className={`text-xs font-bold ${
                                s.active ? "text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            s.done
                              ? "text-foreground"
                              : s.active
                              ? "text-primary font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))
                  : [
                      { label: "Priority request accepted", done: true },
                      { label: "Scheduling your delivery", done: true },
                      { label: "Tanker loaded and en route", done: false, active: true },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            s.done
                              ? "bg-success"
                              : s.active
                              ? "bg-warning animate-pulse"
                              : "bg-secondary"
                          }`}
                        >
                          {s.done ? (
                            <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                          ) : (
                            <span
                              className={`text-xs font-bold ${
                                s.active ? "text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            s.done
                              ? "text-foreground"
                              : s.active
                              ? "text-warning font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    ))}
              </div>
            </div>

            {requestMode === "batch" && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-3">Delivery Queue</h3>
                <div className="space-y-3">
                  {[
                    { name: "Adewale O.", liters: 2000, status: "Delivered" },
                    { name: "Chioma N.", liters: 1500, status: "Delivering" },
                    { name: "You", liters: selectedSize!, status: "Next" },
                    { name: "Fatima B.", liters: 2000, status: "Waiting" },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            m.status === "Delivered"
                              ? "bg-success"
                              : m.status === "Delivering"
                              ? "bg-warning"
                              : m.status === "Next"
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className={`${m.name === "You" ? "font-bold text-primary" : "text-foreground"}`}>
                          {m.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{m.liters.toLocaleString()}L</span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            m.status === "Delivered"
                              ? "bg-success/10 text-success"
                              : m.status === "Delivering"
                              ? "bg-warning/10 text-warning"
                              : m.status === "Next"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="hero"
              className="w-full h-14 rounded-xl text-base"
              onClick={() => setStep("delivery")}
            >
              {requestMode === "priority" ? "Driver Is Arriving" : "Tanker Is Here"}
            </Button>
          </div>
        )}

        {/* Step: Delivery */}
        {step === "delivery" && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Truck className="h-10 w-10 text-warning" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {requestMode === "priority" ? "Your Delivery Has Arrived!" : "Tanker Has Arrived!"}
              </h2>
              <p className="text-muted-foreground mt-2">
                Share your OTP with the driver to confirm delivery
              </p>
            </div>

            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Your OTP</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-extrabold tracking-[0.3em] text-primary">{otp}</span>
              </div>
            </div>

            <Button
              variant="success"
              className="w-full h-14 rounded-xl text-base"
              onClick={() => {
                toast.success("Delivery confirmed! Thank you.");
                setStep("completed");
              }}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Delivery Confirmed
            </Button>
          </div>
        )}

        {/* Step: Completed */}
        {step === "completed" && (
          <div className="space-y-6 text-center py-10">
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Water Delivered!</h2>
              <p className="text-muted-foreground mt-2">
                {selectedSize?.toLocaleString()}L has been delivered to your tank
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 text-left">
              <h3 className="font-semibold text-foreground mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery type</span>
                  <span className="text-foreground font-medium">
                    {requestMode === "batch" ? "Batch Saver" : "Priority Delivery"}
                  </span>
                </div>

                {requestMode === "priority" && selectedTimeSlot && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preferred period</span>
                    <span className="text-foreground font-medium">{selectedTimeSlot}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Water delivered</span>
                  <span className="text-foreground font-medium">{selectedSize?.toLocaleString()}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span className="text-foreground font-medium">₦{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery OTP</span>
                  <span className="text-foreground font-medium">{otp}</span>
                </div>
              </div>
            </div>

            <Button variant="hero" className="w-full h-14 rounded-xl text-base" onClick={onBack}>
              Back to Home
            </Button>
          </div>
        )}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Need Help?</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <button className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <p className="font-medium text-foreground">Payment Issue</p>
                <p className="text-muted-foreground mt-1">
                  Report a failed charge or payment confirmation problem
                </p>
              </button>

              <button className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <p className="font-medium text-foreground">Delivery Delay</p>
                <p className="text-muted-foreground mt-1">
                  Get help if your delivery is taking too long
                </p>
              </button>

              <button className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <p className="font-medium text-foreground">OTP / Driver Issue</p>
                <p className="text-muted-foreground mt-1">
                  Resolve issues with delivery confirmation or the assigned driver
                </p>
              </button>

              <button className="w-full text-left rounded-xl border border-border p-4 hover:border-primary/30 transition-colors">
                <p className="font-medium text-foreground">Cancellation Question</p>
                <p className="text-muted-foreground mt-1">
                  Learn more about refunds, penalties, and leaving a batch
                </p>
              </button>
            </div>

            <Button variant="hero" className="w-full h-12 rounded-xl">
              Contact Support
            </Button>
          </div>
        </div>
      )}

      {/* Leave Batch Warning Modal */}
      {showLeaveBatchWarning && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card border border-border p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Leave Batch?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                You are already part of a shared batch. Leaving now will cancel your request,
                affect the batch, and your payment will be forfeited.
              </p>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
              <p className="text-sm text-foreground font-medium">Penalty applies</p>
              <p className="text-xs text-muted-foreground mt-1">
                This action removes you from the batch and you will lose the money already paid.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setShowLeaveBatchWarning(false)}
              >
                Keep My Spot
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-12 rounded-xl"
                onClick={handleLeaveBatch}
              >
                Leave Batch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientView;