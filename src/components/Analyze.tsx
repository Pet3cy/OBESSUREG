import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import type { Event } from '../types';

export default function Analyze() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Partial<Event> | null>(null);
  
  const context = useContext(AppContext);
  const navigate = useNavigate();

  if (!context) return null;

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/events/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze event text.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!result) return;

    const newEvent: Event = {
      id: Math.random().toString(36).substring(7),
      title: result.title || 'Untitled Event',
      date: result.date || 'TBD',
      location: result.location || 'TBD',
      organizer: result.organizer || 'Unknown',
      priority: (result.priority as any) || 'Medium',
      status: 'Pending',
      representative: result.representative || 'Unassigned',
      theme: result.theme || 'General',
      description: result.description || '',
      targetAudience: result.targetAudience || '',
      objectives: result.objectives || '',
      cost: result.cost || '',
      deadline: result.deadline || '',
      format: result.format || '',
      language: result.language || '',
      contactPerson: result.contactPerson || '',
      contactEmail: result.contactEmail || '',
      website: result.website || '',
      requiredPreparation: result.requiredPreparation || '',
      notes: result.notes || ''
    };

    context.setEvents([...context.events, newEvent]);
    
    // Increment representative count if found
    if (newEvent.representative && newEvent.representative !== 'Unassigned') {
      const repLower = newEvent.representative.toLowerCase();
      const updatedStaff = context.staff.map(s => {
        if (repLower.includes(s.name.split(' ')[0].toLowerCase())) {
          return { ...s, eventCount: s.eventCount + 1 };
        }
        return s;
      });
      context.setStaff(updatedStaff);
    }

    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto flex gap-8">
      {/* Input Section */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyze Invitation</h2>
          <p className="text-gray-500 mt-1">Paste the event invitation text below to extract structured data.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <textarea
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-sans"
            placeholder="Paste email, document text, or invitation details here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Extract Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-[400px]">
        {result ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-indigo-50 border-b border-indigo-100 p-4">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold">Extraction Complete</h3>
              </div>
              <p className="text-sm text-indigo-600">Review the extracted fields before saving.</p>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <Field label="Title" value={result.title} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date" value={result.date} />
                <Field label="Location" value={result.location} />
              </div>
              <Field label="Organizer" value={result.organizer} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Priority" value={result.priority} isBadge />
                <Field label="Suggested Rep" value={result.representative} />
              </div>
              <Field label="Theme" value={result.theme} />
              <Field label="Format" value={result.format} />
              <Field label="Deadline" value={result.deadline} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Save to Pipeline
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50/50">
            <Upload className="w-12 h-12 text-gray-300 mb-4" />
            <p>Analysis results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, isBadge = false }: { label: string; value?: string; isBadge?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</div>
      {isBadge ? (
        <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md border border-gray-200">
          {value}
        </span>
      ) : (
        <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">
          {value}
        </div>
      )}
    </div>
  );
}