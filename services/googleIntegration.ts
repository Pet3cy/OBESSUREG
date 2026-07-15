import { getAccessToken } from '../src/lib/firebase';

export async function createGoogleDoc(title: string, content: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title })
  });
  const doc = await createRes.json();
  if (!doc.documentId) throw new Error("Failed to create document: " + JSON.stringify(doc));

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content
          }
        }
      ]
    })
  });
  
  if (!updateRes.ok) {
    console.error("Failed to insert text", await updateRes.text());
  }
  
  return `https://docs.google.com/document/d/${doc.documentId}/edit`;
}

export async function createGoogleSlide(title: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title })
  });
  const pres = await createRes.json();
  if (!pres.presentationId) throw new Error("Failed to create presentation");

  return `https://docs.google.com/presentation/d/${pres.presentationId}/edit`;
}

export async function createGoogleTask(title: string, notes: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, notes })
  });
  if (!res.ok) throw new Error("Failed to create task");
}

export async function syncGoogleContacts(contacts: any[]): Promise<void> {
  // We can only create contacts one by one via People API or just show how many synced
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  // Create one contact as a test/demo
  for (const contact of contacts.slice(0, 1)) {
    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        names: [{ givenName: contact.name }],
        emailAddresses: [{ value: contact.email }],
        organizations: [{ name: contact.organization, title: contact.role }],
      })
    });
    if (!res.ok) throw new Error("Failed to sync contact");
  }
}

export async function getChatSpaces(): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  if (!res.ok) throw new Error("Failed to fetch spaces");
  const data = await res.json();
  return data.spaces || [];
}

export async function sendChatMessage(spaceName: string, text: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error("Failed to send message");
}

export async function createGoogleMeet(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });
  const space = await res.json();
  if (!space.meetingUri) throw new Error("Failed to create Meet link");
  return space.meetingUri;
}

export async function createGoogleForm(title: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ info: { title } })
  });
  const form = await createRes.json();
  if (!form.responderUri) throw new Error("Failed to create Google Form");
  return form.responderUri;
}

export async function createGoogleKeepNote(title: string, content: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please sign in with Google first.");
  
  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body: { text: { text: content } } })
  });
  if (!res.ok) throw new Error("Failed to create Keep note");
  const note = await res.json();
  return note.name || 'Note created';
}
