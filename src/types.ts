export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Pending' | 'Reviewed' | 'Accepted' | 'Declined' | 'Completed' | 'Pass';

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  priority: Priority;
  status: Status;
  representative: string;
  theme: string;
  description: string;
  targetAudience: string;
  objectives: string;
  cost: string;
  deadline: string;
  format: string;
  language: string;
  contactPerson: string;
  contactEmail: string;
  website: string;
  requiredPreparation: string;
  notes: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
  eventCount: number;
}
