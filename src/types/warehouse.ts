export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  store_number: string;
  status: string;
  description?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  store_id: string;
  slot_number: string;
  name: string;
  description?: string;
  store?: Store;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  tenant_id: string;
  name: string;
  item_number: string;
  barcode?: string;
  description?: string;
  part_number?: string;
  category_id?: string;
  category?: { id: string; label: string };
  default_store_id?: string;
  defaultStore?: Store;
  min_level?: number;
  max_level?: number;
  unit_price?: number;
  image_path?: string;
  image_url?: string;
  stores?: ItemStore[];
  created_at: string;
  updated_at: string;
}

export interface ItemStore {
  id: string;
  item_id: string;
  store_id: string;
  slot_id?: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  store?: Store;
  slot?: Slot;
}
