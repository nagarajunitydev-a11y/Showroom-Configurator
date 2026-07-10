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
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black font-sans text-white">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-[800px] w-[800px] rounded-full bg-blue-500/20 blur-[100px]" />
      </div>

      <div className="z-10 max-w-xl p-8 text-center">
        <h1 className="mb-4 text-5xl font-light tracking-tight">Enterprise Configurator</h1>
        <p className="mb-12 text-zinc-400">Data-driven automotive visualization platform. Connect immersive 3D showrooms with your internal CMS seamlessly.</p>

        {!showLogin ? (
          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <button onClick={() => setView('client_grid')} className="flex items-center justify-center gap-2 rounded bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-gray-200">
              <LayoutGrid size={20} /> Client Showroom
            </button>
            <button onClick={() => setShowLogin(true)} className="flex items-center justify-center gap-2 rounded border border-white/10 bg-zinc-900 px-8 py-4 font-medium text-white transition-colors hover:bg-zinc-800">
              <Lock size={20} /> Admin Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-8 text-left animate-in fade-in zoom-in duration-300">
            <h2 className="flex items-center gap-2 text-xl font-medium"><Lock size={18} className="text-blue-400" /> Admin Access</h2>
            <p className="text-xs text-zinc-400">Password is &quot;admin&quot;</p>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter Master Password" autoFocus className="w-full rounded border border-white/10 bg-black p-3 text-sm outline-none focus:border-blue-500" />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 text-sm text-zinc-400 transition-colors hover:text-white">Cancel</button>
              <button type="submit" className="flex-1 rounded bg-blue-600 py-3 text-sm font-medium transition-colors hover:bg-blue-500">Authenticate</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
