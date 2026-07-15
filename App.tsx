
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Layout, Filter, CalendarClock, History, PieChart, Users, Calendar as CalendarIcon, CheckSquare, Trash2, CheckCircle2, ArrowUpDown, Undo2, X, Mail, Download, Sparkles, LogOut } from 'lucide-react';
import { EventData, Priority, Contact } from './types';
import { EventCard } from './components/EventCard';
import { EventDetail } from './components/EventDetail';
import { UploadModal } from './components/UploadModal';
import { CreateEventModal } from './components/CreateEventModal';
import { Overview } from './components/Overview';
import { CalendarView } from './components/CalendarView';
import { ContactsView } from './components/ContactsView';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';

import { CalendarSync } from './components/CalendarSync';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EmailParserView } from './components/EmailParserView';
import { LiveAssistant } from './components/LiveAssistant';
import { useToast } from './contexts/ToastContext';
import { generateBulkBriefing } from './services/gemmaService';
import { initAuth, googleSignIn, logout, getAccessToken } from './src/lib/firebase';

const MOCK_CONTACTS: Contact[] = [
  { id: 'c20', name: 'Alessandro Di Miceli', email: 'alessandro@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: VET and Apprenticeships' },
  { id: 'c21', name: 'Elodie Böhling', email: 'elodie@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Democracy and Student Rights' },
  { id: 'c22', name: 'Ívar Máni Hrannarsson', email: 'ivar@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Social Affairs' },
  { id: 'c23', name: 'Kacper Bogalecki', email: 'kacper@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Organisational Development' },
  { id: 'c24', name: 'Lauren Bond', email: 'lauren@obessu.org', role: 'Board Member', organization: 'OBESSU', notes: 'Portfolio: Education Policy' },
  { id: 'c25', name: 'Rui Teixeira', email: 'rui@obessu.org', role: 'Secretary General', organization: 'OBESSU', notes: 'Overall management and external representation' },
  { id: 'c26', name: 'Raquel Moreno Beneit', email: 'raquel@obessu.org', role: 'Communications Coordinator', organization: 'OBESSU', notes: 'Campaigns and Digital Presence' },
  { id: 'c27', name: 'Panagiotis Chatzimichail', email: 'panagiotis@obessu.org', role: 'Head of External Affairs', organization: 'OBESSU', notes: 'Lead on LLL Labs and Erasmus+ Projects' },
  { id: 'c28', name: 'Amira Bakr', email: 'amira@obessu.org', role: 'Policy and Outreach Assistant', organization: 'OBESSU', notes: 'Policy monitoring' },
  { id: 'c29', name: 'Francesca Osima', email: 'francesca@obessu.org', role: 'Head of Projects and Operations', organization: 'OBESSU', notes: 'Project management' },
  { id: 'c30', name: 'Daniele Sabato', email: 'daniele@obessu.org', role: 'Project & Policy Coordinator', organization: 'OBESSU', notes: 'VET Strategy' }
];

