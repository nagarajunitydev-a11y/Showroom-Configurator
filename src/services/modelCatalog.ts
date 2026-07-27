import modelCatalogData from '../assets/models.json';
import type { Vehicle } from '../types';

export interface ModelCatalogEntry {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  filePath: string;
}

const normalizeAssetPath = (assetPath: string) => assetPath.replace(/^\.?\//, '');

const resolveAssetUrl = (assetPath: string, kind: 'model' | 'thumbnail') => {
  const normalizedPath = normalizeAssetPath(assetPath);

  if (!normalizedPath) {
    console.warn(`[ModelCatalog] Empty ${kind} asset path received.`);
    return null;
  }

  try {
    return new URL(`../assets/${normalizedPath}`, import.meta.url).href;
  } catch (error) {
    console.error(`[ModelCatalog] Unable to resolve ${kind} asset path`, { assetPath, normalizedPath, error });
    return null;
  }
};

const catalog = (modelCatalogData as ModelCatalogEntry[]).map((entry) => ({
  ...entry,
  thumbnail: entry.thumbnail,
  filePath: entry.filePath,
}));

export const fetchModelCatalog = () => catalog;

export const getModelCatalog = () => catalog;

export const getModelById = (id: string) => catalog.find((model) => model.id === id) ?? null;

export const resolveModelUrl = (modelOrId: ModelCatalogEntry | string | null | undefined) => {
  const model = typeof modelOrId === 'string' ? getModelById(modelOrId) : modelOrId;
  if (!model) {
    console.warn('[ModelCatalog] No catalog entry found for requested model.', modelOrId);
    return null;
  }

  const resolvedUrl = resolveAssetUrl(model.filePath, 'model');
  if (!resolvedUrl) {
    console.error('[ModelCatalog] Model metadata resolved to no asset URL.', { id: model.id, filePath: model.filePath });
  }

  return resolvedUrl;
};

export const resolveModelThumbnailUrl = (modelOrId: ModelCatalogEntry | string | null | undefined) => {
  const model = typeof modelOrId === 'string' ? getModelById(modelOrId) : modelOrId;
  if (!model) {
    return null;
  }

  const resolvedUrl = resolveAssetUrl(model.thumbnail, 'thumbnail');
  if (!resolvedUrl) {
    console.error('[ModelCatalog] Thumbnail metadata resolved to no asset URL.', { id: model.id, thumbnail: model.thumbnail });
  }

  return resolvedUrl;
};

export const getVehicleModelUrl = (vehicle: Pick<Vehicle, 'modelId' | 'url'> | null | undefined) => {
  if (!vehicle) return null;
  if (vehicle.modelId) {
    const metadataUrl = resolveModelUrl(vehicle.modelId);
    if (metadataUrl) return metadataUrl;
  }
  return vehicle.url;
};
