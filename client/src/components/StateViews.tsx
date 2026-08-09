import { IconAlert, IconBowl, IconEmpty } from './Icons';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <IconBowl />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="state-view empty-state">
      <IconEmpty />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <div className="state-view error-state" role="alert">
      <IconAlert />
      <span>{label}</span>
    </div>
  );
}
