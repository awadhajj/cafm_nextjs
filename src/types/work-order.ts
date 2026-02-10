import { Reservation } from './reservation';

export interface WorkOrder {
  id: string;
  tenant_id: string;
  work_order_number: string;
  service_request_id?: string;
  serviceRequest?: ServiceRequest;
  craft_id?: string;
  craft?: { id: string; craft_name: string };
  supervisor_id?: string;
  supervisor?: Staff;
  team_lead_id?: string;
  teamLead?: Staff;
  assignedStaff?: Staff[];
  title?: string;
  description?: string;
  status: string;
  priority?: string;
  estimated_hours?: number;
  actual_hours?: number;
  required_staff_count?: number;
  scheduled_start_date?: string;
  scheduled_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  completion_notes?: string;
  completion_photos?: string[];
  quality_rating?: number;
  supervisor_approval_at?: string;
  completed_at?: string;
  cancellation_requested?: boolean;
  cancellation_reason?: string;
  reservations?: Reservation[];
  timeEntries?: TimeEntry[];
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  service_request_number: string;
  title: string;
  priority?: string;
  status: string;
  service_type_id?: string;
  serviceType?: { id: string; label: string };
  location_id?: string;
  location?: { id: string; name: string };
  asset_id?: string;
  asset?: { id: string; asset_name: string };
  requester_id?: string;
  requester?: { id: string; name: string };
  requested_date?: string;
  failure_description?: string;
  images?: { id: string; image_url: string }[];
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  staff_name: string;
  staff_type?: string;
  email?: string;
  contact_number?: string;
  user?: { id: string; name: string; email: string };
  pivot?: {
    role?: string;
    assigned_at?: string;
    hours_worked?: number;
  };
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  staff_id: string;
  staff?: Staff;
  started_at: string;
  ended_at?: string;
  hours?: number;
  notes?: string;
}
