import { useState } from "react";
import { ArrowLeft, Truck, Droplets, MapPin, CheckCircle2, Loader2, Package, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { DeliveryMember, DriverStep, DriverViewProps } from "@/types/driver";
import { MOCK_BATCH, MOCK_DELIVERIES } from "@/constants/mockDriver";

// interface DriverViewProps {
//   onBack: () => void;
// }

// type DriverStep = "available" | "batches" | "loading" | "delivering" | "completed";

// interface DeliveryMember {
//   name: string;
//   address: string;
//   liters: number;
//   otp: string;
//   delivered: boolean;
// }

// const MOCK_BATCH = {
//   id: "B-2847",
//   totalLiters: 10000,
//   members: 5,
//   area: "Lekki Phase 1",
//   earnings: "₦50,000",
// };

// const MOCK_DELIVERIES: DeliveryMember[] = [
//   { name: "Adewale O.", address: "12 Admiralty Way, Lekki Phase 1", liters: 2000, otp: "4829", delivered: false },
//   { name: "Chioma N.", address: "5 Fola Osibo St, Lekki Phase 1", liters: 1500, otp: "7361", delivered: false },
//   { name: "Grace T.", address: "Plot 8, Bisola Durosinmi-Etti Dr", liters: 2000, otp: "1954", delivered: false },
//   { name: "Yusuf M.", address: "3 Agungi Ajiran Rd, Lekki", liters: 2500, otp: "6482", delivered: false },
//   { name: "Fatima B.", address: "Block C, Ikate Elegushi", liters: 2000, otp: "3197", delivered: false },
// ];

const DriverView = ({ onBack }: DriverViewProps) => {
  const [step, setStep] = useState<DriverStep>("available");
  const [isOnline, setIsOnline] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryMember[]>(MOCK_DELIVERIES);
  const [otpInput, setOtpInput] = useState("");
  const [activeDeliveryIdx, setActiveDeliveryIdx] = useState(0);

  const deliveredCount = deliveries.filter((d) => d.delivered).length;
  const allDelivered = deliveredCount === deliveries.length;
  const currentDelivery = deliveries[activeDeliveryIdx];

  const confirmDelivery = () => {
    if (otpInput !== currentDelivery.otp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    const updated = [...deliveries];
    updated[activeDeliveryIdx] = { ...updated[activeDeliveryIdx], delivered: true };
    setDeliveries(updated);
    setOtpInput("");
    toast.success(`Delivery to ${currentDelivery.name} confirmed!`);

    // Move to next undelivered
    const nextIdx = updated.findIndex((d, i) => i > activeDeliveryIdx && !d.delivered);
    if (nextIdx !== -1) {
      setActiveDeliveryIdx(nextIdx);
    } else if (updated.every((d) => d.delivered)) {
      // All done
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={step === "available" ? onBack : () => setStep("available")} className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-foreground text-lg">
              {step === "available" && "Driver Dashboard"}
              {step === "batches" && "Available Batches"}
              {step === "loading" && "Loading Water"}
              {step === "delivering" && "Deliveries"}
              {step === "completed" && "Trip Complete"}
            </h1>
          </div>
          {step === "available" && (
            <button
              onClick={() => {
                setIsOnline(!isOnline);
                toast.success(isOnline ? "You're now offline" : "You're now online!");
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                isOnline ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto p-5">
        {/* Available */}
        {step === "available" && (
          <div className="space-y-6">
            {!isOnline ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">You're Offline</h2>
                <p className="text-muted-foreground mt-2">Go online to see available batches</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Truck className="h-8 w-8 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">You're Online</h2>
                  <p className="text-sm text-muted-foreground">Looking for available batches...</p>
                </div>

                {/* Available batch */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">New Batch</span>
                    <span className="text-xs text-muted-foreground">{MOCK_BATCH.id}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{MOCK_BATCH.area}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{MOCK_BATCH.totalLiters.toLocaleString()}L total</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{MOCK_BATCH.members} deliveries</span>
                    </div>
                  </div>

                  <div className="bg-success/5 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">You'll earn</p>
                    <p className="text-2xl font-extrabold text-success">{MOCK_BATCH.earnings}</p>
                  </div>

                  <Button
                    variant="success"
                    className="w-full h-12 rounded-xl"
                    onClick={() => {
                      toast.success("Batch accepted!");
                      setStep("loading");
                    }}
                  >
                    Accept Batch
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
                <Loader2 className="h-8 w-8 text-warning animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Loading Water</h2>
              <p className="text-sm text-muted-foreground">Update your status when ready</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Batch</span>
                <span className="font-medium text-foreground">{MOCK_BATCH.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total volume</span>
                <span className="font-medium text-foreground">{MOCK_BATCH.totalLiters.toLocaleString()}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deliveries</span>
                <span className="font-medium text-foreground">{MOCK_BATCH.members} stops</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Area</span>
                <span className="font-medium text-foreground">{MOCK_BATCH.area}</span>
              </div>
            </div>

            <Button
              variant="warning"
              className="w-full h-14 rounded-xl text-base"
              onClick={() => {
                toast.success("Water loaded! Delivery addresses are ready.");
                setStep("delivering");
              }}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Water Loaded — Start Deliveries
            </Button>
          </div>
        )}

        {/* Delivering */}
        {step === "delivering" && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Delivery Progress</span>
                <span className="text-sm font-bold text-primary">{deliveredCount}/{deliveries.length}</span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${(deliveredCount / deliveries.length) * 100}%` }}
                />
              </div>
            </div>

            {!allDelivered && currentDelivery && (
              <>
                {/* Current delivery */}
                <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Current Delivery
                    </span>
                    <span className="text-sm font-medium text-foreground">{currentDelivery.liters.toLocaleString()}L</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-foreground text-lg">{currentDelivery.name}</h3>
                    <div className="flex items-start gap-2 mt-1">
                      <Navigation className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{currentDelivery.address}</p>
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Enter Client OTP</label>
                    <div className="flex gap-3">
                      <Input
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="Enter 4-digit OTP"
                        maxLength={4}
                        className="h-12 rounded-lg text-center text-lg tracking-[0.3em] font-bold"
                      />
                      <Button
                        variant="success"
                        className="h-12 px-6 rounded-lg"
                        onClick={confirmDelivery}
                        disabled={otpInput.length !== 4}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* All deliveries list */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">All Deliveries</h3>
              <div className="space-y-3">
                {deliveries.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                      i === activeDeliveryIdx && !d.delivered ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        d.delivered ? "bg-success" : i === activeDeliveryIdx ? "bg-primary" : "bg-secondary"
                      }`}>
                        {d.delivered ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
                        ) : (
                          <span className={`text-xs font-bold ${i === activeDeliveryIdx ? "text-primary-foreground" : "text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-foreground font-medium">{d.name}</span>
                        <span className="text-muted-foreground ml-2">{d.liters.toLocaleString()}L</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${d.delivered ? "text-success" : "text-muted-foreground"}`}>
                      {d.delivered ? "Done" : i === activeDeliveryIdx ? "Active" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {allDelivered && (
              <Button
                variant="success"
                className="w-full h-14 rounded-xl text-base"
                onClick={() => setStep("completed")}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                All Deliveries Complete
              </Button>
            )}
          </div>
        )}

        {/* Completed */}
        {step === "completed" && (
          <div className="space-y-6 text-center py-10">
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Trip Complete!</h2>
              <p className="text-muted-foreground mt-2">All {deliveries.length} deliveries confirmed</p>
            </div>

            <div className="bg-success/5 rounded-xl border border-success/20 p-6">
              <p className="text-sm text-muted-foreground">You earned</p>
              <p className="text-4xl font-extrabold text-success">{MOCK_BATCH.earnings}</p>
              <p className="text-xs text-muted-foreground mt-2">Payment has been sent to your account</p>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 text-left">
              <h3 className="font-semibold text-foreground mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <span className="text-foreground font-medium">{MOCK_BATCH.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total delivered</span>
                  <span className="text-foreground font-medium">{MOCK_BATCH.totalLiters.toLocaleString()}L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliveries</span>
                  <span className="text-foreground font-medium">{deliveries.length} completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span className="text-foreground font-medium">{MOCK_BATCH.area}</span>
                </div>
              </div>
            </div>

            <Button variant="hero" className="w-full h-14 rounded-xl text-base" onClick={() => {
              setStep("available");
              setDeliveries(MOCK_DELIVERIES);
              setActiveDeliveryIdx(0);
            }}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverView;
