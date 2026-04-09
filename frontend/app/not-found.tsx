import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
      <p className="text-slate-500">
        The page you are looking for does not exist.
      </p>
      <Button className="bg-slate-900 hover:bg-slate-800 text-white" asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
