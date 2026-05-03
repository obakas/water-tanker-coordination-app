import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, HelpCircle, Truck, MapPin, RefreshCw } from "lucide-react-native";
import type { DriverStep } from "@/types/driver";
import {
  driverLogin,
  driverSignup,
  driverLogout,
  getIncomingOffer,
  acceptOffer,
  rejectOffer,
  getCurrentJob,
  markBatchLoaded,
  markPriorityLoaded,
  completeBatchDelivery,
  completePriorityDelivery,
  getCurrentStop,
  arriveAtStop,
  startMeasurement,
  finishMeasurement,
  confirmOtp,
  completeStop,
  failStop,
  skipStop,
  DriverResponse,
} from "@/lib/api";

const POLL_INTERVAL_MS = 4000;
const ROLE_KEY = "tankup_active_role";
const goRoleHome = async () => { await AsyncStorage.removeItem(ROLE_KEY); router.replace("/"); };

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DriverFlow() {
  const [driver, setDriver] = useState<DriverResponse | null>(null);
  const [online, setOnline] = useState(false);
  const [step, setStep] = useState<DriverStep | "auth">("auth");

  const [offer, setOffer] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [currentStop, setCurrentStop] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Polling ──────────────────────────────────────────────────────────────────

  const pollOffer = useCallback(async () => {
    if (!driver) return;
    try {
      const res = await getIncomingOffer(driver.tankerId);
      if (res.has_offer) {
        setOffer(res.offer);
        setStep("incoming");
        stopPolling();
      }
    } catch { /* ignore */ }
  }, [driver, stopPolling]);

  const pollJob = useCallback(async () => {
    if (!driver) return;
    try {
      const res = await getCurrentStop(driver.tankerId);
      setCurrentStop(res);

      const tankerStatus = res?.tanker?.status ?? res?.tanker_status ?? "";
      if (["available", "completed"].includes(tankerStatus)) {
        setStep("available");
        setJob(null);
        stopPolling();
        // restart offer polling
        pollRef.current = setInterval(pollOffer, POLL_INTERVAL_MS);
      }
    } catch { /* ignore */ }
  }, [driver, pollOffer, stopPolling]);

  useEffect(() => {
    stopPolling();
    if (!driver || !online) return;

    if (step === "available") {
      pollRef.current = setInterval(pollOffer, POLL_INTERVAL_MS);
    } else if (["loading", "delivering"].includes(step)) {
      pollRef.current = setInterval(pollJob, POLL_INTERVAL_MS);
    }
    return stopPolling;
  }, [driver, online, step, pollOffer, pollJob, stopPolling]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleAuthComplete = (d: DriverResponse) => {
    setDriver(d);
    setOnline(d.is_online);
    if (["assigned", "loading", "delivering", "arrived"].includes(d.status)) {
      refreshJob(d);
    } else {
      setStep("available");
    }
  };

  const refreshJob = async (d: DriverResponse) => {
    setLoading(true);
    try {
      const res = await getCurrentStop(d.tankerId);
      setCurrentStop(res);
      setJob(res);
      const ts = res?.tanker?.status ?? res?.tanker_status ?? "";
      if (ts === "assigned") setStep("loading");
      else if (["loading", "delivering", "arrived"].includes(ts)) setStep("delivering");
      else setStep("available");
    } catch (e: any) {
      setStep("available");
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (val: boolean) => {
    if (!driver) return;
    setOnline(val);
    if (!val) {
      stopPolling();
      setStep("offline");
      try { await driverLogout(driver.tankerId); } catch { /* ignore */ }
    } else {
      setStep("available");
    }
  };

  const handleAcceptOffer = async () => {
    if (!driver) return;
    setActionLoading(true);
    setError(null);
    try {
      await acceptOffer(driver.tankerId);
      const jobRes = await getCurrentJob(driver.tankerId);
      setJob(jobRes);
      setCurrentStop(null);
      setStep("loading");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!driver) return;
    setActionLoading(true);
    try {
      await rejectOffer(driver.tankerId);
      setOffer(null);
      setStep("available");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoaded = async () => {
    if (!driver || !job) return;
    setActionLoading(true);
    setError(null);
    try {
      if (job.job_type === "batch" || job.active_job?.batch_id) {
        const batchId = job.active_job?.batch_id ?? job.batch_id;
        await markBatchLoaded(driver.tankerId, batchId);
      } else {
        const requestId = job.active_job?.request_id ?? job.request_id;
        await markPriorityLoaded(driver.tankerId, requestId);
      }
      const res = await getCurrentStop(driver.tankerId);
      setCurrentStop(res);
      setStep("delivering");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!driver || !job) return;
    setActionLoading(true);
    setError(null);
    try {
      if (job.job_type === "batch" || job.active_job?.batch_id) {
        const batchId = job.active_job?.batch_id ?? job.batch_id;
        await completeBatchDelivery(driver.tankerId, batchId);
      } else {
        await completePriorityDelivery(driver.tankerId);
      }
      setJob(null);
      setCurrentStop(null);
      setStep("available");
      setOffer(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#111827" size={20} />
        </Pressable>

        {driver ? (
          <View className="flex-row items-center gap-3">
            <View className={`w-2 h-2 rounded-full ${online ? "bg-success" : "bg-muted"}`} />
            <Text className="text-foreground font-medium">{online ? "Online" : "Offline"}</Text>
            <Switch
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ true: "#1e88ff", false: "#1f2a44" }}
              thumbColor={online ? "#ffffff" : "#7c8aa6"}
            />
          </View>
        ) : (
          <Text className="text-foreground font-bold text-base">Driver Sign In</Text>
        )}

        <Pressable
          onPress={() => Alert.alert("Help", "Driver support: 0800-DRIVER")}
          className="p-2"
        >
          <HelpCircle color="#111827" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}

        {loading && (
          <View className="items-center py-8">
            <ActivityIndicator color="#1e88ff" size="large" />
          </View>
        )}

        {!loading && step === "auth" && (
          <DriverAuthStep onComplete={handleAuthComplete} />
        )}

        {!loading && step === "offline" && (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <Truck color="#7c8aa6" size={48} />
            <Text className="text-foreground font-semibold text-lg mt-4">You're offline</Text>
            <Text className="text-muted-foreground text-center mt-2">
              Toggle online above to start receiving delivery offers.
            </Text>
          </View>
        )}

        {!loading && step === "available" && (
          <AvailableStep onRefresh={() => pollOffer()} />
        )}

        {!loading && step === "incoming" && offer && (
          <IncomingOfferStep
            offer={offer}
            onAccept={handleAcceptOffer}
            onDecline={handleRejectOffer}
            loading={actionLoading}
          />
        )}

        {!loading && step === "loading" && job && (
          <LoadingStep
            job={job}
            onLoaded={handleLoaded}
            loading={actionLoading}
          />
        )}

        {!loading && step === "delivering" && driver && (
          <DeliveringStep
            driver={driver}
            job={job}
            currentStop={currentStop}
            onRefresh={() => pollJob()}
            onCompleteJob={handleCompleteJob}
            actionLoading={actionLoading}
            setError={setError}
          />
        )}

        {!loading && step === "completed" && (
          <View className="gap-4 items-center py-8">
            <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center">
              <Text className="text-success text-3xl">✓</Text>
            </View>
            <Text className="text-foreground text-2xl font-bold">Job Complete!</Text>
            <Text className="text-muted-foreground text-center">All stops delivered successfully.</Text>
            <Pressable
              onPress={() => { setStep("available"); setOffer(null); }}
              className="w-full bg-primary rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold">Back Online</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Driver Auth ────────────────────────────────────────────────────────────────

function DriverAuthStep({ onComplete }: { onComplete: (d: DriverResponse) => void }) {
  const [isNew, setIsNew] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone.trim()) { setError("Phone required"); return; }
    setLoading(true); setError(null);
    try {
      const d = await driverLogin({ phone: phone.trim() });
      onComplete(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!phone.trim() || !name.trim() || !plate.trim()) {
      setError("All fields required"); return;
    }
    setLoading(true); setError(null);
    try {
      const d = await driverSignup({ phone: phone.trim(), name: name.trim(), tank_plate_number: plate.trim() });
      onComplete(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <View className="gap-4">
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      )}
      <DInput label="Phone" value={phone} onChangeText={setPhone} placeholder="+234..." keyboardType="phone-pad" />
      {isNew && (
        <>
          <DInput label="Full Name" value={name} onChangeText={setName} placeholder="Driver Name" />
          <DInput label="Plate Number" value={plate} onChangeText={setPlate} placeholder="ABC-123XY" />
        </>
      )}
      <Pressable
        onPress={isNew ? handleSignup : handleLogin}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center mt-2"
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-white font-semibold">{isNew ? "Register" : "Sign In"}</Text>
        )}
      </Pressable>
      <Pressable onPress={() => { setIsNew(!isNew); setError(null); }} className="items-center py-2">
        <Text className="text-primary text-sm">
          {isNew ? "Already registered? Sign in" : "New driver? Register"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Available ─────────────────────────────────────────────────────────────────

function AvailableStep({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-6 items-center">
        <View className="w-3 h-3 rounded-full bg-success mb-3" />
        <Text className="text-foreground font-semibold text-lg">Waiting for offers...</Text>
        <Text className="text-muted-foreground text-center mt-2">
          You'll receive a job offer when one is assigned to you.
        </Text>
      </View>
      <Pressable
        onPress={onRefresh}
        className="flex-row items-center justify-center gap-2 border border-border rounded-xl py-3"
      >
        <RefreshCw color="#7c8aa6" size={16} />
        <Text className="text-muted-foreground font-medium">Check for Offers</Text>
      </Pressable>
    </View>
  );
}

// ── Incoming Offer ────────────────────────────────────────────────────────────

function IncomingOfferStep({
  offer, onAccept, onDecline, loading,
}: {
  offer: any;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(offer.seconds_left ?? 60);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View className="gap-4">
      <View className="bg-warning/10 border border-warning rounded-2xl p-5">
        <View className="flex-row justify-between items-center">
          <Text className="text-warning font-bold uppercase text-xs">New Offer</Text>
          <Text className="text-warning font-bold">{secondsLeft}s</Text>
        </View>
        <Text className="text-foreground text-xl font-bold mt-2 capitalize">
          {offer.job_type ?? offer.delivery_type} • {(offer.total_volume_liters ?? offer.volume_liters ?? 0).toLocaleString()}L
        </Text>
        {offer.stops?.length > 0 && (
          <Text className="text-muted-foreground mt-1">{offer.stops.length} stops</Text>
        )}
      </View>

      {offer.stops?.map((stop: any, idx: number) => (
        <View key={stop.id ?? idx} className="bg-card border border-border rounded-xl p-4">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-xs font-bold">{idx + 1}</Text>
            </View>
            <Text className="text-foreground font-semibold flex-1">{stop.name ?? `Stop ${idx + 1}`}</Text>
            <Text className="text-muted-foreground">{stop.volume_liters ?? stop.volumeLiters}L</Text>
          </View>
          {stop.address && (
            <View className="flex-row items-center gap-2 mt-1">
              <MapPin color="#7c8aa6" size={12} />
              <Text className="text-muted-foreground text-xs">{stop.address}</Text>
            </View>
          )}
        </View>
      ))}

      <View className="flex-row gap-3">
        <Pressable
          onPress={onDecline}
          disabled={loading}
          className="flex-1 border border-border rounded-xl py-4 items-center"
        >
          <Text className="text-foreground font-medium">Decline</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          disabled={loading}
          className="flex-1 bg-primary rounded-xl py-4 items-center"
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-semibold">Accept</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────────

function LoadingStep({
  job, onLoaded, loading,
}: {
  job: any;
  onLoaded: () => void;
  loading: boolean;
}) {
  const totalVol =
    job?.active_job?.total_volume_liters ??
    job?.total_volume_liters ??
    job?.volume_liters ??
    "—";
  const jobType = job?.active_job?.job_type ?? job?.job_type ?? "batch";

  return (
    <View className="gap-4">
      <View className="bg-card border border-border rounded-2xl p-5">
        <Text className="text-foreground font-semibold capitalize">{jobType} job — Load tanker</Text>
        <Text className="text-muted-foreground mt-2">
          Fill {typeof totalVol === "number" ? totalVol.toLocaleString() : totalVol}L at the depot before heading out.
        </Text>
      </View>
      <Pressable
        onPress={onLoaded}
        disabled={loading}
        className="bg-primary rounded-xl py-4 items-center"
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text className="text-white font-semibold">Loaded — Start Delivery</Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Delivering ─────────────────────────────────────────────────────────────────

function DeliveringStep({
  driver, job, currentStop, onRefresh, onCompleteJob, actionLoading, setError,
}: {
  driver: DriverResponse;
  job: any;
  currentStop: any;
  onRefresh: () => void;
  onCompleteJob: () => void;
  actionLoading: boolean;
  setError: (e: string | null) => void;
}) {
  const stop = currentStop?.current_stop ?? currentStop?.stop;
  const summary = currentStop?.stop_summary ?? [];
  const deliveredCount = summary.filter((s: any) => s.status === "delivered").length;
  const totalCount = summary.length;
  const allDone = totalCount > 0 && deliveredCount === totalCount;
  const stopStatus: string = stop?.delivery_status ?? "";

  const [otpInput, setOtpInput] = useState("");
  const [meterStart, setMeterStart] = useState("");
  const [meterEnd, setMeterEnd] = useState("");
  const [stopLoading, setStopLoading] = useState(false);

  const doAction = async (fn: () => Promise<any>) => {
    setStopLoading(true);
    setError(null);
    try {
      await fn();
      await onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setStopLoading(false);
    }
  };

  return (
    <View className="gap-4">
      {/* Progress bar */}
      {totalCount > 0 && (
        <View className="bg-card border border-border rounded-2xl p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-foreground font-semibold">Progress</Text>
            <Text className="text-primary font-bold">{deliveredCount}/{totalCount}</Text>
          </View>
          <View className="h-2 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-success"
              style={{ width: `${totalCount > 0 ? (deliveredCount / totalCount) * 100 : 0}%` }}
            />
          </View>
        </View>
      )}

      {/* Stop summary */}
      {summary.map((s: any, idx: number) => (
        <View
          key={s.delivery_id ?? idx}
          className={`bg-card border rounded-xl p-3 ${
            s.delivery_id === stop?.id ? "border-primary" : "border-border"
          } ${s.status === "delivered" ? "opacity-50" : ""}`}
        >
          <View className="flex-row items-center gap-2">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                s.status === "delivered" ? "bg-success" : "bg-primary"
              }`}
            >
              <Text className="text-white text-xs font-bold">
                {s.status === "delivered" ? "✓" : idx + 1}
              </Text>
            </View>
            <Text className="text-foreground font-medium flex-1">{s.customer_name ?? `Stop ${idx + 1}`}</Text>
            <Text className="text-muted-foreground text-xs capitalize">{s.status?.replace(/_/g, " ")}</Text>
          </View>
        </View>
      ))}

      {/* Current stop actions */}
      {stop && !allDone && (
        <View className="bg-card border border-primary/40 rounded-2xl p-5 gap-3">
          <Text className="text-foreground font-semibold">
            Current stop: {stop.customer_name ?? "—"}
          </Text>
          {stop.address && (
            <View className="flex-row items-center gap-2">
              <MapPin color="#7c8aa6" size={14} />
              <Text className="text-muted-foreground text-sm">{stop.address}</Text>
            </View>
          )}
          <Text className="text-muted-foreground text-xs capitalize">Status: {stopStatus.replace(/_/g, " ")}</Text>

          {/* Arrive */}
          {(stopStatus === "en_route" || stopStatus === "pending") && (
            <Pressable
              disabled={stopLoading}
              onPress={() => doAction(() => arriveAtStop(stop.id, driver.tankerId))}
              className="bg-primary rounded-xl py-3 items-center"
            >
              {stopLoading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white font-semibold">I've Arrived</Text>
              )}
            </Pressable>
          )}

          {/* Start measurement */}
          {stopStatus === "arrived" && (
            <View className="gap-2">
              <Text className="text-muted-foreground text-sm">Meter start reading</Text>
              <TextInput
                value={meterStart}
                onChangeText={setMeterStart}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#7c8aa6"
                className="bg-background border border-border rounded-xl px-4 py-3"
                style={{ color: "#e6edf7" }}
              />
              <Pressable
                disabled={stopLoading || !meterStart}
                onPress={() =>
                  doAction(() =>
                    startMeasurement(stop.id, driver.tankerId, parseFloat(meterStart))
                  )
                }
                className="bg-primary rounded-xl py-3 items-center"
              >
                {stopLoading ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-semibold">Start Measurement</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Finish measurement */}
          {stopStatus === "measuring" && (
            <View className="gap-2">
              <Text className="text-muted-foreground text-sm">Meter end reading</Text>
              <TextInput
                value={meterEnd}
                onChangeText={setMeterEnd}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#7c8aa6"
                className="bg-background border border-border rounded-xl px-4 py-3"
                style={{ color: "#e6edf7" }}
              />
              <Pressable
                disabled={stopLoading || !meterEnd}
                onPress={() =>
                  doAction(() =>
                    finishMeasurement(stop.id, driver.tankerId, parseFloat(meterEnd))
                  )
                }
                className="bg-primary rounded-xl py-3 items-center"
              >
                {stopLoading ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-semibold">Finish Measurement</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Confirm OTP */}
          {stopStatus === "awaiting_otp" && (
            <View className="gap-2">
              <Text className="text-muted-foreground text-sm">Customer OTP</Text>
              <TextInput
                value={otpInput}
                onChangeText={setOtpInput}
                keyboardType="number-pad"
                placeholder="0000"
                placeholderTextColor="#7c8aa6"
                maxLength={6}
                className="bg-background border border-border rounded-xl px-4 py-3 text-center text-2xl font-bold"
                style={{ color: "#e6edf7", letterSpacing: 8 }}
              />
              <Pressable
                disabled={stopLoading || otpInput.length < 4}
                onPress={() =>
                  doAction(() => confirmOtp(stop.id, driver.tankerId, otpInput))
                }
                className="bg-success rounded-xl py-3 items-center"
              >
                {stopLoading ? <ActivityIndicator color="#fff" /> : (
                  <Text className="text-white font-semibold">Verify OTP</Text>
                )}
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable
                  disabled={stopLoading}
                  onPress={() => {
                    Alert.prompt("Skip reason", "Why are you skipping?", (r) => {
                      if (r?.trim()) doAction(() => skipStop(stop.id, driver.tankerId, r.trim()));
                    });
                  }}
                  className="flex-1 border border-border rounded-xl py-3 items-center"
                >
                  <Text className="text-muted-foreground font-medium">Skip</Text>
                </Pressable>
                <Pressable
                  disabled={stopLoading}
                  onPress={() => {
                    Alert.prompt("Failure reason", "Why did delivery fail?", (r) => {
                      if (r?.trim()) doAction(() => failStop(stop.id, driver.tankerId, r.trim()));
                    });
                  }}
                  className="flex-1 border border-red-200/40 rounded-xl py-3 items-center"
                >
                  <Text className="text-red-600 font-medium">Fail</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Complete stop after OTP verified */}
          {stopStatus === "awaiting_otp" && stop.otp_verified && (
            <Pressable
              disabled={stopLoading}
              onPress={() => doAction(() => completeStop(stop.id, driver.tankerId))}
              className="bg-success rounded-xl py-3 items-center"
            >
              {stopLoading ? <ActivityIndicator color="#fff" /> : (
                <Text className="text-white font-semibold">Complete Delivery</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {/* Refresh */}
      <Pressable
        onPress={onRefresh}
        className="flex-row items-center justify-center gap-2 border border-border rounded-xl py-3"
      >
        <RefreshCw color="#7c8aa6" size={16} />
        <Text className="text-muted-foreground font-medium">Refresh</Text>
      </Pressable>

      {/* Complete job if all done */}
      {allDone && (
        <Pressable
          onPress={onCompleteJob}
          disabled={actionLoading}
          className="bg-success rounded-xl py-4 items-center"
        >
          {actionLoading ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-semibold">Complete Job</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function DInput({
  label, value, onChangeText, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "phone-pad" | "default";
}) {
  return (
    <View>
      <Text className="text-foreground font-medium mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? "default"}
        placeholderTextColor="#7c8aa6"
        className="bg-card border border-border rounded-xl px-4 py-3"
        style={{ color: "#e6edf7" }}
      />
    </View>
  );
}
