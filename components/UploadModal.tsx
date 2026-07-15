
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Loader2, FileText, Mail, Clipboard, CheckCircle2, AlertCircle, Mic, Square, Cloud, Search, HardDrive } from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { analyzeInvitation, AnalysisInput, transcribeAudio } from '../services/gemmaService';
import { EventData, Priority } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getAccessToken } from '../src/lib/firebase';

interface UploadModalProps {
  onClose: () => void;
  onAnalysisComplete: (event: EventData) => void;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onAnalysisComplete }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'text' | 'file' | 'link' | 'drive'>('text');
  const [link, setLink] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { showError, showToast } = useToast();

  useEffect(() => {
    if (window.gapi) {
      window.gapi.load('picker', () => {
        setIsPickerLoaded(true);
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setIsPickerLoaded(true);
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  const openDrivePicker = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please sign in to Google to access Drive.');
      }

      if (!isPickerLoaded || !window.google || !window.google.picker) {
        throw new Error('Google Picker is not loaded yet. Please try again.');
      }

      const pickerOrigin = window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const file = data.docs[0];
            setIsAnalyzing(true);
            setProgress(0);
            try {
               // Fetch file content using Drive API
               const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                 headers: { Authorization: `Bearer ${accessToken}` }
               });
               if (!res.ok) throw new Error('Failed to download file from Drive');
               
               const textContent = await res.text(); // Assuming text based for now, could be improved based on mimeType
               setText(textContent);
               setMode('text');
               showToast(`Loaded ${file.name} from Drive. Review text and click Analyze.`, 'success');
            } catch (err: any) {
               setError(err.message || 'Failed to process Drive file');
            } finally {
               setIsAnalyzing(false);
            }
          }
        })
        .setOrigin(pickerOrigin)
        .build();
      
      picker.setVisible(true);
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum size is 50MB.');
      return;
    }
    
    setSelectedFile(file);
    setError('');
  };

  const convertFileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsAnalyzing(true);
        try {
          const base64Audio = await convertFileToBase64(audioBlob);
          const transcription = await transcribeAudio(base64Audio, 'audio/webm');
          setText((prev) => prev + (prev ? '\n\n' : '') + transcription);
          showToast('Audio transcribed successfully', 'success');
        } catch (err: any) {
          setError(err.message || 'Failed to transcribe audio');
          showError(err.message || 'Failed to transcribe audio');
        } finally {
          setIsAnalyzing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available.');
      showError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async () => {
    // if (!eventTitle.trim()) { setError("Event Title is required."); return; }
    if (mode === 'text' && !text.trim()) { setError("Paste the invitation content first."); return; }
    if (mode === 'file' && !selectedFile) { setError("Select a document first."); return; }
    if (mode === 'link' && !link.trim()) { setError("Enter a URL first."); return; }

    setIsAnalyzing(true);
    setProgress(0);
    setError('');

    // Simulate progress
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.floor(Math.random() * 15);
        });
    }, 600);

    try {
      let input: AnalysisInput = {};
      if (mode === 'file' && selectedFile) {
        if (selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
          const result = await mammoth.extractRawText({ arrayBuffer: await selectedFile.arrayBuffer() });
          input.text = result.value;
        } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          let textContent = '';
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            textContent += XLSX.utils.sheet_to_csv(sheet) + '\n';
          });
          input.text = textContent;
        } else if (selectedFile.name.endsWith('.mp3') || selectedFile.name.endsWith('.m4p')) {
          const base64Audio = await convertFileToBase64(selectedFile);
          const transcription = await transcribeAudio(base64Audio, selectedFile.type);
          input.text = transcription;
        } else if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf') || selectedFile.type.startsWith('image/') || selectedFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          const mimeType = selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          input.fileData = { mimeType, data: await convertFileToBase64(selectedFile) };
        } else if (selectedFile.name.endsWith('.eml') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.ics') || selectedFile.name.endsWith('.pptx') || selectedFile.name.endsWith('.ppt')) {
          if (selectedFile.name.endsWith('.pptx') || selectedFile.name.endsWith('.ppt')) {
             input.text = "PPT file uploaded: " + selectedFile.name + ". Please analyze the content.";
          } else {
             input.text = await selectedFile.text();
          }
        } else {
          setError("Unsupported file format. Please use PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, ICS, MP3, or M4P.");
          setIsAnalyzing(false); 
          clearInterval(interval);
          return;
        }
      } else if (mode === 'link' && link) {
        const res = await fetch(`/api/url/content?url=${encodeURIComponent(link)}`);
        if (!res.ok) throw new Error("Failed to fetch content from URL");
        const data = await res.json();
        
        if (data.isBase64) {
          input.fileData = { mimeType: data.mimeType, data: data.content };
        } else {
          input.text = data.content;
        }
      } else {
        input.text = text;
      }

      const results = await analyzeInvitation(input);
      
      // Analysis complete, finish progress bar
      clearInterval(interval);
      setProgress(100);

      // Brief delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (const result of results) {
        if (eventTitle.trim()) result.eventName = eventTitle.trim();
        if (eventDate) result.date = eventDate;
        if (eventTime) result.time = eventTime;

        const newEvent: EventData = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          originalText: text || (mode === 'link' ? `Link: ${link}` : `File: ${selectedFile?.name}`),
          analysis: result,
          contact: { name: '', email: '', role: '', organization: '', notes: '', polContact: '', repRole: 'Participant' },
          followUp: { 
            briefing: '', postEventNotes: '', status: 'To Respond', prepResources: '',
            commsPack: { remarks: '', representative: result.suggestedRepresentative || '', datePlace: `${result.date} @ ${result.venue}`, additionalInfo: '' }
          }
        };
        onAnalysisComplete(newEvent);
      }
      
      showToast(`Analyzed ${results.length} event(s) successfully`, 'success');
      onClose();
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "Analysis failed. Ensure the text contains clear event details.");
      showError(err.message || "Analysis failed. Ensure the text contains clear event details.");
      setProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200 relative">
        
        {/* Progress Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center p-8 fade-in duration-300">
                <div className="w-16 h-16 mb-6 relative">
                    <Loader2 className="w-16 h-16 animate-spin text-brand-policy/30" />
                    <Loader2 className="w-16 h-16 animate-spin text-brand-policy absolute top-0 left-0" style={{ strokeDasharray: 100, strokeDashoffset: 100 - progress }} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Analyzing...</h3>
                <p className="text-slate-500 mb-8 text-center max-w-xs mx-auto">Extracting metadata, assigning strategic priority, and identifying key stakeholders...</p>
                
                <div className="w-full max-w-md bg-slate-100 rounded-full h-4 overflow-hidden mb-2">
                    <div 
                        className="bg-brand-policy h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2" 
                        style={{ width: `${progress}%` }}
                    >
                    </div>
                </div>
                <div className="flex justify-between w-full max-w-md text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>Uploading</span>
                    <span>Processing</span>
                    <span>Complete</span>
                </div>
            </div>
        )}

        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Process Invitation</h2>
            <p className="text-sm text-slate-500">Powered by openclaw • Optimized for Email Parsing</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>
        </div>

        <div className="px-6 pt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Event Title (Optional)</label>
            <input 
              type="text" 
              value={eventTitle} 
              onChange={e => setEventTitle(e.target.value)} 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-policy outline-none text-sm" 
              placeholder="Enter event title" 
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Event Date (Optional)</label>
              <input 
                type="date" 
                value={eventDate} 
                onChange={e => setEventDate(e.target.value)} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-policy outline-none text-sm text-slate-700" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Event Time (Optional)</label>
              <input 
                type="time" 
                value={eventTime} 
                onChange={e => setEventTime(e.target.value)} 
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-policy outline-none text-sm text-slate-700" 
              />
            </div>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 mx-6 mt-6 mb-4 rounded-xl flex-wrap">
           <button onClick={() => setMode('text')} className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'text' ? 'bg-white shadow-sm text-brand-policy' : 'text-slate-500 hover:text-slate-700'}`}>
             <Clipboard size={16}/> Paste Content
           </button>
           <button onClick={() => setMode('file')} className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'file' ? 'bg-white shadow-sm text-brand-policy' : 'text-slate-500 hover:text-slate-700'}`}>
             <FileText size={16}/> Upload Document
           </button>
           <button onClick={() => setMode('link')} className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'link' ? 'bg-white shadow-sm text-brand-policy' : 'text-slate-500 hover:text-slate-700'}`}>
             <Cloud size={16}/> Link
           </button>
           <button onClick={openDrivePicker} className={`flex-1 min-w-[100px] py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'drive' ? 'bg-white shadow-sm text-brand-policy' : 'text-slate-500 hover:text-slate-700'}`}>
             <HardDrive size={16}/> Google Drive
           </button>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto">
          {mode === 'text' ? (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-policy/10 focus:border-brand-policy text-sm font-mono leading-relaxed resize-none"
                  placeholder="Paste the full email including headers (Subject, From, Date) if possible..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`absolute bottom-4 right-4 p-3 rounded-full shadow-md transition-all ${isRecording ? 'bg-brand-membership/100 hover:bg-red-600 text-white animate-pulse' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                  title={isRecording ? "Stop Recording" : "Dictate with Voice"}
                >
                  {isRecording ? <Square size={20} /> : <Mic size={20} />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Mail size={12}/> Pro-tip: Include the email 'Subject' for better categorization.
              </div>
            </div>
          ) : mode === 'file' ? (
            <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30 group hover:border-brand-policy transition-all relative">
              <input type="file" accept="image/*,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.eml,.txt,.csv,.ics,.mp3,.m4p" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-brand-policy" size={32} />
              </div>
              <p className="text-sm font-bold text-slate-700">{selectedFile ? selectedFile.name : 'Drop Image, PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, EML, TXT, CSV, ICS, MP3, or M4P invitation'}</p>
              <p className="text-xs text-slate-400 mt-1">Maximum file size: 50MB</p>
            </div>
          ) : (
            <div className="h-64 border border-slate-200 rounded-2xl flex flex-col bg-slate-50/30 p-6">
              <h3 className="text-lg font-bold text-slate-700 mb-4">Paste Event Link</h3>
              <p className="text-sm text-slate-500 mb-4">Paste a URL to a PDF, web page, or document containing event details.</p>
              <input 
                type="url" 
                value={link}
                onChange={e => setLink(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-policy outline-none text-sm"
                placeholder="https://..."
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm font-medium mt-4 bg-brand-membership/10 p-3 rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="px-8 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center gap-2"
          >
            Analyze with AI
          </button>
        </div>
      </div>
    </div>
  );
};