const MOCK_EVENTS: EventData[] = [
{
  "id": "imported-0",
  "createdAt": 1784027311170,
  "originalText": "Webinar \"AI use in vocational training and education: a global view\"",
  "analysis": {
    "sender": "European Digital Education Hub",
    "senderEmail": "EDEH-SUPPORT@ec.europa.eu",
    "institution": "European Digital Education Hub",
    "eventName": "Webinar \"AI use in vocational training and education: a global view\"",
    "theme": "Engagement",
    "description": "Webinar \"AI use in vocational training and education: a global view\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-20",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c30",
    "name": "Daniele",
    "email": "EDEH-SUPPORT@ec.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Our webinar examines how training providers worldwide are adapting to the opportunities and challenges of AI in Vocational Education and Training (VET).",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Daniele",
      "datePlace": "2026-01-20 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-1",
  "createdAt": 1784027311170,
  "originalText": "Webinar \"Foundations for our future: literacy for digital citizenship\"",
  "analysis": {
    "sender": "European Digital Education Hub",
    "senderEmail": "EDEH-SUPPORT@ec.europa.eu",
    "institution": "European Digital Education Hub",
    "eventName": "Webinar \"Foundations for our future: literacy for digital citizenship\"",
    "theme": "Engagement",
    "description": "Webinar \"Foundations for our future: literacy for digital citizenship\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-21",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c31",
    "name": "",
    "email": "EDEH-SUPPORT@ec.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Strong basic and digital literacy skills are key for active citizenship today. They help people engage safely and confidently in the fast-paced information world. Our webinar looks at how these skills support critical participation in digital society.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-01-21 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Not Relevant"
  }
},
{
  "id": "imported-2",
  "createdAt": 1784027311170,
  "originalText": "Conference  “The Future is Erasmus: A Higher Education stakeholder dialogue”",
  "analysis": {
    "sender": "ESN",
    "senderEmail": "president@esn.org",
    "institution": "ESN",
    "eventName": "Conference  “The Future is Erasmus: A Higher Education stakeholder dialogue”",
    "theme": "Engagement",
    "description": "Conference  “The Future is Erasmus: A Higher Education stakeholder dialogue”",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-27",
    "venue": "University Foundation, Brussels",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c32",
    "name": "",
    "email": "president@esn.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Agenda here. The event will bring together students, alumni, higher education institutions, European University Alliances, National Agencies, policymakers, and other key representatives to reflect on current developments, challenges, and priorities shaping the next generation of the programme.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-01-27 @ University Foundation, Brussels",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Not Relevant"
  }
},
{
  "id": "imported-3",
  "createdAt": 1784027311170,
  "originalText": "Civil Society Alliance Meeting",
  "analysis": {
    "sender": "Civil Society Alliance",
    "senderEmail": "alexandra.matthys@solidar.org",
    "institution": "Civil Society Alliance",
    "eventName": "Civil Society Alliance Meeting",
    "theme": "Engagement",
    "description": "Civil Society Alliance Meeting",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-20",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c33",
    "name": "",
    "email": "alexandra.matthys@solidar.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Meeting link here. We will take a moment to reflect on how the Alliance has been functioning so far. In April 2026, the Alliance’s ‘foundational year’ is coming to an end and we’d like to hear your opinion on how the establishment of the Alliance has been going and what you’d like us to focus on in 2026. Please give your input in this short form by Friday 16/01. We’ll use the replies as a basis for our discussion during the meeting.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-01-20 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "To Respond"
  }
},
{
  "id": "imported-4",
  "createdAt": 1784027311170,
  "originalText": "European Employement and Social Rights Forum",
  "analysis": {
    "sender": "European Commission",
    "senderEmail": "info@eusocialforum.eu",
    "institution": "European Commission",
    "eventName": "European Employement and Social Rights Forum",
    "theme": "Engagement",
    "description": "European Employement and Social Rights Forum",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-03",
    "venue": "Brussels",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c34",
    "name": "Pete",
    "email": "info@eusocialforum.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. This Forum will address the EU’s response to the challenges many people face today, including the rising cost of living, job insecurity, and changes in the labour market. Opinion leaders, policymakers, businesses, academics and civil society will come together to explore bold ideas to support Europe’s greatest strength: its people.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-03-03 @ Brussels",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-5",
  "createdAt": 1784027311170,
  "originalText": "ECP Community Talk on the Social Climate Fund",
  "analysis": {
    "sender": "European Climate Pact",
    "senderEmail": "ambassadors@euclimatepact.eu",
    "institution": "European Climate Pact",
    "eventName": "ECP Community Talk on the Social Climate Fund",
    "theme": "Engagement",
    "description": "ECP Community Talk on the Social Climate Fund",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-20",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c35",
    "name": "Amira",
    "email": "ambassadors@euclimatepact.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Amira",
      "datePlace": "2026-01-20 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-6",
  "createdAt": 1784027311170,
  "originalText": "EUFundForSocialCoalition meeting",
  "analysis": {
    "sender": "EASPD",
    "senderEmail": "irene.bertana@easpd.eu",
    "institution": "EASPD",
    "eventName": "EUFundForSocialCoalition meeting",
    "theme": "Engagement",
    "description": "EUFundForSocialCoalition meeting",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-01-21",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c36",
    "name": "",
    "email": "irene.bertana@easpd.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "The aim of the discussion is to assess alignment around these proposals, to identify and address problematic element if any, and to collect additional arguments or relevant points that could help strengthen the text. While the paper remains a draft and we very much welcome your comments, the intention at this stage is not to reopen the substance of the proposals, but rather to refine and consolidate them where needed. Attend here.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-01-21 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "To Respond"
  }
},
{
  "id": "imported-7",
  "createdAt": 1784027311170,
  "originalText": "Online Workshop \"The role of NQFs in the Union of Skills: your perspective matters\"",
  "analysis": {
    "sender": "CEDEFOP",
    "senderEmail": "Eleni-Maria.KATSOURA@cedefop.europa.eu",
    "institution": "CEDEFOP",
    "eventName": "Online Workshop \"The role of NQFs in the Union of Skills: your perspective matters\"",
    "theme": "Engagement",
    "description": "Online Workshop \"The role of NQFs in the Union of Skills: your perspective matters\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-17",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "16 February 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c37",
    "name": "Pete",
    "email": "Eleni-Maria.KATSOURA@cedefop.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Cedefop will give the floor to policymakers, stakeholders, experts, researchers, and the wider public to discuss the role National Qualifications Frameworks (NQFs) can play in the Union of Skills and exchange views on how NQFs can better promote the portability of qualifications and skills.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-02-17 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-8",
  "createdAt": 1784027311170,
  "originalText": "Civil Society Seminar \"Social and employment policies in the European Semester 2026\"",
  "analysis": {
    "sender": "European Centre of Expertise (ECE)",
    "senderEmail": "ece@icf.com",
    "institution": "European Centre of Expertise (ECE)",
    "eventName": "Civil Society Seminar \"Social and employment policies in the European Semester 2026\"",
    "theme": "Engagement",
    "description": "Civil Society Seminar \"Social and employment policies in the European Semester 2026\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-05",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "20th February 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c38",
    "name": "Pete",
    "email": "ece@icf.com",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "The event is organised on behalf of the European Commission’s Directorate-General for Employment, Social Affairs and Inclusion (DG EMPL) by the European Centre of Expertise (ECE) in the field of employment and labour market policies. This year’s seminar will place particular emphasis on human capital, quality jobs and social protection.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-03-05 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-9",
  "createdAt": 1784027311170,
  "originalText": "Strategic Dialogue online meeting on the Skills Portability Initiative and the VET Strategy",
  "analysis": {
    "sender": "DG EMPL",
    "senderEmail": "EMPL-CIVIL-DIALOGUE@ec.europa.eu",
    "institution": "DG EMPL",
    "eventName": "Strategic Dialogue online meeting on the Skills Portability Initiative and the VET Strategy",
    "theme": "Engagement",
    "description": "Strategic Dialogue online meeting on the Skills Portability Initiative and the VET Strategy",
    "priority": Priority.High,
    "priorityScore": 90,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-12",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "10th February 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c39",
    "name": "Amira and Daniele",
    "email": "EMPL-CIVIL-DIALOGUE@ec.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Strategic consultation on the Skills Portability Initiative and the VET Strategy.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Amira and Daniele",
      "datePlace": "2026-02-12 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-10",
  "createdAt": 1784027311170,
  "originalText": "Connect to Protect – Children & Youth at Risk",
  "analysis": {
    "sender": "IASIS NGO",
    "senderEmail": "conference@iasismed.eu",
    "institution": "IASIS NGO",
    "eventName": "Connect to Protect – Children & Youth at Risk",
    "theme": "Engagement",
    "description": "Connect to Protect – Children & Youth at Risk",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-10-05",
    "venue": "Athens (Greece)",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c40",
    "name": "",
    "email": "conference@iasismed.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "The conference is dedicated to advancing research, academic dialogue, and evidence-informed policy on the most pressing risks facing children, adolescents, and young people today. Against a backdrop of increasing social, economic, and digital challenges affecting children and youth, the conference aims to foster interdisciplinary exchange, critical reflection, and comparative analysis, with clear relevance for both policy development and practical application. To express interest, please contact:\r Stefanos Alevizos (Scientific Lead of the Conference) stefanos.alevizos@iasismed.eu",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-10-05 @ Athens (Greece)",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "To Respond"
  }
},
{
  "id": "imported-11",
  "createdAt": 1784027311170,
  "originalText": "EAC Research to Policy (R2P) webinar: What is the impact of smartphones and social media restrictions on education: evidence from schools in Europe",
  "analysis": {
    "sender": "ENESET and DG EAC",
    "senderEmail": "brenda.frydman@ppmi.lt",
    "institution": "ENESET and DG EAC",
    "eventName": "EAC Research to Policy (R2P) webinar: What is the impact of smartphones and social media restrictions on education: evidence from schools in Europe",
    "theme": "Engagement",
    "description": "EAC Research to Policy (R2P) webinar: What is the impact of smartphones and social media restrictions on education: evidence from schools in Europe",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-12",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c41",
    "name": "Pete and Daniele",
    "email": "brenda.frydman@ppmi.lt",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "This webinar will provide an overview of the current evidence, bringing together research findings with policy and implementation perspectives.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete and Daniele",
      "datePlace": "2026-02-12 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-12",
  "createdAt": 1784027311170,
  "originalText": "OBESSU Testimony in the 2026 Youth Report",
  "analysis": {
    "sender": "UNESCO",
    "senderEmail": "a.flottmeier@unesco.org",
    "institution": "UNESCO",
    "eventName": "OBESSU Testimony in the 2026 Youth Report",
    "theme": "Engagement",
    "description": "OBESSU Testimony in the 2026 Youth Report",
    "priority": Priority.High,
    "priorityScore": 90,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "",
    "venue": "",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c42",
    "name": "",
    "email": "a.flottmeier@unesco.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Following the interview we had in December, we’ve prepared a testimony that we would like to potentially feature in the youth report or an accompanying blog.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": " @ ",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-13",
  "createdAt": 1784027311170,
  "originalText": "Training session for for EMPASY project (Emotional Literacy and Participatory Approaches to Support Youth Mental Health in the MENA region)",
  "analysis": {
    "sender": "SOLIDAR",
    "senderEmail": "alexandra.matthys@solidar.org",
    "institution": "SOLIDAR",
    "eventName": "Training session for for EMPASY project (Emotional Literacy and Participatory Approaches to Support Youth Mental Health in the MENA region)",
    "theme": "Engagement",
    "description": "Training session for for EMPASY project (Emotional Literacy and Participatory Approaches to Support Youth Mental Health in the MENA region)",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-10",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c43",
    "name": "Pete",
    "email": "alexandra.matthys@solidar.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Session on how to plan, implement, monitor, evaluate an Advocacy Campaign and we believe OBESSU's expertise would be highly valuable for this topic. 30 minute intervention supported by a PowerPoint presentation, followed by a Q&A session.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-02-10 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-14",
  "createdAt": 1784027311170,
  "originalText": "Erasmus+ Coalition meeting",
  "analysis": {
    "sender": "LLLP",
    "senderEmail": "advocacy@lllplatform.eu",
    "institution": "LLLP",
    "eventName": "Erasmus+ Coalition meeting",
    "theme": "Engagement",
    "description": "Erasmus+ Coalition meeting",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-25",
    "venue": "Hybrid (online and LLLP offices)",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c44",
    "name": "Pete",
    "email": "advocacy@lllplatform.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Meeting link.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-02-25 @ Hybrid (online and LLLP offices)",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-15",
  "createdAt": 1784027311170,
  "originalText": "JTP Working Group meeting",
  "analysis": {
    "sender": "Just Transition Platform",
    "senderEmail": "workinggroups@justtransitionplatform.eu",
    "institution": "Just Transition Platform",
    "eventName": "JTP Working Group meeting",
    "theme": "Engagement",
    "description": "JTP Working Group meeting",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-05-07",
    "venue": "Narva, Estonia",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c45",
    "name": "Pete",
    "email": "workinggroups@justtransitionplatform.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "As many of the Actions are wrapping up and being finalised ahead of the summer, this will be an opportunity to gather final feedback or validation from other WG members and to plan joint dissemination activities.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-05-07 @ Narva, Estonia",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-16",
  "createdAt": 1784027311170,
  "originalText": "Second plenary meeting on NGO Funding Attacks",
  "analysis": {
    "sender": "Civil Society Europe",
    "senderEmail": "cse_members@framagroupes.org",
    "institution": "Civil Society Europe",
    "eventName": "Second plenary meeting on NGO Funding Attacks",
    "theme": "Engagement",
    "description": "Second plenary meeting on NGO Funding Attacks",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-02-13",
    "venue": "Mundo Madou and online",
    "initialDeadline": "",
    "finalDeadline": "11th February 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c46",
    "name": "Pete",
    "email": "cse_members@framagroupes.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Draft agenda here. Register here.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-02-13 @ Mundo Madou and online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-17",
  "createdAt": 1784027311170,
  "originalText": "CHAMELEON Project Final Event",
  "analysis": {
    "sender": "ALL DIGITAL",
    "senderEmail": "LLLP Basecamp",
    "institution": "ALL DIGITAL",
    "eventName": "CHAMELEON Project Final Event",
    "theme": "Engagement",
    "description": "CHAMELEON Project Final Event",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-27",
    "venue": "EVBB VET House, Brussels",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c47",
    "name": "",
    "email": "LLLP Basecamp",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Join us for CHAMELEON’s final event and discover how digital innovation, sustainability, and entrepreneurial thinking are shaping the careers of tomorrow!",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-03-27 @ EVBB VET House, Brussels",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Not Relevant"
  }
},
{
  "id": "imported-18",
  "createdAt": 1784027311170,
  "originalText": "Webinar \"Understanding the legal requirements for launching an ECI\"",
  "analysis": {
    "sender": "European Citizens’ Initiative Forum Team",
    "senderEmail": "",
    "institution": "European Citizens’ Initiative Forum Team",
    "eventName": "Webinar \"Understanding the legal requirements for launching an ECI\"",
    "theme": "Engagement",
    "description": "Webinar \"Understanding the legal requirements for launching an ECI\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-10",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c48",
    "name": "",
    "email": "",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. At a time when citizen participation matters more than ever, the European Citizens’ Initiative (ECI) stands as the only EU citizens’ instrument of participatory democracy at European level. The webinar combines the European Commission’s institutional perspective with practical guidance from the ECI Forum, offering clear and actionable insights for organisers and supporters alike.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-03-10 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-19",
  "createdAt": 1784027311170,
  "originalText": "Second meeting of the Interest Group on Civil Society",
  "analysis": {
    "sender": "Civil Society Europe",
    "senderEmail": "cse_members@framagroupes.org",
    "institution": "Civil Society Europe",
    "eventName": "Second meeting of the Interest Group on Civil Society",
    "theme": "Engagement",
    "description": "Second meeting of the Interest Group on Civil Society",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-18",
    "venue": "European Parliament",
    "initialDeadline": "",
    "finalDeadline": "12th March 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c49",
    "name": "Pete",
    "email": "cse_members@framagroupes.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Further details and a registration form will be shared in the upcoming weeks.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-03-18 @ European Parliament",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-20",
  "createdAt": 1784027311170,
  "originalText": "Invest in What Matters \"How can the next EU long-term budget better support democracy\"",
  "analysis": {
    "sender": "EP Youth Outreach Unit",
    "senderEmail": "youth@together.eu",
    "institution": "EP Youth Outreach Unit",
    "eventName": "Invest in What Matters \"How can the next EU long-term budget better support democracy\"",
    "theme": "Engagement",
    "description": "Invest in What Matters \"How can the next EU long-term budget better support democracy\"",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-24",
    "venue": "European Parliament",
    "initialDeadline": "",
    "finalDeadline": "3rd March 202",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c50",
    "name": "",
    "email": "youth@together.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. The next EU long-term budget will decide how the European Union invests in our shared future, but it is also a tool to protect and strengthen democracy through fundamental principles and values on which the European Union is built. On the eve of crucial negotiation, this event brings together civil society organisations, and decision-makers.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-03-24 @ European Parliament",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "To Respond"
  }
},
{
  "id": "imported-21",
  "createdAt": 1784027311170,
  "originalText": "Webinar \"Beyond “The Youth Will Save Us”: Dispelling Myths about young people’s hopes, dreams, and beliefs\"",
  "analysis": {
    "sender": "Allianz Foundation",
    "senderEmail": "simon.morris-lange@allianzfoundation.org",
    "institution": "Allianz Foundation",
    "eventName": "Webinar \"Beyond “The Youth Will Save Us”: Dispelling Myths about young people’s hopes, dreams, and beliefs\"",
    "theme": "Engagement",
    "description": "Webinar \"Beyond “The Youth Will Save Us”: Dispelling Myths about young people’s hopes, dreams, and beliefs\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "3 March, 17:00-18:00 CET",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c51",
    "name": "",
    "email": "simon.morris-lange@allianzfoundation.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Much is said about young people. From “the youth will save us” to concerns over young people’s detachment from politics or the idea of democracy, many headlines and myths pervade public discourse. But young people are not monolithic, and their views can diverge significantly.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "3 March, 17:00-18:00 CET @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "To Respond"
  }
},
{
  "id": "imported-22",
  "createdAt": 1784027311170,
  "originalText": "Launch webinar of the EURES 2026 campaign – ‘Join the European Job Days’",
  "analysis": {
    "sender": "European Labour Authority",
    "senderEmail": "EURES-communications@ela.europa.eu",
    "institution": "European Labour Authority",
    "eventName": "Launch webinar of the EURES 2026 campaign – ‘Join the European Job Days’",
    "theme": "Engagement",
    "description": "Launch webinar of the EURES 2026 campaign – ‘Join the European Job Days’",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-03-31",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c52",
    "name": "",
    "email": "EURES-communications@ela.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. This two-hour online event will present the milestones and initiatives of the campaign \"Join the European Job Days\" that will run from 31 March 2026 until Christmas 2026.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-03-31 @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Not Relevant"
  }
},
{
  "id": "imported-23",
  "createdAt": 1784027311170,
  "originalText": "Presentation Conference \"Youth: The Future in the Present. Youth Observatory through the VET Perspective\"",
  "analysis": {
    "sender": "ENGIM Foundation",
    "senderEmail": "veronica.vasilescu@engim.it",
    "institution": "ENGIM Foundation",
    "eventName": "Presentation Conference \"Youth: The Future in the Present. Youth Observatory through the VET Perspective\"",
    "theme": "Engagement",
    "description": "Presentation Conference \"Youth: The Future in the Present. Youth Observatory through the VET Perspective\"",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "April 7th 2026, 16:00 CET",
    "venue": "European Parliament",
    "initialDeadline": "",
    "finalDeadline": "27th March 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c53",
    "name": "Daniele",
    "email": "veronica.vasilescu@engim.it",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. The event will be the occasion to present the insights of ENGIM’s National Observatory called \"Youth and Future\", which surveys around 4.500 students across Italy annually to explore how young people relate to work and the weight assigned to it in their future prospects, their expectations, and the vital need to \"listen to youth\" to truly support them.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Daniele",
      "datePlace": "April 7th 2026, 16:00 CET @ European Parliament",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-24",
  "createdAt": 1784027311170,
  "originalText": "GEAR UP! Networking Event Budapest: Global Citizenship, Gender Equality and Local Action",
  "analysis": {
    "sender": "SOLIDAR",
    "senderEmail": "alexandra.matthys@solidar.org",
    "institution": "SOLIDAR",
    "eventName": "GEAR UP! Networking Event Budapest: Global Citizenship, Gender Equality and Local Action",
    "theme": "Engagement",
    "description": "GEAR UP! Networking Event Budapest: Global Citizenship, Gender Equality and Local Action",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-05-19",
    "venue": "Budapest (Hungary)",
    "initialDeadline": "",
    "finalDeadline": "12th April 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c54",
    "name": "Pete",
    "email": "alexandra.matthys@solidar.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. Organised within the framework of the GEAR UP! project, the event will bring together civil society organisations, local authorities, and international partners to explore the future of Global Citizenship Education and gender equality in Europe through discussions, workshops, and networking opportunities.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-05-19 @ Budapest (Hungary)",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-25",
  "createdAt": 1784027311170,
  "originalText": "Civil Society Alliance for Global Citizenship Education online meeting",
  "analysis": {
    "sender": "SOLIDAR",
    "senderEmail": "alexandra.matthys@solidar.org",
    "institution": "SOLIDAR",
    "eventName": "Civil Society Alliance for Global Citizenship Education online meeting",
    "theme": "Engagement",
    "description": "Civil Society Alliance for Global Citizenship Education online meeting",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "23 April, 14:00-15:30 CET",
    "venue": "Online",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c55",
    "name": "Pete",
    "email": "alexandra.matthys@solidar.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Zoom link: https://us06web.zoom.us/j/89618451948?pwd=znWttsgjUaNTvCa3KVXShftfrQbaMw.1",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "23 April, 14:00-15:30 CET @ Online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-26",
  "createdAt": 1784027311170,
  "originalText": "Enabling Learning Environments: The Role of Non-formal and Informal Learning in Building Citizenship and Basic Digital Competences",
  "analysis": {
    "sender": "SOLIDAR",
    "senderEmail": "alexandra.matthys@solidar.org",
    "institution": "SOLIDAR",
    "eventName": "Enabling Learning Environments: The Role of Non-formal and Informal Learning in Building Citizenship and Basic Digital Competences",
    "theme": "Engagement",
    "description": "Enabling Learning Environments: The Role of Non-formal and Informal Learning in Building Citizenship and Basic Digital Competences",
    "priority": Priority.Low,
    "priorityScore": 40,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-04-21",
    "venue": "European Parliament (Room ASP 3H1)and online",
    "initialDeadline": "",
    "finalDeadline": "12th April 2026",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c56",
    "name": "Pete",
    "email": "alexandra.matthys@solidar.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "More information here and registration here.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-04-21 @ European Parliament (Room ASP 3H1)and online",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
},
{
  "id": "imported-27",
  "createdAt": 1784027311170,
  "originalText": "Launching the new lifelong guidance framework",
  "analysis": {
    "sender": "CEDEFOP",
    "senderEmail": "caroline.white@cedefop.europa.eu",
    "institution": "CEDEFOP",
    "eventName": "Launching the new lifelong guidance framework",
    "theme": "Engagement",
    "description": "Launching the new lifelong guidance framework",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-05-12",
    "venue": "Thessaloniki, Greece",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c57",
    "name": "",
    "email": "caroline.white@cedefop.europa.eu",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "Register here. The event marks the launch of Cedefop's new framework for policy and systems development for lifelong guidance, serving as a platform for structured collaboration and inspiration, aligned with the aims of the EU policy, including the Union of Skills and the European Pillar of Social Rights.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "",
      "datePlace": "2026-05-12 @ Thessaloniki, Greece",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Not Relevant"
  }
},
{
  "id": "imported-28",
  "createdAt": 1784027311170,
  "originalText": "Event \"A new VET Strategy for competitiveness and quality jobs\"",
  "analysis": {
    "sender": "CESI",
    "senderEmail": "sibilla@cesi.org",
    "institution": "CESI",
    "eventName": "Event \"A new VET Strategy for competitiveness and quality jobs\"",
    "theme": "Engagement",
    "description": "Event \"A new VET Strategy for competitiveness and quality jobs\"",
    "priority": Priority.Medium,
    "priorityScore": 70,
    "priorityReasoning": "Imported from TSV tracker",
    "date": "2026-04-21",
    "venue": "Brussels, Belgium",
    "initialDeadline": "",
    "finalDeadline": "",
    "linkedActivities": []
  },
  "contact": {
    "contactId": "c58",
    "name": "Pete",
    "email": "sibilla@cesi.org",
    "role": "",
    "organization": "OBESSU",
    "repRole": "Participant",
    "polContact": "",
    "notes": ""
  },
  "followUp": {
    "briefing": "The objective is to explore the main up-takes of VET and analyse how they can support competitiveness and the quality of jobs in view of the upcoming new VET strategy.",
    "prepResources": "",
    "commsPack": {
      "remarks": "",
      "representative": "Pete",
      "datePlace": "2026-04-21 @ Brussels, Belgium",
      "additionalInfo": ""
    },
    "postEventNotes": "",
    "status": "Completed - No follow up"
  }
}
];

type ViewMode = 'calendar' | 'upcoming' | 'past' | 'overview' | 'contacts' | 'emailParser';
type SortField = 'date' | 'priority' | 'institution';
type SortOrder = 'asc' | 'desc';

export default function App() {
  const { showToast, showError } = useToast();
  
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        setHasStarted(true);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        setHasStarted(true);
        showToast('Signed in successfully', 'success');
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/popup-blocked') {
        console.error('Login failed:', err);
      }
      const errMsg = err.message || String(err);
      if (err.code === 'auth/popup-blocked' || errMsg.includes('popup-blocked')) {
        setLoginError('popup-blocked');
        showToast('Google login popup was blocked. Please enable popups or continue as Guest.', 'info');
      } else if (err.code === 'auth/popup-closed-by-user' || errMsg.includes('popup-closed-by-user')) {
        setLoginError('popup-closed');
        showToast('Login popup was closed. Feel free to try again or continue as Guest!', 'info');
      } else {
        setLoginError(errMsg);
        showError(errMsg);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setNeedsAuth(true);
      setHasStarted(false);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const [events, setEvents] = useState<EventData[]>(() => {
    try {
      const saved = localStorage.getItem('obessu_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safely merge any default MOCK_EVENTS that don't already exist in the user's local storage by ID
        const missingEvents = MOCK_EVENTS.filter(mock => !parsed.some((p: any) => p.id === mock.id));
        if (missingEvents.length > 0) {
          return [...parsed, ...missingEvents];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse events from local storage', e);
    }
    return MOCK_EVENTS;
  });
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('obessu_contacts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse contacts from local storage', e);
    }
    return MOCK_CONTACTS;
  });

  useEffect(() => {
    localStorage.setItem('obessu_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('obessu_contacts', JSON.stringify(contacts));
  }, [contacts]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [repRoleFilter, setRepRoleFilter] = useState<string>('All');
  const [showPastEvents, setShowPastEvents] = useState<boolean>(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');


  const handleAnalysisComplete = (newEvent: EventData) => {
    if (!newEvent.followUp.commsPack) {
      newEvent.followUp.commsPack = {
        remarks: '',
        representative: newEvent.contact.name || '',
        datePlace: `${newEvent.analysis.date} @ ${newEvent.analysis.venue}`,
        additionalInfo: '',
      };
    }
    setEvents(prev => [newEvent, ...prev]);
    if (viewMode === 'overview' || viewMode === 'past') setViewMode('upcoming');
    setSelectedEventId(newEvent.id);
  };

  const handleUpdateEvent = (updatedEvent: EventData) => {
    const oldEvent = events.find(e => e.id === updatedEvent.id);
    if (oldEvent && oldEvent.followUp.status !== updatedEvent.followUp.status) {
      showToast(`Event status changed to ${updatedEvent.followUp.status}`, 'info', {
        label: 'Undo',
        onClick: () => handleUndoStatusChange([oldEvent])
      });
    }
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleDeleteEvent = (id: string) => {
    const eventToDelete = events.find(e => e.id === id);
    if (eventToDelete) {
        setEvents(prev => prev.filter(e => e.id !== id));
        if (selectedEventId === id) setSelectedEventId(null);
        setSelectedEventIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        showToast('Event deleted', 'info', {
          label: 'Undo',
          onClick: () => handleUndoDelete([eventToDelete])
        });
    }
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => {
      const exists = prev.find(c => c.id === updatedContact.id);
      if (exists) {
        return prev.map(c => c.id === updatedContact.id ? updatedContact : c);
      }
      return [...prev, updatedContact];
    });

    // Propagate changes to events
    setEvents(prev => prev.map(e => {
      if (e.contact.contactId === updatedContact.id) {
        return {
          ...e,
          contact: {
            ...e.contact,
            name: updatedContact.name,
            email: updatedContact.email,
            role: updatedContact.role,
            organization: updatedContact.organization
          }
        };
      }
      return e;
    }));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setEvents(prev => prev.map(e => {
      if (e.contact.contactId === id) {
        return { ...e, contact: { ...e.contact, contactId: undefined } };
      }
      return e;
    }));
    if (selectedContactId === id) setSelectedContactId(null);
  };

  const handleViewContactProfile = (contactId: string) => {
    setSelectedContactId(contactId);
    setViewMode('contacts');
  };

  const handleRenameStakeholder = (oldName: string, newName: string) => {
    setEvents(prev => prev.map(e => {
      if (e.analysis.institution === oldName) {
        return {
          ...e,
          analysis: {
            ...e.analysis,
            institution: newName
          }
        };
      }
      return e;
    }));
  };

  const isCompletedOrArchived = (status: string) => {
      return status.startsWith('Completed');
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      const matchesSearch = 
        e.analysis.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.analysis.institution.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'All' && e.followUp.status !== statusFilter) return false;

      // Rep Role filter
      if (repRoleFilter !== 'All' && e.contact.repRole !== repRoleFilter) return false;

      const eventDate = new Date(e.analysis.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = eventDate < today;

      if (viewMode === 'upcoming') {
        if (isPastDate) return false;
        if (!showPastEvents && isCompletedOrArchived(e.followUp.status)) return false;
        // 'Not Relevant' should show in Upcoming
      } else if (viewMode === 'past') {
        return isPastDate || isCompletedOrArchived(e.followUp.status) || e.followUp.status === 'Not Relevant';
      }
      return true;
    });

    // Apply Sort
    result.sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
            comparison = new Date(a.analysis.date).getTime() - new Date(b.analysis.date).getTime();
        } else if (sortField === 'priority') {
            comparison = a.analysis.priorityScore - b.analysis.priorityScore;
        } else if (sortField === 'institution') {
            comparison = a.analysis.institution.localeCompare(b.analysis.institution);
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [events, searchTerm, statusFilter, viewMode, sortField, sortOrder]);

  // Bulk Actions
  const handleToggleSelect = (id: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    const eventsToDelete = events.filter(e => selectedEventIds.has(e.id));
    
    setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
    if (selectedEventId && selectedEventIds.has(selectedEventId)) setSelectedEventId(null);
    setSelectedEventIds(new Set());
    showToast(`${eventsToDelete.length} events deleted`, 'info', {
      label: 'Undo',
      onClick: () => handleUndoDelete(eventsToDelete)
    });
  };

  const handleBulkMarkCompleted = () => {
    const eventsToUpdate = events.filter(e => selectedEventIds.has(e.id));

    setEvents(prev => prev.map(e => {
      if (selectedEventIds.has(e.id)) {
        return {
          ...e,
          followUp: { ...e.followUp, status: 'Completed - No follow up' }
        };
      }
      return e;
    }));
    setSelectedEventIds(new Set());
    showToast(`${eventsToUpdate.length} events marked as completed`, 'info', {
      label: 'Undo',
      onClick: () => handleUndoStatusChange(eventsToUpdate)
    });
  };

  const handleBulkUpdateStatus = (newStatus: string) => {
    if (!newStatus) return;
    const eventsToUpdate = events.filter(e => selectedEventIds.has(e.id));

    setEvents(prev => prev.map(e => {
      if (selectedEventIds.has(e.id)) {
        return {
          ...e,
          followUp: { ...e.followUp, status: newStatus as any }
        };
      }
      return e;
    }));
    setSelectedEventIds(new Set());
    showToast(`${eventsToUpdate.length} events updated to ${newStatus}`, 'info', {
      label: 'Undo',
      onClick: () => handleUndoStatusChange(eventsToUpdate)
    });
  };

  const handleBulkExportSelected = () => {
    const selectedEvents = events.filter(e => selectedEventIds.has(e.id));
    if (selectedEvents.length === 0) return;

    const format = window.confirm("Export as CSV? (Cancel for JSON)") ? 'csv' : 'json';
    
    if (format === 'json') {
      const dataStr = JSON.stringify(selectedEvents, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const fileName = `selected_events_${new Date().toISOString().slice(0,10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
    } else {
      const flattenObject = (obj: any, prefix = ''): Record<string, string> => {
        return Object.keys(obj).reduce((acc: any, k: string) => {
          const pre = prefix.length ? prefix + '.' : '';
          if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
          } else if (Array.isArray(obj[k])) {
            acc[pre + k] = obj[k].join('; ');
          } else {
            acc[pre + k] = String(obj[k]);
          }
          return acc;
        }, {});
      };

      const flatEvents = selectedEvents.map(e => flattenObject(e));
      const headers = Array.from(new Set(flatEvents.flatMap(Object.keys)));
      const csvContent = [
        headers.join(','),
        ...flatEvents.map(e => headers.map(h => `"${String(e[h] || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const fileName = `selected_events_${new Date().toISOString().slice(0,10)}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", url);
      linkElement.setAttribute("download", fileName);
      linkElement.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleBulkBriefing = async () => {
    const selectedEvents = events.filter(e => selectedEventIds.has(e.id));
    if (selectedEvents.length === 0) return;

    try {
      const briefing = await generateBulkBriefing(selectedEvents);
      alert(briefing.briefing);
    } catch (e: any) {
      showError(e.message || "Failed to generate bulk briefing.");
    }
  };

  const handleUndoDelete = (eventsToRestore: EventData[]) => {
    setEvents(prev => [...prev, ...eventsToRestore]);
  };

  const handleUndoStatusChange = (oldEvents: EventData[]) => {
    setEvents(prev => prev.map(e => {
        const oldEvent = oldEvents.find(old => old.id === e.id);
        if (oldEvent) return oldEvent;
        return e;
    }));
  };

  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact = { ...contact, id: Date.now().toString() };
    setContacts(prev => [...prev, newContact]);
    showToast('Contact created successfully', 'success');
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const uniqueStatuses = useMemo(() => {
    const filteredByMode = events.filter(e => {
      const eventDate = new Date(e.analysis.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPastDate = eventDate < today;

      if (viewMode === 'upcoming') {
        if (isPastDate) return false;
        return !isCompletedOrArchived(e.followUp.status);
      }
      if (viewMode === 'past') {
        return isPastDate || isCompletedOrArchived(e.followUp.status) || e.followUp.status === 'Not Relevant';
      }
      return true;
    });
    return Array.from(new Set(filteredByMode.map(e => e.followUp.status)));
  }, [events, viewMode]);

  const handleExportData = () => {
    const dataStr = JSON.stringify({ events, contacts }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'eventflow_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast('Data exported successfully', 'success');
  };

  

  if (!hasStarted) {
    return (
      <WelcomeScreen 
        onLogin={handleLogin} 
        isLoggingIn={isLoggingIn} 
        authError={loginError}
        onContinueAsGuest={() => setHasStarted(true)}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
            <div className="bg-brand-policy p-2 rounded-lg shadow-sm">
                <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">EventFlow AI</h1>
            </div>
            
            <div className="flex items-center gap-4">
            <CalendarSync onEventsSynced={(newEvents) => {
              setEvents(prev => {
                const existingIds = new Set(prev.map(e => e.id));
                const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
                return [...prev, ...uniqueNewEvents];
              });
            }} />
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              title="Export Data"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
              title="Sign Out"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button
              onClick={() => setIsClearDataModalOpen(true)}
              className="flex items-center gap-2 bg-white text-brand-membership border border-brand-membership/30 px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-membership/10 transition-colors shadow-sm"
              title="Clear All Data"
            >
              <Trash2 size={16} />
              Clear
            </button>
            <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400" size={18} />
                <input 
                type="text" 
                placeholder="Search events..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-policy outline-none w-64 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
            </div>
            <button 
                onClick={() => setIsCreateEventModalOpen(true)}
                className="flex items-center gap-2 bg-brand-policy text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-policy transition-colors shadow-lg shadow-brand-policy/30"
            >
                <Plus size={18} />
                New Event
            </button>
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
                <Plus size={18} />
                Add Invitation
            </button>
            </div>
        </div>

        <div className="flex px-6 gap-6">
            <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'calendar' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarIcon size={16} />
                Calendar
            </button>
            <button 
                onClick={() => setViewMode('upcoming')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'upcoming' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <CalendarClock size={16} />
                Upcoming
            </button>
            <button 
                onClick={() => setViewMode('past')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'past' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <History size={16} />
                Past
            </button>
            <button 
                onClick={() => setViewMode('contacts')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'contacts' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Users size={16} />
                Contacts
            </button>
            <button 
                onClick={() => setViewMode('overview')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'overview' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <PieChart size={16} />
                Overview
            </button>
            <button 
                onClick={() => setViewMode('emailParser')}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                    viewMode === 'emailParser' ? 'border-brand-policy text-brand-policy' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
                <Mail size={16} />
                Email Parser
            </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {viewMode === 'calendar' ? (
            <div className="w-full h-full"><CalendarView events={events} /></div>
        ) : viewMode === 'overview' ? (
            <div className="w-full h-full"><Overview events={events} onRenameStakeholder={handleRenameStakeholder} /></div>
        ) : viewMode === 'contacts' ? (
            <div className="w-full h-full">
              <ContactsView 
                contacts={contacts} 
                events={events} 
                onUpdateContact={handleUpdateContact} 
                onDeleteContact={handleDeleteContact}
                onUpdateEvent={handleUpdateEvent}
                selectedContactId={selectedContactId}
                setSelectedContactId={setSelectedContactId}
              />
            </div>
        ) : viewMode === 'emailParser' ? (
            <div className="w-full h-full">
              <EmailParserView onEventsExtracted={(newEvents) => {
                setEvents(prev => [...newEvents, ...prev]);
              }} />
            </div>
        ) : (
            <>
                <aside className="w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 z-10 shadow-lg shadow-slate-200/50">
                {/* Sidebar Header with Filter or Bulk Actions */}
                {selectedEventIds.size > 0 ? (
                  <div className="p-4 border-b border-brand-policy/30 flex flex-col gap-3 bg-brand-policy/10 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-brand-policy flex items-center gap-2">
                          <CheckSquare size={16} /> {selectedEventIds.size} Selected
                        </span>
                        <button 
                            onClick={() => setSelectedEventIds(new Set())}
                            className="text-xs font-medium text-brand-policy hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleBulkMarkCompleted}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-brand-policy font-bold text-xs rounded-lg border border-brand-policy/30 hover:bg-brand-policy/20 hover:border-brand-policy/50 transition-colors shadow-sm"
                      >
                         <CheckCircle2 size={14} /> Mark Complete
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-brand-membership font-bold text-xs rounded-lg border border-brand-membership/30 hover:bg-brand-membership/10 hover:border-red-300 transition-colors shadow-sm"
                      >
                         <Trash2 size={14} /> Delete
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select 
                        onChange={(e) => handleBulkUpdateStatus(e.target.value)}
                        className="w-full p-2 border border-brand-policy/30 rounded-lg text-sm text-slate-700"
                        value=""
                      >
                        <option value="">Change Status...</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleBulkExportSelected}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white text-slate-700 font-bold text-xs rounded-lg border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-sm"
                      >
                          <Download size={14} /> Export
                      </button>
                      {viewMode === 'upcoming' && (
                        <button 
                          onClick={handleBulkBriefing}
                          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-brand-policy text-white font-bold text-xs rounded-lg border border-brand-policy hover:bg-brand-policy transition-colors shadow-sm"
                        >
                            <Sparkles size={14} /> AI Briefing
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                      {viewMode === 'upcoming' ? 'Active' : 'Archived'} List ({filteredEvents.length})
                      </span>
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                            <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Status</span>
                            <div className="relative flex-1">
                               <select 
                                  className="w-full p-1.5 bg-transparent border-none text-xs font-medium outline-none text-slate-700 cursor-pointer"
                                  value={statusFilter}
                                  onChange={(e) => setStatusFilter(e.target.value)}
                               >
                                  <option value="All">All Statuses</option>
                                  <option value="To Respond">To Respond</option>
                                  <option value="Responded - On hold for updates">Responded - On hold for updates</option>
                                  <option value="Confirmation - To be briefed">Confirmation - To be briefed</option>
                                  <option value="Prep ready">Prep ready</option>
                                  <option value="Completed - No follow up">Completed - No follow up</option>
                                  <option value="Completed - Follow Up">Completed - Follow Up</option>
                                  <option value="MOs comms">MOs comms</option>
                                  <option value="Not Relevant">Not Relevant</option>
                               </select>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                            <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Role</span>
                            <div className="relative flex-1">
                               <select 
                                  className="w-full p-1.5 bg-transparent border-none text-xs font-medium outline-none text-slate-700 cursor-pointer"
                                  value={repRoleFilter}
                                  onChange={(e) => setRepRoleFilter(e.target.value)}
                               >
                                  <option value="All">All Roles</option>
                                  <option value="Speaker">Speaker</option>
                                  <option value="Participant">Participant</option>
                                  <option value="Activity Host">Activity Host</option>
                                  <option value="Other">Other</option>
                               </select>
                           </div>
                        </div>
                    </div>

                    {/* Show Past Events Toggle (Only in Upcoming View) */}
                    {viewMode === 'upcoming' && (
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-medium text-slate-600">Show Past Events</span>
                            <button 
                                onClick={() => setShowPastEvents(!showPastEvents)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-policy focus:ring-offset-2 ${showPastEvents ? 'bg-brand-policy' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showPastEvents ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}

                    {/* Sorting Row */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
                        <span className="pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Sort By</span>
                        <div className="flex flex-1 gap-1">
                            {['Date', 'Priority', 'Institution'].map((field) => {
                                const f = field.toLowerCase() as SortField;
                                return (
                                    <button 
                                        key={f}
                                        onClick={() => {
                                            if (sortField === f) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                            else { setSortField(f); setSortOrder('asc'); }
                                        }}
                                        className={`flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-colors flex items-center justify-center gap-1 ${
                                            sortField === f 
                                            ? 'bg-brand-policy/10 text-brand-policy' 
                                            : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {field}
                                        {sortField === f && (
                                            <ArrowUpDown size={10} className={sortOrder === 'asc' ? '' : 'rotate-180 transition-transform'} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-y-auto p-3 bg-slate-50">
                    {filteredEvents.length === 0 ? (
                    <div className="text-center py-10 text-slate-400"><p>No {viewMode} events found.</p></div>
                    ) : (
                    filteredEvents.map(event => (
                        <EventCard 
                        key={event.id} 
                        event={event} 
                        isSelected={selectedEventId === event.id}
                        showCheckbox={true}
                        isChecked={selectedEventIds.has(event.id)}
                        onToggleSelect={() => handleToggleSelect(event.id)}
                        onClick={() => setSelectedEventId(event.id)}
                        onDelete={() => handleDeleteEvent(event.id)}
                        />
                    ))
                    )}
                </div>
                </aside>

                <section className="flex-1 p-6 bg-slate-50/50 overflow-hidden">
                {selectedEvent && filteredEvents.some(e => e.id === selectedEvent.id) ? (
                    <EventDetail 
                        event={selectedEvent} 
                        onUpdate={handleUpdateEvent}
                        onDelete={() => handleDeleteEvent(selectedEvent.id)}
                        contacts={contacts}
                        onViewContact={handleViewContactProfile}
                        allEvents={events}
                        onAddContact={handleAddContact}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Layout size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select an event to view details</p>
                    </div>
                )}
                </section>
            </>
        )}

      </main>

      {isCreateEventModalOpen && (
        <CreateEventModal 
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onEventCreated={handleAnalysisComplete}
          existingEvents={events}
        />
      )}
      {isUploadModalOpen && (
        <UploadModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
      
      <ConfirmDeleteModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirm={() => {
          localStorage.removeItem('obessu_events');
          localStorage.removeItem('obessu_contacts');
          setEvents([]);
          setContacts([]);
          showToast('All data cleared', 'success');
        }}
        title="Clear All Data"
        message="Are you sure you want to clear all data? This action cannot be undone and will remove all events and contacts from your local storage."
      />

      <LiveAssistant />
    </div>
  );
}
