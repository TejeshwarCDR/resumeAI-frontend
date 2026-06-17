import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function usePolling<T>(
  endpoint: string | null,
  interval: number,
  stopWhen: (data: T) => boolean
) {
  const [data, setData] = useState<T | null>(null);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!endpoint) return;
    setDone(false);

    const poll = () => {
      api.get<T>(endpoint).then((r) => {
        setData(r.data);
        if (stopWhen(r.data)) {
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }).catch(() => {});
    };

    poll();
    timerRef.current = setInterval(poll, interval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [endpoint, interval]);

  return { data, done };
}
