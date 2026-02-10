export interface BreadcrumbItem {
  id: string;
  name: string;
  type: string;
}

export interface Location {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  code: string;
  type: string;
  status: string;
  description?: string;
  parent_location_id?: string;
  parent?: Location;
  children?: Location[];
  address?: string;
  city?: string;
  country?: string;
  google_maps_url?: string;
  number_of_floors?: number;
  number_of_rooms?: number;
  image?: string;
  image_url?: string;
  architectural_plan_url?: string;
  location_identifier?: string;
  tag?: string;
  images?: LocationImage[];
  breadcrumb?: BreadcrumbItem[];
  created_at: string;
  updated_at: string;
}

export interface LocationImage {
  id: string;
  location_id: string;
  filename: string;
  original_name?: string;
  alt_text?: string;
  caption?: string;
  order: number;
  url?: string;
  image_url?: string;
  thumbnail_url?: string;
  created_at?: string;
}

export interface LocationTree {
  id: string;
  name: string;
  type: string;
  status: string;
  children: LocationTree[];
}
