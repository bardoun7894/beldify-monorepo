/**
 * verticalService — GET /api/v1/verticals/{slug}/config
 *
 * Typed against contracts.md §A1 (FROZEN).
 * LIVE WIRING (WS-A): replace mockFetchVerticalConfig with api.get(...)
 * at the single marked seam below.
 */
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Contract types (mirrors contracts.md §A1)
// ─────────────────────────────────────────────────────────────────────────────

export type VerticalSlug = 'regular' | 'tailor' | 'menswear' | 'womenswear' | 'jewelry';

export interface VerticalField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'decimal' | 'integer';
  required: boolean;
  options: string[] | null;
  group: string | null;
}

export interface VerticalConfig {
  vertical: VerticalSlug;
  fields: VerticalField[];
}

export interface VerticalConfigResponse {
  data: VerticalConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — exact shapes from contracts.md §A1
// Remove/replace when WS-A delivers the endpoint.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_JEWELRY_CONFIG: VerticalConfig = {
  vertical: 'jewelry',
  fields: [
    { key: 'material', label: 'Material', type: 'select', required: true, options: ['gold', 'silver', 'copper', 'brass', 'mixed'], group: null },
    { key: 'purity', label: 'Purity', type: 'select', required: false, options: ['24k', '21k', '18k', '14k', '925', '800'], group: null },
    { key: 'weight_grams', label: 'Weight (grams)', type: 'decimal', required: false, options: null, group: null },
    { key: 'size', label: 'Size', type: 'text', required: false, options: null, group: null },
    { key: 'gemstone_type', label: 'Gemstone Type', type: 'select', required: false, options: ['none', 'diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'semi-precious', 'other'], group: 'gemstone' },
    { key: 'gemstone_count', label: 'Gemstone Count', type: 'integer', required: false, options: null, group: 'gemstone' },
    { key: 'gemstone_carat', label: 'Gemstone Carat', type: 'decimal', required: false, options: null, group: 'gemstone' },
    { key: 'engraving', label: 'Engraving', type: 'text', required: false, options: null, group: null },
    { key: 'finish', label: 'Finish', type: 'select', required: false, options: ['polished', 'matte', 'gold-plated', 'enamel', 'antique'], group: null },
  ],
};

// Apparel config — aligned to backend App\Support\Verticals::APPAREL_FIELDS
// (9 fields: 6 measurements + fabric_id/fabric_name + style). Keys/types/groups
// match the live GET /api/v1/verticals/{menswear|womenswear|tailor}/config response,
// so flipping USE_MOCK=false is a no-op for the form's field rendering.
const MOCK_APPAREL_CONFIG: VerticalConfig = {
  vertical: 'menswear', // placeholder — same shape for womenswear/tailor
  fields: [
    { key: 'chest', label: 'Chest (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'waist', label: 'Waist (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'hips', label: 'Hips (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'shoulder', label: 'Shoulder (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'length', label: 'Length (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'sleeve', label: 'Sleeve (cm)', type: 'decimal', required: false, options: null, group: 'measurements' },
    { key: 'fabric_id', label: 'Fabric', type: 'select', required: false, options: null, group: 'fabric' },
    { key: 'fabric_name', label: 'Fabric Name', type: 'text', required: false, options: null, group: 'fabric' },
    { key: 'style', label: 'Style', type: 'text', required: false, options: null, group: null },
  ],
};

const MOCK_CONFIGS: Record<VerticalSlug, VerticalConfig> = {
  regular: { vertical: 'regular', fields: [] },
  tailor: { ...MOCK_APPAREL_CONFIG, vertical: 'tailor' },
  menswear: { ...MOCK_APPAREL_CONFIG, vertical: 'menswear' },
  womenswear: { ...MOCK_APPAREL_CONFIG, vertical: 'womenswear' },
  jewelry: MOCK_JEWELRY_CONFIG,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

const USE_MOCK = false; // LIVE WIRING (WS-A): flipped live — endpoint verified 2026-06-03

/**
 * Fetch the field schema for a vertical.
 *
 * LIVE WIRING (WS-A): replace the mock branch body with:
 *   const res = await api.get<VerticalConfigResponse>(`/api/v1/verticals/${slug}/config`);
 *   return res.data.data;
 */
export async function fetchVerticalConfig(slug: VerticalSlug): Promise<VerticalConfig> {
  if (USE_MOCK) {
    // Simulate network latency in dev
    await new Promise(r => setTimeout(r, 0));
    const config = MOCK_CONFIGS[slug];
    if (!config) throw new Error(`Unknown vertical: ${slug}`);
    return config;
  }

  // LIVE PATH (WS-A endpoint required)
  const res = await api.get<VerticalConfigResponse>(`/api/v1/verticals/${slug}/config`);
  return res.data.data;
}

/**
 * PATCH /api/v1/products/{id}/vertical-config
 *
 * Writes the product's vertical spec into stocks.customization_options. The
 * backend ProductVerticalConfigController validates a `customization_options`
 * array and persists it as a flat key-value object (the shape JewelryFields.tsx
 * reads on the buyer PDP).
 *
 * Empty-string / null values are stripped so optional blank fields are not stored.
 */
export async function patchProductVerticalConfig(
  productId: number | string,
  spec: Record<string, string>
): Promise<void> {
  const customization_options: Record<string, string> = {};
  for (const [key, value] of Object.entries(spec)) {
    if (value !== '' && value != null) customization_options[key] = value;
  }
  await api.patch(`/api/v1/products/${productId}/vertical-config`, { customization_options });
}

export const verticalService = { fetchVerticalConfig, patchProductVerticalConfig };
