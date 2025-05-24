export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'New' | 'Active' | 'Inactive';
  lastContact: string;
}

export interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  owner: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  related: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  category: 'transport' | 'vehicle' | 'compliance' | 'crew' | 'facility';
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'deal';
  description: string;
  timestamp: string;
  user: string;
  relatedTo?: string;
}

export const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Corp',
    email: 'john.smith@acme.com',
    phone: '(555) 123-4567',
    status: 'Active',
    lastContact: '2023-05-12',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'XYZ Industries',
    email: 'sarah.j@xyz.com',
    phone: '(555) 987-6543',
    status: 'New',
    lastContact: '2023-05-15',
  },
  {
    id: '3',
    name: 'Michael Brown',
    company: 'Tech Solutions',
    email: 'michael.b@techsolutions.com',
    phone: '(555) 456-7890',
    status: 'Active',
    lastContact: '2023-05-10',
  },
  {
    id: '4',
    name: 'Emily Davis',
    company: 'Global Innovations',
    email: 'emily.d@globalinnovations.com',
    phone: '(555) 234-5678',
    status: 'Inactive',
    lastContact: '2023-04-28',
  },
  {
    id: '5',
    name: 'David Wilson',
    company: 'First National Bank',
    email: 'david.w@fnbank.com',
    phone: '(555) 345-6789',
    status: 'Active',
    lastContact: '2023-05-14',
  },
];

export const sampleDeals: Deal[] = [
  {
    id: '1',
    name: 'Enterprise Software Package',
    company: 'Acme Corp',
    value: 75000,
    stage: 'Proposal',
    owner: 'Jane Wilson',
    createdAt: '2023-04-15',
  },
  {
    id: '2',
    name: 'Consulting Services',
    company: 'XYZ Industries',
    value: 25000,
    stage: 'Qualified',
    owner: 'Mark Thompson',
    createdAt: '2023-05-01',
  },
  {
    id: '3',
    name: 'Cloud Migration',
    company: 'Tech Solutions',
    value: 120000,
    stage: 'Negotiation',
    owner: 'Jane Wilson',
    createdAt: '2023-04-10',
  },
  {
    id: '4',
    name: 'Security Audit',
    company: 'Global Innovations',
    value: 15000,
    stage: 'Closed Won',
    owner: 'Mark Thompson',
    createdAt: '2023-03-22',
  },
  {
    id: '5',
    name: 'Digital Transformation',
    company: 'First National Bank',
    value: 250000,
    stage: 'Lead',
    owner: 'Jane Wilson',
    createdAt: '2023-05-10',
  },
];

export const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Complete transport AMB-001 documentation',
    related: 'Transport #AMB-001',
    dueDate: '2024-01-18',
    priority: 'High',
    completed: false,
    category: 'transport',
  },
  {
    id: '2',
    title: 'Vehicle maintenance inspection - Unit 3',
    related: 'Ambulance Unit 3',
    dueDate: '2024-01-20',
    priority: 'Medium',
    completed: false,
    category: 'vehicle',
  },
  {
    id: '3',
    title: 'Submit monthly compliance report',
    related: 'Regulatory Compliance',
    dueDate: '2024-01-25',
    priority: 'High',
    completed: false,
    category: 'compliance',
  },
  {
    id: '4',
    title: 'Update crew certification records',
    related: 'EMT Team Alpha',
    dueDate: '2024-01-22',
    priority: 'Medium',
    completed: false,
    category: 'crew',
  },
  {
    id: '5',
    title: 'Equipment inventory check',
    related: 'Medical Equipment',
    dueDate: '2024-01-19',
    priority: 'Low',
    completed: false,
    category: 'vehicle',
  },
  {
    id: '6',
    title: 'Review facility SLA performance',
    related: 'Memorial Hospital',
    dueDate: '2024-01-24',
    priority: 'Medium',
    completed: false,
    category: 'facility',
  },
  {
    id: '7',
    title: 'Process insurance authorization',
    related: 'Patient Case #PC-2024-001',
    dueDate: '2024-01-17',
    priority: 'High',
    completed: true,
    category: 'transport',
  },
  {
    id: '8',
    title: 'Schedule crew training session',
    related: 'Emergency Response Training',
    dueDate: '2024-01-30',
    priority: 'Low',
    completed: false,
    category: 'crew',
  },
];

export const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'call',
    description: 'Call with John about software requirements',
    timestamp: '2023-05-15T10:30:00',
    user: 'Jane Wilson',
    relatedTo: 'John Smith, Acme Corp',
  },
  {
    id: '2',
    type: 'email',
    description: 'Sent followup email with pricing information',
    timestamp: '2023-05-15T14:45:00',
    user: 'Mark Thompson',
    relatedTo: 'Sarah Johnson, XYZ Industries',
  },
  {
    id: '3',
    type: 'meeting',
    description: 'Demo meeting scheduled for next week',
    timestamp: '2023-05-14T09:15:00',
    user: 'Jane Wilson',
    relatedTo: 'Michael Brown, Tech Solutions',
  },
  {
    id: '4',
    type: 'deal',
    description: 'Security audit deal closed',
    timestamp: '2023-05-13T16:20:00',
    user: 'Mark Thompson',
    relatedTo: 'Global Innovations',
  },
  {
    id: '5',
    type: 'note',
    description: 'Client interested in additional services next quarter',
    timestamp: '2023-05-12T11:00:00',
    user: 'Jane Wilson',
    relatedTo: 'David Wilson, First National Bank',
  },
];

export const getDashboardStats = () => {
  return {
    newContacts: 12,
    activeDeals: sampleDeals.filter(d => !['Closed Won', 'Closed Lost'].includes(d.stage)).length,
    totalPipeline: sampleDeals.reduce((sum, deal) => sum + deal.value, 0),
    closedDeals: sampleDeals.filter(d => d.stage === 'Closed Won').length,
    tasksDue: sampleTasks.filter(t => !t.completed).length,
  };
};
