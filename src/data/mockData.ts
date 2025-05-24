
import { Vehicle, Transport } from '@/types/medicalTransport';

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    vehicle_number: 'AMB-001',
    vehicle_type: 'ambulance',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    vin: '1FTBW2CM6NKA12345',
    license_plate: 'EMT-001',
    status: 'available',
    mileage: 25000,
    location: 'Station Alpha',
    fuel_level: 85.5,
    last_inspection: '2024-01-15',
    next_inspection: '2024-07-15',
    insurance_expiry: '2024-12-31',
    registration_expiry: '2024-08-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    vehicle_number: 'AMB-002',
    vehicle_type: 'ambulance',
    make: 'Chevrolet',
    model: 'Express',
    year: 2021,
    vin: '1GCWGAFG5M1234567',
    license_plate: 'EMT-002',
    status: 'in_service',
    mileage: 32000,
    location: 'En Route',
    fuel_level: 65.0,
    last_inspection: '2024-01-10',
    next_inspection: '2024-07-10',
    insurance_expiry: '2024-12-31',
    registration_expiry: '2024-09-30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockActiveTransports: Transport[] = [
  {
    id: '1',
    patientcase_id: 'case-001',
    ambulance_id: 'AMB-002',
    crew: { driver: 'John Smith', medic: 'Jane Doe' },
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    billing_level: 'ALS',
    mileage: 15.3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
