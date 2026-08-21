import { IconAlert, IconBowl, IconEmpty } from './Icons';

// Three small, reusable UI states shared across every feature page, so
// loading/empty/error handling looks and behaves consistently everywhere
// instead of each page inventing its own markup.

// Shown while a page's initial data fetch is still in flight.
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <IconBowl />
      <span>{label}</span>
    </div>
  );
}

// Shown when a fetch succeeded but returned no records (as opposed to
// still loading, or having failed).
export function EmptyState({ label }: { label: string }) {
  return (
    <div className="state-view empty-state">
      <IconEmpty />
      <span>{label}</span>
    </div>
  );
}

// Shown when a fetch failed; `label` is expected to be a short,
// user-friendly message (never a raw error/stack trace).
export function ErrorState({ label }: { label: string }) {
  return (
    <div className="state-view error-state" role="alert">
      <IconAlert />
      <span>{label}</span>
    </div>
  );
}
