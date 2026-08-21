import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastItem {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  show: (message: string, variant?: ToastItem['variant']) => void;
}

// Context + provider for lightweight, temporary notification popups (e.g.
// "Sale recorded successfully" or "Failed to save item") shown after an
// action completes, without blocking the UI like a modal would.
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Module-level counter (not React state) so every toast gets a unique id
// across the whole app session, used as its React list key and to remove it later.
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  // The currently visible toast messages; each one removes itself after 4 seconds.
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, variant: ToastItem['variant'] = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Lets any component trigger a toast via `useToast().show(message, variant)`.
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
