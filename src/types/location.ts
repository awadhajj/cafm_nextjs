export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  location_type: string;
  status: string;
  description?: string;
  parent_location_id?: string;
  parent?: Location;
  children?: Location[];
  address?: string;
  latitude?: number;
  longitude?: number;
  qr_code?: string;
  images?: LocationImage[];
  created_at: string;
  updated_at: string;
}

export interface LocationImage {
  id: string;
  location_id: string;
  image_path: string;
  image_url: string;
  title?: string;
  description?: string;
  sort_order: number;
}

export interface LocationTree {
  id: string;
  name: string;
  code: string;
  location_type: string;
  children: LocationTree[];
}
