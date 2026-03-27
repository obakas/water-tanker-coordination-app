import { useEffect, useRef, useState } from "react";
import { fetchLiveBatch, type BatchLiveResponse } from "@/lib/batches";

export function useLiveBatch(batchId: number | null, intervalMs = 8000) {
    const [batch, setBatch] = useState<BatchLiveResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!batchId) return;

        const load = async () => {
            try {
                setError(null);
                setIsLoading(true);
                const data = await fetchLiveBatch(batchId);
                setBatch(data);
            } catch (err) {
                console.error(err);
                setError("Could not refresh batch status.");
            } finally {
                setIsLoading(false);
            }
        };

        load();
        intervalRef.current = window.setInterval(load, intervalMs);

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [batchId, intervalMs]);

    return { batch, isLoading, error };
}