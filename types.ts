
export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
  Irrelevant = 'Irrelevant',
}

export interface Recurrence {
  isRecurring: boolean;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  interval: number; // e.g., every 2 weeks
  endDate?: string;
}

export interface AnalysisResult {
  sender: string;
  senderEmail?: string;
  subject?: string;
  institution: string;
  institutionDetails?: string;
  eventName: string;
  theme: string;
  description: string;
  priority: Priority;
  priorityScore: number; // 0-100 scale
  priorityReasoning: string;
  threadSummary?: string;
  date: string;
  time?: string;
  venue: string;
  initialDeadline: string;
  finalDeadline: string;
  linkedActivities: string[];
  suggestedRepresentative?: string;
  registrationLink?: string;
  programmeLink?: string;
  recurrence?: Recurrence;
}

export type RepresentativeRole = 'Speaker' | 'Participant' | 'Activity Host' | 'Other';

export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string; // Professional title/role
  organization: string;
  notes: string;
}

export interface ContactDetails {
  contactId?: string; // Reference to a global contact
  polContact: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  repRole: RepresentativeRole;
  notes: string;
}

export interface CommsPack {
  remarks: string;
  representative: string;
  datePlace: string;
  additionalInfo: string;
  posterData?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignee: string;
  completed: boolean;
}

export interface FollowUpDetails {
  prepResources: string;
  briefing: string;
  actionableInsights?: string[];
  commsPack: CommsPack;
  postEventNotes: string;
  status: 'To Respond' | 'Responded - On hold for updates' | 'Confirmation - To be briefed' | 'Prep ready' | 'Completed - No follow up' | 'Completed - Follow Up' | 'MOs comms' | 'Not Relevant' | 'Follow-up scheduled' | 'Information requested' | 'Action pending' | 'Completed - Actioned';
  statusHistory?: { status: string; date: string; user?: string }[];
  reminderDate?: string;
  tasks?: Task[];
}

export interface EventData {
  id: string;
  createdAt: number;
  originalText: string;
  driveLink?: string;
  tags?: string[];
  analysis: AnalysisResult;
  contact: ContactDetails;
  followUp: FollowUpDetails;
}

// Augment the global JSX namespace to include IntrinsicElements
// This fixes the "Property 'div' does not exist on type 'JSX.IntrinsicElements'" errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
