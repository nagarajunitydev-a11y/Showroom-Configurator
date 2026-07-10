import { useState } from 'react';
import { Shield, Upload, Plus, Trash2 } from 'lucide-react';
import { FormattedPrice } from '../components/FormattedPrice';
import { useAppStore } from '../store';
import type { Vehicle } from '../types';

export const AdminDashboardPage = () => {
  const { vehicles, removeVehicle, addVehicle, adminLogout } = useAppStore();
  const [formData, setFormData] = useState({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !formData.brand || !formData.model) return alert('Please fill all fields and select a GLB/GLTF file.');
    const vehicleData: Omit<Vehicle, 'id' | 'url' | 'cameras' | 'categories'> = {
      type: 'Car',
      brand: formData.brand,
      model: formData.model,
      basePrice: Number(formData.basePrice),
      year: Number(formData.year),
    };
    addVehicle(vehicleData, file);
    setFile(null);
    setFormData({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
    event.currentTarget.reset();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-zinc-950 p-8 font-sans text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" />
            <h1 className="text-3xl font-light">Admin Control Panel</h1>
          </div>
          <button onClick={adminLogout} className="rounded border border-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/5">
            Secure Logout
          </button>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="col-span-1 h-fit rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-medium"><Upload size={20} /> Upload New Model</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-400">Brand</label>
                <input required type="text" value={formData.brand} onChange={(event) => setFormData({ ...formData, brand: event.target.value })} className="mt-1 w-full rounded border border-white/10 bg-black p-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Porsche" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-400">Model Name</label>
                <input required type="text" value={formData.model} onChange={(event) => setFormData({ ...formData, model: event.target.value })} className="mt-1 w-full rounded border border-white/10 bg-black p-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. 911 GT3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400">Base Price ($)</label>
                  <input required type="number" value={formData.basePrice} onChange={(event) => setFormData({ ...formData, basePrice: Number(event.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-black p-3 text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-zinc-400">Year</label>
                  <input required type="number" value={formData.year} onChange={(event) => setFormData({ ...formData, year: Number(event.target.value) })} className="mt-1 w-full rounded border border-white/10 bg-black p-3 text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-zinc-400">3D Model File (.glb, .gltf)</label>
                <input required type="file" accept=".glb,.gltf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-white/10 bg-black p-2 text-sm text-zinc-400 file:mr-4 file:rounded file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20" />
              </div>

              <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-500">
                <Plus size={18} /> Add Vehicle to Database
              </button>
            </form>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <h2 className="mb-6 text-xl font-medium">Current Inventory Database</h2>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-black/50 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="p-4 font-medium">ID / Type</th>
                    <th className="p-4 font-medium">Vehicle</th>
                    <th className="p-4 font-medium">Base Price</th>
                    <th className="p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                      <td className="p-4">
                        <div className="text-sm font-mono text-zinc-300">{vehicle.id}</div>
                        <div className="mt-1 text-xs text-blue-400">{vehicle.url ? 'Custom Upload' : 'Procedural Mesh'}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">{vehicle.brand} {vehicle.model}</div>
                        <div className="text-xs text-zinc-500">{vehicle.year} Spec</div>
                      </td>
                      <td className="p-4 text-sm text-zinc-300"><FormattedPrice price={vehicle.basePrice} /></td>
                      <td className="p-4 text-right">
                        <button onClick={() => removeVehicle(vehicle.id)} className="rounded p-2 text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300" title="Delete Database Entry">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">No vehicles in inventory.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
