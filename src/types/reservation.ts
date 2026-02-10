import { Store, Item } from './warehouse';

export interface Reservation {
  id: string;
  tenant_id: string;
  reservation_number: string;
  work_order_id?: string;
  work_order_number?: string;
  ppm_work_order_id?: string;
  ppm_work_order_number?: string;
  store_id: string;
  store?: Store;
  status: string;
  requested_by: string;
  requestedBy?: { id: string; name: string; email: string };
  approved_by?: string;
  approvedBy?: { id: string; name: string };
  issued_by?: string;
  issuedBy?: { id: string; name: string };
  received_by?: string;
  requested_date: string;
  approved_date?: string;
  issuance_date?: string;
  comments?: string;
  rejection_reason?: string;
  items?: ReservationItem[];
  created_at: string;
  updated_at: string;
}

export interface ReservationItem {
  id: string;
  reservation_id: string;
  item_id: string;
  item?: Item;
  requested_quantity: number;
  issued_quantity: number;
  returned_quantity: number;
  remarks?: string;
  return_notes?: string;
}
