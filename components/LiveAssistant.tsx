import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, X, MessageSquare } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { useToast } from '../contexts/ToastContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Audio playback
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: 1,
        sampleRate: 16000,
      } });
      mediaStreamRef.current = stream;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a helpful event management assistant for OBESSU. You can help users organize events, answer questions about event planning, and provide strategic advice.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            processorRef.current!.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array (PCM)
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // Convert to base64
              const buffer = new ArrayBuffer(pcmData.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcmData.length; i++) {
                view.setInt16(i * 2, pcmData[i], true); // little-endian
              }
              
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            sourceRef.current!.connect(processorRef.current!);
            processorRef.current!.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Convert PCM16 to Float32
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
              }
              
              playbackQueueRef.current.push(float32);
              playNextAudio();
            }
            
            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              isPlayingRef.current = false;
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            showError("Live Assistant connection error occurred.");
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to connect to microphone or AI.");
      showError(err.message || "Failed to connect to microphone or AI.");
      setIsConnecting(false);
      disconnect();
    }
  };

  const playNextAudio = () => {
    if (!audioContextRef.current || playbackQueueRef.current.length === 0) return;
    
    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    
    const audioData = playbackQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000); // openclaw TTS is 24kHz
    buffer.getChannelData(0).set(audioData);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(nextPlayTimeRef.current);
    
    nextPlayTimeRef.current += buffer.duration;
    
    source.onended = () => {
      if (playbackQueueRef.current.length > 0) {
        playNextAudio();
      }
    };
  };

  const disconnect = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-policy text-white rounded-full shadow-xl shadow-brand-policy/30 flex items-center justify-center hover:bg-brand-policy transition-transform hover:scale-105 z-50"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col">
      <div className="bg-slate-900 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-policy animate-pulse"></div>
          <h3 className="text-white font-bold text-sm">Live Assistant</h3>
        </div>
        <button onClick={() => { setIsOpen(false); disconnect(); }} className="text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-slate-50">
        {error ? (
          <div className="text-red-500 text-sm text-center mb-4">{error}</div>
        ) : isConnected ? (
          <div className="text-center">
            <div className="w-20 h-20 bg-brand-policy/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-brand-policy rounded-full animate-ping opacity-20"></div>
              <Mic size={32} className="text-brand-policy" />
            </div>
            <p className="text-slate-600 font-medium text-sm">Listening...</p>
            <p className="text-slate-400 text-xs mt-1">Speak to the assistant</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-slate-600 text-sm mb-4">Start a live voice conversation with the AI assistant.</p>
          </div>
        )}
        
        <div className="mt-6 w-full">
          {!isConnected ? (
            <button 
              onClick={connect}
              disabled={isConnecting}
              className="w-full py-3 bg-brand-policy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-policy disabled:opacity-50 transition-colors"
            >
              {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
              {isConnecting ? 'Connecting...' : 'Start Conversation'}
            </button>
          ) : (
            <button 
              onClick={disconnect}
              className="w-full py-3 bg-red-100 text-brand-membership rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
            >
              <MicOff size={18} />
              End Conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
