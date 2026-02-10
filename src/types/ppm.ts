import { Reservation } from './reservation';
import { Staff, TimeEntry } from './work-order';

export interface PpmWorkOrder {
  id: string;
  tenant_id: string;
  ppm_wo_number: string;
  ppm_plan_id?: string;
  ppmPlan?: PpmPlan;
  task_instruction_sheet_id?: string;
  taskInstructionSheet?: TaskInstructionSheet;
  description?: string;
  status: string;
  priority: string;
  location_id?: string;
  location?: { id: string; name: string };
  asset_id?: string;
  asset?: { id: string; asset_name: string; location?: { id: string; name: string } };
  service_type_id?: string;
  serviceType?: { id: string; label: string };
  primary_craftsman_id?: string;
  primaryCraftsman?: Staff;
  supervisor_id?: string;
  supervisor?: Staff;
  craftsmen?: Staff[];
  assigned_staff_count?: number;
  quality_rating?: number;
  total_hours_worked?: number;
  target_start_date?: string;
  target_finish_date?: string;
  actual_start_date?: string;
  actual_finish_date?: string;
  attachments?: { name: string; path: string; url: string }[];
  notes?: string;
  completion_notes?: string;
  materials_required?: string;
  reservations?: PpmReservation[];
  warehouseReservations?: Reservation[];
  timeEntries?: TimeEntry[];
  created_at: string;
  updated_at: string;
}

export interface PpmPlan {
  id: string;
  name?: string;
  description?: string;
  estimated_duration?: number;
}

export interface TaskInstructionSheet {
  id: string;
  name?: string;
  sequences?: { id: string; step_number: number; instruction: string }[];
}

export interface PpmReservation {
  id: string;
  items?: { id: string; item?: { id: string; name: string }; quantity: number }[];
  requestedBy?: { id: string; name: string };
  approvedBy?: { id: string; name: string };
}
