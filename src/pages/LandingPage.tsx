import { useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';

export const LandingPage = () => {
  const { setView } = useAppStore();

  useEffect(() => {
    setView('client_grid', { replace: true });
  }, [setView]);

  return (
    <div className="flex h-full min-h-dvh w-full items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-8 py-8 text-center shadow-2xl backdrop-blur">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        <p className="text-sm uppercase tracking-[0.35em] text-zinc-400">Showroom redirect</p>
        <h1 className="text-2xl font-semibold">Opening the showroom…</h1>
        <button
          type="button"
          onClick={() => setView('client_grid')}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-400/20"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
