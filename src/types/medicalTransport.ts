export type FacilityType = 'Hospital' | 'FSER' | 'Behavioral' | 'NursingHome' | 'Event';

export type CrewRole = 'EMT' | 'Paramedic' | 'Dispatcher' | 'Supervisor';

export type CasePriority = 'Emergency' | 'Routine';

export type CaseStatus = 'Pending' | 'En Route' | 'At Destination' | 'Closed';

export type BillingLevel = 'BLS' | 'ALS' | 'MICU';

export type AuthStatus = 'Pending' | 'Submitted' | 'Approved' | 'Denied';

export type UserRole = 'admin' | 'dispatcher' | 'medic' | 'billing' | 'client';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address?: string;
  phone?: string;
  sla_target_mins: number;
  created_at: string;
}

export interface CrewMember {
  id: string;
  full_name?: string;
  role?: CrewRole;
  certs?: Record<string, any>;
  cert_expirations?: Record<string, any>;
  safety_score: number;
  avatar_url?: string;
  created_at: string;
  cert_level?: string;
  cert_expiry?: string;
  status?: string;
  employee_id?: string;
  phone?: string;
  email?: string;
}

export interface PatientCase {
  id: string;
  patient_hash?: string;
  origin_facility: string;
  destination_facility?: string;
  priority: CasePriority;
  status: CaseStatus;
  created_by: string;
  created_at: string;
}

export interface Transport {
  id: string;
  patientcase_id: string;
  ambulance_id?: string;
  crew?: Record<string, any>;
  start_time?: string;
  end_time?: string;
  mileage?: number;
  billing_level?: BillingLevel;
  gps_path?: any;
}

export interface TreatmentAuth {
  id: string;
  patientcase_id: string;
  payer?: string;
  status: AuthStatus;
  reference?: string;
  pcs_form_url?: string;
  updated_at: string;
}

export interface InteractionLog {
  id: number;
  entity?: string;
  entity_id?: string;
  actor?: string;
  verb?: string;
  channel?: string;
  note?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: UserRole;
  facility_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  openEmergencies: number;
  avgResponseTime: number;
  pendingAuthorizations: number;
}
