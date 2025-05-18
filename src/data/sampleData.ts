
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
    title: 'Follow up with John Smith',
    related: 'John Smith, Acme Corp',
    dueDate: '2023-05-18',
    priority: 'High',
    completed: false,
  },
  {
    id: '2',
    title: 'Send proposal to XYZ Industries',
    related: 'Sarah Johnson, XYZ Industries',
    dueDate: '2023-05-20',
    priority: 'Medium',
    completed: false,
  },
  {
    id: '3',
    title: 'Schedule demo with Tech Solutions',
    related: 'Michael Brown, Tech Solutions',
    dueDate: '2023-05-25',
    priority: 'Medium',
    completed: false,
  },
  {
    id: '4',
    title: 'Review contract with legal',
    related: 'First National Bank deal',
    dueDate: '2023-05-22',
    priority: 'High',
    completed: false,
  },
  {
    id: '5',
    title: 'Update CRM records',
    related: 'Internal',
    dueDate: '2023-05-19',
    priority: 'Low',
    completed: false,
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
