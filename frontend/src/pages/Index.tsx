import { useState } from "react";
import { Droplets, Truck, ArrowLeft } from "lucide-react";
import ClientView from "@/components/ClientView";
import DriverView from "@/components/DriverView";

const Index = () => {
  const [role, setRole] = useState<"select" | "client" | "driver">("select");

  if (role === "client") {
    return <ClientView onBack={() => setRole("select")} />;
  }

  if (role === "driver") {
    return <DriverView onBack={() => setRole("select")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
            <Droplets className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">TankUp</h1>
          <p className="text-muted-foreground">Get water delivered to your tank</p>
        </div>

        {/* Role selection */}
        <div className="space-y-4">
          <button
            onClick={() => setRole("client")}
            className="w-full bg-card rounded-2xl border border-border p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Droplets className="h-7 w-7 text-primary" />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-foreground text-lg">I Need Water</h2>
              <p className="text-sm text-muted-foreground">Request water delivery to your tank</p>
            </div>
          </button>

          <button
            onClick={() => setRole("driver")}
            className="w-full bg-card rounded-2xl border border-border p-6 flex items-center gap-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
              <Truck className="h-7 w-7 text-success" />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-foreground text-lg">I'm a Tanker Driver</h2>
              <p className="text-sm text-muted-foreground">Accept batches and deliver water</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
