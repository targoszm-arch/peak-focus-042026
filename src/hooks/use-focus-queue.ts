import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const KEY = "pf.focus.queue.v1";

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Shared focus queue — task ids queued for the Focus timer. Add from any
 * TaskRow; consumed by the Focus screen. Persisted locally. */
function useFocusQueueState() {
  const [queue, setQueue] = useState<string[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(queue));
    } catch {
      /* ignore */
    }
  }, [queue]);

  const has = useCallback((id: string) => queue.includes(id), [queue]);
  const add = useCallback((id: string) => {
    setQueue((q) => (q.includes(id) ? q : [...q, id]));
  }, []);
  const remove = useCallback((id: string) => {
    setQueue((q) => q.filter((x) => x !== id));
  }, []);

  return { queue, setQueue, has, add, remove };
}

type FocusQueueValue = ReturnType<typeof useFocusQueueState>;
const FocusQueueContext = createContext<FocusQueueValue | null>(null);

export function FocusQueueProvider({ children }: { children: ReactNode }) {
  const value = useFocusQueueState();
  return createElement(FocusQueueContext.Provider, { value }, children);
}

export function useFocusQueue(): FocusQueueValue {
  const ctx = useContext(FocusQueueContext);
  if (!ctx) throw new Error("useFocusQueue must be used within FocusQueueProvider");
  return ctx;
}
