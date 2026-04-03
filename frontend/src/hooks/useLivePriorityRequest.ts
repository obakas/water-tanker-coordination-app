import { useCallback, useEffect, useRef, useState } from "react";
import {
    fetchLivePriorityRequest,
    type PriorityLiveResponse,
} from "@/lib/requests";

export function useLivePriorityRequest(
    requestId: number | null,
    intervalMs = 8000
) {
    const [request, setRequest] = useState<PriorityLiveResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<number | null>(null);

    const refresh = useCallback(async () => {
        if (!requestId) {
            setRequest(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const data = await fetchLivePriorityRequest(requestId);
            setRequest(data);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to fetch live priority request";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!requestId) {
            setRequest(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const load = async () => {
            if (!isMounted) return;

            try {
                setIsLoading(true);
                setError(null);

                const data = await fetchLivePriorityRequest(requestId);

                if (!isMounted) return;
                setRequest(data);

                if (
                    data &&
                    (data.delivery_status === "delivered" ||
                        data.request_status === "completed" ||
                        data.customer_confirmed)
                ) {
                    if (intervalRef.current) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } catch (err) {
                if (!isMounted) return;

                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch live priority request";

                setError(message);
            } finally {
                if (!isMounted) return;
                setIsLoading(false);
            }
        };

        load();

        intervalRef.current = window.setInterval(() => {
            load();
        }, intervalMs);

        return () => {
            isMounted = false;

            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [requestId, intervalMs]);

    return {
        request,
        isLoading,
        error,
        refresh,
    };
}