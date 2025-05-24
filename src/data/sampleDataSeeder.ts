
import { supabase } from '@/integrations/supabase/client';

export async function seedSampleData() {
  try {
    console.log('Starting to seed sample data...');

    // 1. Create sample facilities
    const facilitiesData = [
      {
        name: 'General Memorial Hospital',
        type: 'Hospital',
        address: '123 Medical Center Dr, Downtown, CA 90210',
        phone: '(555) 123-4567',
        sla_target_mins: 15
      },
      {
        name: 'Riverside Nursing Home',
        type: 'NursingHome',
        address: '456 Riverside Ave, Eastside, CA 90211',
        phone: '(555) 234-5678',
        sla_target_mins: 30
      },
      {
        name: 'City Emergency Services',
        type: 'FSER',
        address: '789 Emergency Blvd, Central, CA 90212',
        phone: '(555) 345-6789',
        sla_target_mins: 8
      },
      {
        name: 'Peaceful Behavioral Health',
        type: 'Behavioral',
        address: '321 Wellness Way, Westside, CA 90213',
        phone: '(555) 456-7890',
        sla_target_mins: 45
      },
      {
        name: 'Metro Sports Arena',
        type: 'Event',
        address: '654 Stadium Dr, Sports District, CA 90214',
        phone: '(555) 567-8901',
        sla_target_mins: 20
      }
    ];

    const { data: facilities, error: facilitiesError } = await supabase
      .from('facility')
      .insert(facilitiesData)
      .select();

    if (facilitiesError) throw facilitiesError;
    console.log('✅ Facilities created:', facilities?.length);

    // 2. Create sample vehicles
    const vehiclesData = [
      {
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
        registration_expiry: '2024-08-31'
      },
      {
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
        registration_expiry: '2024-09-30'
      },
      {
        vehicle_number: 'AMB-003',
        vehicle_type: 'ambulance',
        make: 'Ford',
        model: 'E-Series',
        year: 2020,
        vin: '1FDEE3FL8LDA98765',
        license_plate: 'EMT-003',
        status: 'maintenance',
        mileage: 45000,
        location: 'Maintenance Bay',
        fuel_level: 30.0,
        last_inspection: '2023-12-20',
        next_inspection: '2024-06-20',
        insurance_expiry: '2024-12-31',
        registration_expiry: '2024-10-15'
      },
      {
        vehicle_number: 'SUP-001',
        vehicle_type: 'supervisor',
        make: 'Toyota',
        model: 'Highlander',
        year: 2023,
        vin: '5TDBZRFH7NS123456',
        license_plate: 'SUP-001',
        status: 'available',
        mileage: 15000,
        location: 'Station Alpha',
        fuel_level: 95.0,
        last_inspection: '2024-02-01',
        next_inspection: '2024-08-01',
        insurance_expiry: '2024-12-31',
        registration_expiry: '2024-11-30'
      },
      {
        vehicle_number: 'SUP-002',
        vehicle_type: 'support',
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        vin: '1FTFW1E84MFC54321',
        license_plate: 'SUP-002',
        status: 'available',
        mileage: 28000,
        location: 'Station Beta',
        fuel_level: 70.0,
        last_inspection: '2024-01-25',
        next_inspection: '2024-07-25',
        insurance_expiry: '2024-12-31',
        registration_expiry: '2024-09-15'
      }
    ];

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .insert(vehiclesData)
      .select();

    if (vehiclesError) throw vehiclesError;
    console.log('✅ Vehicles created:', vehicles?.length);

    // 3. Create sample crew members
    const crewData = [
      {
        full_name: 'Sarah Johnson',
        role: 'Paramedic',
        certs: { CPR: true, ACLS: true, PALS: true },
        cert_expirations: { CPR: '2024-12-31', ACLS: '2024-10-15', PALS: '2024-11-30' },
        safety_score: 98.5
      },
      {
        full_name: 'Michael Rodriguez',
        role: 'EMT',
        certs: { CPR: true, BLS: true },
        cert_expirations: { CPR: '2024-09-30', BLS: '2024-08-15' },
        safety_score: 95.2
      },
      {
        full_name: 'Emily Chen',
        role: 'Paramedic',
        certs: { CPR: true, ACLS: true, PALS: true, PHTLS: true },
        cert_expirations: { CPR: '2024-11-15', ACLS: '2024-09-20', PALS: '2024-10-10', PHTLS: '2024-07-30' },
        safety_score: 99.1
      },
      {
        full_name: 'David Thompson',
        role: 'Dispatcher',
        certs: { EMD: true },
        cert_expirations: { EMD: '2024-12-01' },
        safety_score: 97.8
      },
      {
        full_name: 'Jessica Williams',
        role: 'Supervisor',
        certs: { CPR: true, ACLS: true, Management: true },
        cert_expirations: { CPR: '2024-10-20', ACLS: '2024-08-25', Management: '2025-01-15' },
        safety_score: 96.4
      }
    ];

    const { data: crew, error: crewError } = await supabase
      .from('crewmember')
      .insert(crewData)
      .select();

    if (crewError) throw crewError;
    console.log('✅ Crew members created:', crew?.length);

    // 4. Create sample patient cases
    if (facilities && facilities.length > 0) {
      const patientCasesData = [
        {
          patient_hash: 'PT-2024-001',
          origin_facility: facilities[0].id,
          destination_facility: facilities[1].id,
          priority: 'Emergency',
          status: 'En Route',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          patient_hash: 'PT-2024-002',
          origin_facility: facilities[1].id,
          destination_facility: facilities[0].id,
          priority: 'Routine',
          status: 'Pending',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
        },
        {
          patient_hash: 'PT-2024-003',
          origin_facility: facilities[2].id,
          destination_facility: facilities[0].id,
          priority: 'Emergency',
          status: 'At Destination',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        },
        {
          patient_hash: 'PT-2024-004',
          origin_facility: facilities[3].id,
          destination_facility: facilities[0].id,
          priority: 'Routine',
          status: 'Closed',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
          patient_hash: 'PT-2024-005',
          origin_facility: facilities[4].id,
          destination_facility: facilities[2].id,
          priority: 'Emergency',
          status: 'Pending',
          created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
        },
        {
          patient_hash: 'PT-2024-006',
          origin_facility: facilities[0].id,
          destination_facility: facilities[3].id,
          priority: 'Routine',
          status: 'En Route',
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
        },
        {
          patient_hash: 'PT-2024-007',
          origin_facility: facilities[1].id,
          destination_facility: facilities[2].id,
          priority: 'Emergency',
          status: 'Pending',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
        },
        {
          patient_hash: 'PT-2024-008',
          origin_facility: facilities[2].id,
          destination_facility: facilities[4].id,
          priority: 'Routine',
          status: 'Closed',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
      ];

      const { data: patientCases, error: casesError } = await supabase
        .from('patientcase')
        .insert(patientCasesData)
        .select();

      if (casesError) throw casesError;
      console.log('✅ Patient cases created:', patientCases?.length);

      // 5. Create sample transports for some cases
      if (patientCases && vehicles && crew) {
        const transportsData = [
          {
            patientcase_id: patientCases[0].id,
            ambulance_id: vehicles[1].vehicle_number,
            crew: { primary: crew[0].full_name, secondary: crew[1].full_name },
            start_time: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
            billing_level: 'ALS',
            mileage: 15.3
          },
          {
            patientcase_id: patientCases[2].id,
            ambulance_id: vehicles[0].vehicle_number,
            crew: { primary: crew[2].full_name, secondary: crew[1].full_name },
            start_time: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            billing_level: 'BLS',
            mileage: 8.7
          },
          {
            patientcase_id: patientCases[3].id,
            ambulance_id: vehicles[2].vehicle_number,
            crew: { primary: crew[0].full_name, secondary: crew[2].full_name },
            start_time: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            billing_level: 'MICU',
            mileage: 22.1
          }
        ];

        const { data: transports, error: transportsError } = await supabase
          .from('transport')
          .insert(transportsData)
          .select();

        if (transportsError) throw transportsError;
        console.log('✅ Transports created:', transports?.length);
      }
    }

    // 6. Create sample tasks
    const tasksData = [
      {
        title: 'Vehicle maintenance inspection - AMB-003',
        related: 'AMB-003',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        priority: 'High',
        completed: false
      },
      {
        title: 'Monthly compliance report submission',
        related: 'Regulatory Compliance',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        priority: 'Medium',
        completed: false
      },
      {
        title: 'Update crew certification records',
        related: 'Sarah Johnson',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
        priority: 'Medium',
        completed: false
      },
      {
        title: 'Equipment inventory check',
        related: 'Medical Equipment',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
        priority: 'Low',
        completed: false
      },
      {
        title: 'Process insurance authorization - PT-2024-001',
        related: 'PT-2024-001',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // yesterday
        priority: 'High',
        completed: true
      }
    ];

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksData)
      .select();

    if (tasksError) throw tasksError;
    console.log('✅ Tasks created:', tasks?.length);

    // 7. Create sample activities
    const activitiesData = [
      {
        type: 'transport',
        description: 'Emergency transport dispatched for PT-2024-001',
        user_name: 'David Thompson',
        related_to: 'PT-2024-001',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      },
      {
        type: 'maintenance',
        description: 'AMB-003 scheduled for routine maintenance',
        user_name: 'Jessica Williams',
        related_to: 'AMB-003',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'case',
        description: 'New patient case created: PT-2024-007',
        user_name: 'Sarah Johnson',
        related_to: 'PT-2024-007',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        type: 'crew',
        description: 'Crew certification updated for Emily Chen',
        user_name: 'Jessica Williams',
        related_to: 'Emily Chen',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'facility',
        description: 'SLA performance review completed for General Memorial Hospital',
        user_name: 'David Thompson',
        related_to: 'General Memorial Hospital',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .insert(activitiesData)
      .select();

    if (activitiesError) throw activitiesError;
    console.log('✅ Activities created:', activities?.length);

    // 8. Create sample maintenance records
    if (vehicles) {
      const maintenanceData = [
        {
          vehicle_id: vehicles[2].id, // AMB-003 in maintenance
          maintenance_type: 'Engine Repair',
          description: 'Replace engine oil pump and gaskets',
          service_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'in_progress',
          service_provider: 'Metro Fleet Services',
          mechanic_name: 'John Smith',
          cost: 850.00,
          odometer_reading: 45000,
          next_service_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Critical repair needed before return to service'
        },
        {
          vehicle_id: vehicles[0].id, // AMB-001
          maintenance_type: 'Preventive Maintenance',
          description: 'Routine 6-month service check',
          service_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'completed',
          service_provider: 'City Motor Pool',
          mechanic_name: 'Maria Garcia',
          cost: 320.00,
          odometer_reading: 24500,
          next_service_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'All systems functioning normally'
        }
      ];

      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .insert(maintenanceData)
        .select();

      if (maintenanceError) throw maintenanceError;
      console.log('✅ Maintenance records created:', maintenance?.length);
    }

    console.log('🎉 Sample data seeding completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
}

export async function clearSampleData() {
  try {
    console.log('Clearing existing sample data...');

    // Clear in reverse order of dependencies
    await supabase.from('maintenance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transport').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patientcase').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('crewmember').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('facility').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Sample data cleared successfully!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
    throw error;
  }
}
