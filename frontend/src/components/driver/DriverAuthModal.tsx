import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loginDriver, signupDriver } from "@/lib/driverApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE_URL}${url}`);
    return response.json();
  },
  post: async (url: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.detail || "Request failed");
    }

    return result;
  },
};

interface DriverAuthModalProps {
  onLogin: (driver: {
    id: number;
    name: string;
    phone: string;
    tanker_plate: string;
  }) => void;
}

// interface DriverLoginResponse {
//   id: number;
//   name: string;
//   phone: string;
//   tankerId: number;
// }

const DriverAuthModal = ({ onLogin }: DriverAuthModalProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tankPlateNumber, setTankPlateNumber] = useState("");
  const [, setIsSubmitting] = useState(false);
  const isLogin = mode === "login";
  const [,setTankerPlateNumber] = useState("");

  // const handleSubmit = async () => {
  //   setError("");

  //   if (!phone.trim()) {
  //     setError("Phone number is required");
  //     return;
  //   }

  //   if (mode === "login") {
  //     const data = await api.post("/auth/driver-login", {
  //       phone: phone.trim(),
  //     }) as DriverLoginResponse;

  //     onLogin({
  //       id: data.id,
  //       name: data.name,
  //       phone: data.phone,
  //       tankerId: data.tankerId,
  //     });
  //   } else {
  //     const data = await api.post("/auth/driver-signup", {
  //       name: name.trim(),
  //       phone: phone.trim(),
  //       tank_plate_number: tankPlateNumber.trim(),
  //     }) as DriverLoginResponse;

  //     onLogin({
  //       id: data.id,
  //       name: data.name,
  //       phone: data.phone,
  //       tankerId: data.tankerId,
  //     });
  //   }

  //   try {
  //     setLoading(true);

  //     if (mode === "login") {
  //       const data = await api.post("/auth/driver-login", {
  //         phone: phone.trim(),
  //       }) as DriverLoginResponse;

  //       console.log("Driver login response:", data);

  //       onLogin({
  //         id: data.id,
  //         name: data.name,
  //         phone: data.phone,
  //         tankerId: data.tankerId,
  //       });
  //     } else {
  //       setError(
  //         "Driver signup is not connected yet. Use an existing driver phone number to log in."
  //       );
  //     }
  //   } catch (err: any) {
  //     console.error("Driver login error:", err);
  //     setError(err?.message || "Driver login failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const result = isLogin
        ? await loginDriver(phone)
        : await signupDriver(name, phone, tankPlateNumber);

      onLogin({
        id: result.id,
        name: result.name,
        phone: result.phone,
        tanker_plate: result.tank_plate_number,
      });

      // optional reset
      setName("");
      setPhone("");
      setTankerPlateNumber("");
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Authentication failed.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 rounded-2xl border bg-card shadow-sm">
      <h2 className="text-xl font-semibold mb-2">
        {mode === "login" ? "Driver Login" : "Driver Sign Up"}
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        {mode === "login"
          ? "Login to go online and accept jobs"
          : "Create an account to start delivering"}
      </p>

      <div className="space-y-4">
        {mode === "signup" && (
          <input
            className="w-full border rounded-md px-3 py-2 bg-background"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {mode === "signup" && (
          <input
            className="w-full border rounded-md px-3 py-2 bg-background"
            placeholder="Tank plate number"
            value={tankPlateNumber}
            onChange={(e) => setTankPlateNumber(e.target.value)}
          />
        )}
        <input
          className="w-full border rounded-md px-3 py-2 bg-background"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Login"
              : "Sign Up"}
        </Button>

        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() =>
            setMode((prev) => (prev === "login" ? "signup" : "login"))
          }
        >
          {mode === "login"
            ? "No account? Sign up"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default DriverAuthModal;