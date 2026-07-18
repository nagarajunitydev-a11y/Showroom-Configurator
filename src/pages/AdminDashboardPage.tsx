import { useMemo, useState } from 'react';
import { Shield, Upload, Plus, Trash2, Sparkles, Camera, Palette, Boxes, Move3D, Loader2 } from 'lucide-react';
import { FormattedPrice } from '../components/FormattedPrice';
import { useAppStore } from '../store';
import type { AccessoryPlacement, CameraSettings, Vehicle, VehicleOption, VehicleVariant } from '../types';
import { formatPrice } from '../utils/price';

export const AdminDashboardPage = () => {
  const {
    vehicles,
    removeVehicle,
    addVehicle,
    adminLogout,
    addVariant,
    addAccessoryOption,
    addPlacement,
    setActiveVariant,
    updateVehicleCameraSettings,
    setLoading,
    isLoading,
    loadingMessage,
  } = useAppStore();

  const [formData, setFormData] = useState({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'accessories' | 'variants'>('inventory');
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id ?? '');
  const [selectedVariantId, setSelectedVariantId] = useState(vehicles[0]?.variants?.[0]?.id ?? '');
  const [accessoryForm, setAccessoryForm] = useState({ name: '', price: 0, variantIds: '' });
  const [placementForm, setPlacementForm] = useState({ name: '', position: '0,0,0', rotation: '0,0,0' });
  const [cameraForm, setCameraForm] = useState<CameraSettings>({ position: [5, 2, 5], target: [0, 0.5, 0], zoom: 45, rotation: [0, 0, 0] });
  const [variantForm, setVariantForm] = useState({ name: '', description: '', basePrice: 0 });

  const accessoryCatalog = vehicles.find((vehicle) => vehicle.categories.some((category) => category.id === 'accessories'))?.categories.find((category) => category.id === 'accessories')?.options ?? [];
  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null, [vehicles, selectedVehicleId]);
  const selectedVariant = useMemo(() => selectedVehicle?.variants.find((variant) => variant.id === selectedVariantId) ?? null, [selectedVehicle, selectedVariantId]);

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !formData.brand || !formData.model) return alert('Please fill all fields and select a GLB/GLTF file.');

    setLoading(true, 'Uploading model and preparing assets…');
    const vehicleData: Omit<Vehicle, 'id' | 'url' | 'cameras' | 'categories' | 'variants' | 'activeVariantId' | 'cameraSettings'> = {
      type: 'Car',
      brand: formData.brand,
      model: formData.model,
      basePrice: Number(formData.basePrice),
      year: Number(formData.year),
    };

    addVehicle(vehicleData, file);
    setTimeout(() => setLoading(false), 600);
    setFile(null);
    setFormData({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
    event.currentTarget.reset();
  };

  const handleAddVariant = () => {
    if (!selectedVehicle || !variantForm.name) return;

    const newVariant: VehicleVariant = {
      id: `variant-${Date.now()}`,
      name: variantForm.name,
      description: variantForm.description,
      basePrice: variantForm.basePrice,
      categories: selectedVehicle.categories,
      cameras: selectedVehicle.cameras,
      cameraSettings: selectedVehicle.cameraSettings,
      accessoryPlacements: [],
    };

    addVariant(selectedVehicle.id, newVariant);
    setSelectedVariantId(newVariant.id);
    setVariantForm({ name: '', description: '', basePrice: 0 });
  };

  const handleAddAccessory = () => {
    if (!selectedVehicle) return;

    const option: VehicleOption = {
      id: `acc-${Date.now()}`,
      name: accessoryForm.name,
      price: accessoryForm.price,
      variantIds: accessoryForm.variantIds.split(',').map((value) => value.trim()).filter(Boolean),
    };

    addAccessoryOption(selectedVehicle.id, 'accessories', option);
    setAccessoryForm({ name: '', price: 0, variantIds: '' });
  };

  const handleAddPlacement = () => {
    if (!selectedVehicle || !selectedVariant) return;

    const parseTuple = (value: string) => value.split(',').map((part) => Number(part.trim())) as [number, number, number];
    const placement: AccessoryPlacement = {
      id: `place-${Date.now()}`,
      name: placementForm.name,
      position: parseTuple(placementForm.position),
      rotation: parseTuple(placementForm.rotation),
    };

    addPlacement(selectedVehicle.id, selectedVariant.id, placement);
    setPlacementForm({ name: '', position: '0,0,0', rotation: '0,0,0' });
  };

  const handleCameraSave = () => {
    if (!selectedVehicle) return;

    updateVehicleCameraSettings(selectedVehicle.id, cameraForm);
    setLoading(true, 'Applying camera defaults…');
    setTimeout(() => setLoading(false), 500);
  };

  const handleVariantFocus = (vehicleId: string, variantId: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedVariantId(variantId);
    setActiveVariant(vehicleId, variantId);
    setLoading(true, 'Switching variant and loading assets…');
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="h-full min-h-dvh w-full max-w-[100vw] overflow-x-hidden overflow-y-auto touch-scroll bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-sans text-white sm:p-8 md:p-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="shrink-0 text-blue-500" />
            <h1 className="text-2xl font-light sm:text-3xl">Admin Control Panel</h1>
          </div>
          <button onClick={adminLogout} className="min-h-[44px] self-start rounded border border-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/5 sm:self-auto">
            Secure Logout
          </button>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-zinc-900 p-1.5 scrollbar-hide sm:mb-8 sm:flex-wrap">
          <button onClick={() => setActiveTab('inventory')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            Inventory
          </button>
          <button onClick={() => setActiveTab('accessories')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'accessories' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            Accessories
          </button>
          <button onClick={() => setActiveTab('variants')} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'variants' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>
            Variants & Cameras
          </button>
        </div>

        {activeTab === 'inventory' ? (
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

              <div className="space-y-3 md:hidden">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-white">{vehicle.brand} {vehicle.model}</div>
                        <div className="mt-1 text-xs text-zinc-500">{vehicle.year} Spec</div>
                        <div className="mt-2 text-sm font-mono text-zinc-300">{vehicle.id}</div>
                        <div className="mt-1 text-xs text-blue-400">{vehicle.url ? 'Custom Upload' : 'Procedural Mesh'}</div>
                      </div>
                      <button onClick={() => removeVehicle(vehicle.id)} className="shrink-0 rounded p-2 text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300" title="Delete Database Entry">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-3 text-sm text-zinc-300">
                      Base price: <FormattedPrice price={vehicle.basePrice} />
                    </div>
                  </div>
                ))}
                {vehicles.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-zinc-500">No vehicles in inventory.</div>
                )}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 md:block">
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
        ) : activeTab === 'accessories' ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="mb-4 text-xl font-medium">Accessories Catalog</h2>
              <p className="mb-6 text-sm text-zinc-400">Manage the accessory lineup exposed to clients from the configurator.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accessoryCatalog.map((accessory) => (
                  <div key={accessory.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="text-sm font-medium text-white">{accessory.name}</div>
                    <div className="mt-2 text-xs text-zinc-500">{accessory.price > 0 ? `+${formatPrice(accessory.price)}` : 'Included'}</div>
                    {accessory.variantIds && accessory.variantIds.length > 0 && <div className="mt-2 text-[11px] uppercase tracking-widest text-sky-400">Mapped to {accessory.variantIds.length} variant(s)</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium"><Sparkles size={18} /> Add accessory</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <input value={accessoryForm.name} onChange={(event) => setAccessoryForm({ ...accessoryForm, name: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Accessory name" />
                <input type="number" value={accessoryForm.price} onChange={(event) => setAccessoryForm({ ...accessoryForm, price: Number(event.target.value) })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Price" />
                <input value={accessoryForm.variantIds} onChange={(event) => setAccessoryForm({ ...accessoryForm, variantIds: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Variant IDs, comma separated" />
              </div>
              <button onClick={handleAddAccessory} className="mt-4 rounded bg-sky-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-sky-500">Save accessory</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-medium"><Boxes size={18} /> Variant management</h2>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <select value={selectedVehicleId} onChange={(event) => {
                  setSelectedVehicleId(event.target.value);
                  const nextVehicle = vehicles.find((vehicle) => vehicle.id === event.target.value);
                  setSelectedVariantId(nextVehicle?.variants?.[0]?.id ?? '');
                }} className="rounded border border-white/10 bg-black p-3 text-sm">
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.brand} {vehicle.model}</option>)}
                </select>
                <input value={variantForm.name} onChange={(event) => setVariantForm({ ...variantForm, name: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Variant name" />
              </div>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <input value={variantForm.description} onChange={(event) => setVariantForm({ ...variantForm, description: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Variant description" />
                <input type="number" value={variantForm.basePrice} onChange={(event) => setVariantForm({ ...variantForm, basePrice: Number(event.target.value) })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Base price" />
              </div>
              <button onClick={handleAddVariant} className="rounded bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200">Create variant</button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium"><Camera size={18} /> Camera & placement controls</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedVehicle?.variants.map((variant) => (
                  <button key={variant.id} onClick={() => handleVariantFocus(selectedVehicle.id, variant.id)} className={`rounded-full px-3 py-1.5 text-sm ${selectedVariantId === variant.id ? 'bg-sky-600 text-white' : 'bg-black/40 text-zinc-400'}`}>
                    {variant.name}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-400">Position</label>
                  <input value={cameraForm.position.join(',')} onChange={(event) => setCameraForm({ ...cameraForm, position: event.target.value.split(',').map((value) => Number(value.trim())) as [number, number, number] })} className="w-full rounded border border-white/10 bg-black p-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-400">Target</label>
                  <input value={cameraForm.target.join(',')} onChange={(event) => setCameraForm({ ...cameraForm, target: event.target.value.split(',').map((value) => Number(value.trim())) as [number, number, number] })} className="w-full rounded border border-white/10 bg-black p-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-400">Zoom</label>
                  <input type="number" value={cameraForm.zoom} onChange={(event) => setCameraForm({ ...cameraForm, zoom: Number(event.target.value) })} className="w-full rounded border border-white/10 bg-black p-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-400">Rotation</label>
                  <input value={cameraForm.rotation.join(',')} onChange={(event) => setCameraForm({ ...cameraForm, rotation: event.target.value.split(',').map((value) => Number(value.trim())) as [number, number, number] })} className="w-full rounded border border-white/10 bg-black p-3 text-sm" />
                </div>
              </div>
              <button onClick={handleCameraSave} className="mt-4 rounded bg-sky-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-sky-500">Save camera settings</button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium"><Palette size={18} /> Color options</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {selectedVehicle?.categories.find((category) => category.id === 'exterior_paint')?.options.map((option) => (
                  <div key={option.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: option.hex ?? '#fff' }} />
                      <div>
                        <div className="text-sm font-medium text-white">{option.name}</div>
                        <div className="text-xs text-zinc-500">{option.price > 0 ? `+${formatPrice(option.price)}` : 'Included'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-medium"><Move3D size={18} /> Accessory placement</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={placementForm.name} onChange={(event) => setPlacementForm({ ...placementForm, name: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Placement label" />
                <input value={placementForm.position} onChange={(event) => setPlacementForm({ ...placementForm, position: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Position x,y,z" />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input value={placementForm.rotation} onChange={(event) => setPlacementForm({ ...placementForm, rotation: event.target.value })} className="rounded border border-white/10 bg-black p-3 text-sm" placeholder="Rotation x,y,z" />
                <button onClick={handleAddPlacement} className="rounded bg-sky-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-sky-500">Save placement</button>
              </div>
              <div className="mt-4 space-y-2">
                {selectedVariant?.accessoryPlacements.map((placement) => (
                  <div key={placement.id} className="rounded border border-white/10 bg-black/40 p-3 text-sm text-zinc-300">
                    <div className="font-medium text-white">{placement.name}</div>
                    <div className="mt-1 text-xs text-zinc-500">Position: {placement.position.join(', ')} · Rotation: {placement.rotation.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-zinc-900/90 px-6 py-6 text-center shadow-2xl sm:px-8">
            <Loader2 size={26} className="mb-3 animate-spin text-sky-400" />
            <div className="text-lg font-medium text-white">{loadingMessage}</div>
            <div className="mt-2 text-sm text-zinc-400">Please wait while the assets and viewer state are updated.</div>
          </div>
        </div>
      )}
    </div>
  );
};
