import { ArrowLeft } from "lucide-react";
import { DriverStep } from "@/types/driver";

interface DriverHeaderProps {
  step: DriverStep;
  isOnline: boolean;
  onBack: () => void;
  onToggleOnline: () => void;
}

const stepTitles: Record<DriverStep, string> = {
  available: "Driver Dashboard",
  batches: "Available Batches",
  loading: "Loading Water",
  delivering: "Deliveries",
  completed: "Trip Complete",
};

export const DriverHeader = ({ step, isOnline, onBack, onToggleOnline }: DriverHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button onClick={step === "available" ? onBack : onBack} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold text-foreground text-lg">{stepTitles[step]}</h1>
        </div>
        {step === "available" && (
          <button
            onClick={onToggleOnline}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              isOnline ? "bg-success text-success-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </button>
        )}
      </div>
    </header>
  );
};