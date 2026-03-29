// import { useEffect, useRef, useState } from "react";
// import { fetchLiveBatch, type BatchLiveResponse } from "@/lib/batches";

// export function useLiveBatch(
//   batchId: number | null,
//   memberId: number | null,
//   intervalMs = 8000
// ) {
//   const [batch, setBatch] = useState<BatchLiveResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasResolvedOnce, setHasResolvedOnce] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const intervalRef = useRef<number | null>(null);

//   useEffect(() => {
//     if (intervalRef.current) {
//       window.clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }

//     if (!batchId) {
//       setBatch(null);
//       setError(null);
//       setIsLoading(false);
//       setHasResolvedOnce(false);
//       return;
//     }

//     let isMounted = true;

//     setIsLoading(true);
//     setHasResolvedOnce(false);

//     const load = async () => {
//       try {
//         if (!isMounted) return;

//         setError(null);

//         const data = await fetchLiveBatch(batchId, memberId);

//         if (!isMounted) return;

//         if (!data) {
//           setBatch(null);
//           setError(null);
//           setHasResolvedOnce(true);

//           if (intervalRef.current) {
//             window.clearInterval(intervalRef.current);
//             intervalRef.current = null;
//           }

//           return;
//         }

//         setBatch(data);
//         setHasResolvedOnce(true);
//       } catch (err) {
//         console.error(err);

//         if (!isMounted) return;
//         setError("Could not refresh batch status.");
//         setHasResolvedOnce(true);
//       } finally {
//         if (!isMounted) return;
//         setIsLoading(false);
//       }
//     };

//     load();
//     intervalRef.current = window.setInterval(load, intervalMs);

//     return () => {
//       isMounted = false;

//       if (intervalRef.current) {
//         window.clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }
//     };
//   }, [batchId, memberId, intervalMs]);

//   return { batch, isLoading, hasResolvedOnce, error };
// }

import { useEffect, useRef, useState } from "react";
import { fetchLiveBatch, type BatchLiveResponse } from "@/lib/batches";

export function useLiveBatch(
  batchId: number | null,
  memberId: number | null,
  intervalMs = 8000
) {
  const [batch, setBatch] = useState<BatchLiveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!batchId) {
      setBatch(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        if (!isMounted) return;

        setIsLoading(true);
        setError(null);

        const result = await fetchLiveBatch(batchId, memberId);

        if (!isMounted) return;

        setBatch(result);

        if (!result) {
          setError("Live batch not found.");
        }
      } catch (err) {
        if (!isMounted) return;

        const message =
          err instanceof Error ? err.message : "Failed to fetch live batch";
        setError(message);
        console.error("useLiveBatch error:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    intervalRef.current = window.setInterval(load, intervalMs);

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [batchId, memberId, intervalMs]);

  return {
    batch,
    isLoading,
    error,
    refresh: async () => {
      if (!batchId) return;
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchLiveBatch(batchId, memberId);
        setBatch(result);
        if (!result) {
          setError("Live batch not found.");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch live batch";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
  };
}