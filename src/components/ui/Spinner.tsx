import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block rounded-full border-2 border-muted border-t-amber animate-spin w-4 h-4",
        className,
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Spinner className="w-6 h-6" />
      <span className="font-mono text-2xs text-dim tracking-widest uppercase">
        Loading
      </span>
    </div>
  );
}
