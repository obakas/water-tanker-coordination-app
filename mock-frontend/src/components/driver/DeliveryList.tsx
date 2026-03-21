import { CheckCircle2 } from "lucide-react";
import { DeliveryMember } from "@/types/driver";

interface DeliveryListProps {
  deliveries: DeliveryMember[];
  activeDeliveryIdx: number;
}

export const DeliveryList = ({ deliveries, activeDeliveryIdx }: DeliveryListProps) => {
  return (
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
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  d.delivered ? "bg-success" : i === activeDeliveryIdx ? "bg-primary" : "bg-secondary"
                }`}
              >
                {d.delivered ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
                ) : (
                  <span
                    className={`text-xs font-bold ${
                      i === activeDeliveryIdx ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
              <div>
                <span className="text-foreground font-medium">{d.name}</span>
                <span className="text-muted-foreground ml-2">{d.liters.toLocaleString()}L</span>
              </div>
            </div>
            <span
              className={`text-xs font-medium ${
                d.delivered ? "text-success" : "text-muted-foreground"
              }`}
            >
              {d.delivered ? "Done" : i === activeDeliveryIdx ? "Active" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};