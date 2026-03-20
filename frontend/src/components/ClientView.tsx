import { useState } from "react";
import { ArrowLeft, Droplets, CreditCard, Clock, Truck, CheckCircle2, Copy, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
// ./components/ui/button

interface ClientViewProps {
  onBack: () => void;
}

type ClientStep = "request" | "payment" | "batch" | "tanker" | "delivery" | "completed";

const PRICE_PER_LITER = 5; // ₦5 per liter
const TANK_SIZES = [500, 1000, 1500, 2000, 2500, 3000, 5000];

const ClientView = ({ onBack }: ClientViewProps) => {
  const [step, setStep] = useState<ClientStep>("request");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [otp] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  const price = selectedSize ? selectedSize * PRICE_PER_LITER : 0;

  const copyOtp = () => {
    navigator.clipboard.writeText(otp);
    toast.success("OTP copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={step === "request" ? onBack : () => {
            const steps: ClientStep[] = ["request", "payment", "batch", "tanker", "delivery", "completed"];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-foreground text-lg">
            {step === "request" && "Request Water"}
            {step === "payment" && "Confirm Payment"}
            {step === "batch" && "Your Batch"}
            {step === "tanker" && "Tanker Assigned"}
            {step === "delivery" && "Delivery"}
            {step === "completed" && "Completed"}
          </h1>
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
              <h2 className="text-xl font-bold text-foreground">How much water do you need?</h2>
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
                  <span className="text-2xl font-bold text-foreground">{(size / 1000).toFixed(size < 1000 ? 1 : 0)}k</span>
                  <p className="text-xs text-muted-foreground mt-1">{size.toLocaleString()} Liters</p>
                </button>
              ))}
            </div>

            {selectedSize && (
              <div className="bg-card rounded-xl border border-border p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Water quantity</span>
                  <span className="font-medium text-foreground">{selectedSize.toLocaleString()}L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium text-foreground">₦{PRICE_PER_LITER}/liter</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground text-xl">₦{price.toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              variant="hero"
              className="w-full h-14 rounded-xl text-base"
              disabled={!selectedSize}
              onClick={() => setStep("payment")}
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="text-4xl font-extrabold text-foreground">₦{price.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">for {selectedSize?.toLocaleString()}L of water</p>
            </div>

            <div className="space-y-3">
              <Button
                variant="hero"
                className="w-full h-14 rounded-xl text-base"
                onClick={() => {
                  toast.success("Payment confirmed!");
                  setStep("batch");
                }}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₦{price.toLocaleString()}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Payment is held securely until delivery is confirmed
              </p>
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
                <span className="text-4xl font-extrabold tracking-[0.3em] text-primary">{otp}</span>
                <button onClick={copyOtp} className="text-primary hover:text-primary/70">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Share this with the driver to confirm delivery</p>
            </div>

            {/* Batch Progress */}
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Batch Progress</h3>
                <span className="text-sm font-medium text-primary">7,500L / 10,000L</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: "75%" }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">4 members in this batch</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Waiting for 2,500L more to fill batch</span>
                </div>
              </div>
            </div>

            {/* Your order */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">Your Order</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quantity</span>
                <span className="text-foreground font-medium">{selectedSize?.toLocaleString()}L</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Amount paid</span>
                <span className="text-foreground font-medium">₦{price.toLocaleString()}</span>
              </div>
            </div>

            <Button
              variant="success"
              className="w-full h-14 rounded-xl text-base"
              onClick={() => setStep("tanker")}
            >
              Batch Filled — View Tanker
            </Button>
          </div>
        )}

        {/* Step: Tanker Assigned */}
        {step === "tanker" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Truck className="h-7 w-7 text-success" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Tanker Assigned</h3>
                  <p className="text-sm text-muted-foreground">Toyota Dyna • ABC-123-XY</p>
                </div>
              </div>

              {/* Status steps */}
              <div className="space-y-4">
                {[
                  { label: "Tanker accepted batch", done: true },
                  { label: "Loading water", done: true },
                  { label: "Water loaded — en route", done: true },
                  { label: "Delivering to members", done: false, active: true },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      s.done ? "bg-success" : s.active ? "bg-primary animate-pulse" : "bg-secondary"
                    }`}>
                      {s.done ? (
                        <CheckCircle2 className="h-4 w-4 text-success-foreground" />
                      ) : (
                        <span className={`text-xs font-bold ${s.active ? "text-primary-foreground" : "text-muted-foreground"}`}>{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${s.done ? "text-foreground" : s.active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery order */}
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
                      <div className={`w-2 h-2 rounded-full ${
                        m.status === "Delivered" ? "bg-success" : m.status === "Delivering" ? "bg-warning" : m.status === "Next" ? "bg-primary" : "bg-muted-foreground/30"
                      }`} />
                      <span className={`${m.name === "You" ? "font-bold text-primary" : "text-foreground"}`}>{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{m.liters.toLocaleString()}L</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        m.status === "Delivered" ? "bg-success/10 text-success" :
                        m.status === "Delivering" ? "bg-warning/10 text-warning" :
                        m.status === "Next" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full h-14 rounded-xl text-base"
              onClick={() => setStep("delivery")}
            >
              Tanker Is Here
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
              <h2 className="text-2xl font-bold text-foreground">Tanker Has Arrived!</h2>
              <p className="text-muted-foreground mt-2">Share your OTP with the driver to confirm delivery</p>
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
    </div>
  );
};

export default ClientView;
