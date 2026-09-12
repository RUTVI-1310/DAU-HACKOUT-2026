import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F5EF] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-900 mb-4">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-xl font-extrabold text-foreground">404 — Page Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested route was not found in the operations portal.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]"
        >
          <ArrowLeft size={14} />
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
