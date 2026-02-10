export interface Asset {
  id: string;
  tenant_id: string;
  asset_name: string;
  asset_number: string;
  serial_number?: string;
  barcode?: string;
  asset_type?: string;
  category?: string;
  status: string;
  location_id?: string;
  location?: { id: string; name: string };
  parent_asset_id?: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  purchase_cost?: number;
  warranty_expiry?: string;
  qr_code?: string;
  images?: AssetImage[];
  created_at: string;
  updated_at: string;
}

export interface AssetImage {
  id: string;
  asset_id: string;
  image_path: string;
  image_url: string;
  title?: string;
}
