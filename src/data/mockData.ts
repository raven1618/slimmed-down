
import { Vehicle, Transport } from '@/types/medicalTransport';

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    vehicle_number: 'AMB-001',
    vehicle_type: 'BLS Ambulance',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    vin: '1FDFE4FS6NDC12345',
    license_plate: 'EMT-001',
    status: 'available',
    mileage: 45000,
    location: 'Station 1',
    fuel_level: 85,
    last_inspection: '2024-01-15',
    next_inspection: '2024-07-15',
    insurance_expiry: '2024-12-31',
    registration_expiry: '2024-11-30',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    vehicle_number: 'AMB-002',
    vehicle_type: 'ALS Ambulance',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    vin: 'WD3PE8CD4NP123456',
    license_plate: 'EMT-002',
    status: 'in_use',
    mileage: 12000,
    location: 'En Route',
    fuel_level: 65,
    last_inspection: '2024-02-01',
    next_inspection: '2024-08-01',
    insurance_expiry: '2024-12-31',
    registration_expiry: '2024-10-15',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T14:20:00Z'
  }
];

export const mockActiveTransports: Transport[] = [
  {
    id: 'transport-1',
    patientcase_id: 'case-1',
    ambulance_id: 'AMB-001',
    crew: {
      driver: 'John Smith',
      medic: 'Jane Doe'
    },
    start_time: '2024-01-20T10:30:00Z',
    mileage: 15,
    billing_level: 'BLS',
    gps_path: null,
    created_at: '2024-01-20T10:30:00Z',
    updated_at: '2024-01-20T10:30:00Z'
  },
  {
    id: 'transport-2',
    patientcase_id: 'case-2',
    ambulance_id: 'AMB-002',
    crew: {
      driver: 'Mike Johnson',
      medic: 'Sarah Wilson'
    },
    start_time: '2024-01-20T11:00:00Z',
    mileage: 8,
    billing_level: 'ALS',
    gps_path: null,
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-01-20T11:00:00Z'
  }
];
