import { Droplets, Users, Zap, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { TANK_SIZES, TIME_SLOTS, BATCH_PRICE_PER_LITER, PRIORITY_PRICE_PER_LITER } from "../constants/water";
import { RequestMode } from "../types/client";

interface RequestStepProps {
  selectedSize: number | null;
  setSelectedSize: (size: number) => void;
  requestMode: RequestMode;
  setRequestMode: (mode: RequestMode) => void;
  selectedTimeSlot: string | null;
  setSelectedTimeSlot: (slot: string) => void;
  price: number;
  unitPrice: number;
  canContinueToPayment: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

export const RequestStep = ({
  selectedSize,
  setSelectedSize,
  requestMode,
  setRequestMode,
  selectedTimeSlot,
  setSelectedTimeSlot,
  price,
  unitPrice,
  canContinueToPayment,
  onContinue,
  onCancel,
}: RequestStepProps) => {
  return (
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
          onClick={onContinue}
        >
          Continue to Payment
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-base"
          onClick={onCancel}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancel Request
        </Button>
      </div>
    </div>
  );
};