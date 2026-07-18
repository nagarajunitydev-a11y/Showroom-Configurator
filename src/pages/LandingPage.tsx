import { useState } from 'react';
import { LayoutGrid, Lock } from 'lucide-react';
import { useAppStore } from '../store';

export const LandingPage = () => {
  const { setView, adminLogin } = useAppStore();
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminLogin(password)) alert("Incorrect Password. Hint: It's 'admin'");
  };

  return (
    <div className="relative flex h-full min-h-dvh w-full max-w-[100vw] flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-black px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-sans text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
        <div className="h-[min(800px,100vw)] w-[min(800px,100vw)] rounded-full bg-blue-500/20 blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-xl text-center">
        <h1 className="mb-4 text-3xl font-light tracking-tight sm:text-4xl md:text-5xl">Enterprise Configurator</h1>
        <p className="mb-8 text-sm text-zinc-400 sm:mb-12 sm:text-base">Data-driven automotive visualization platform. Connect immersive 3D showrooms with your internal CMS seamlessly.</p>

        {!showLogin ? (
          <div className="flex flex-col justify-center gap-3 sm:gap-4 md:flex-row">
            <button
              type="button"
              onClick={() => setView('client_grid')}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded bg-white px-6 py-3 font-medium text-black transition-colors hover:bg-gray-200 sm:px-8 sm:py-4 md:w-auto"
            >
              <LayoutGrid size={20} /> Client Showroom
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded border border-white/10 bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 sm:px-8 sm:py-4 md:w-auto"
            >
              <Lock size={20} /> Admin Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-5 text-left sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-medium"><Lock size={18} className="text-blue-400" /> Admin Access</h2>
            <p className="text-xs text-zinc-400">Password is &quot;admin&quot;</p>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter Master Password" autoFocus className="w-full rounded border border-white/10 bg-black p-3 text-base outline-none focus:border-blue-500 sm:text-sm" />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setShowLogin(false)} className="min-h-[44px] flex-1 text-sm text-zinc-400 transition-colors hover:text-white">Cancel</button>
              <button type="submit" className="min-h-[44px] flex-1 rounded bg-blue-600 text-sm font-medium transition-colors hover:bg-blue-500">Authenticate</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
