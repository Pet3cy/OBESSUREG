import React from 'react';
import { Layout, Calendar, Brain, Shield, ArrowRight, Loader2, AlertTriangle, UserCheck } from 'lucide-react';

interface WelcomeScreenProps {
  onLogin: () => void;
  isLoggingIn?: boolean;
  authError?: string | null;
  onContinueAsGuest?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onLogin, 
  isLoggingIn, 
  authError, 
  onContinueAsGuest 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-12 md:p-16 flex flex-col items-center text-center">
          <div className="bg-brand-policy p-4 rounded-2xl shadow-lg shadow-brand-policy/30 mb-8">
            <Layout className="text-white w-12 h-12" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Welcome to EventFlow AI
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
            The strategic triage and event management platform for OBESSU. 
            Automatically process invitations, score strategic value, and route events to the right team members.
          </p>

          {authError && (
            <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-left w-full max-w-2xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 w-6 h-6 animate-pulse" />
                <div className="flex-1">
                  {authError === 'popup-blocked' ? (
                    <>
                      <h3 className="font-bold text-amber-950 mb-1">Pop-up Blocked by Browser</h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Because this workspace runs in an iframe preview, your browser may block the Google Sign-In popup.
                      </p>
                      <ul className="text-xs text-amber-700 mt-2 list-disc list-inside space-y-1">
                        <li>Look for a blocked pop-up icon (<span className="font-semibold">⧉</span>) in your browser's address bar and select <strong>"Always allow popups"</strong>.</li>
                        <li>Alternatively, click <strong>"Continue to Workspace as Guest"</strong> below to explore and use local features without Google Calendar/Gmail sync.</li>
                      </ul>
                    </>
                  ) : authError === 'popup-closed' ? (
                    <>
                      <h3 className="font-bold text-amber-950 mb-1">Sign-In Popup Closed</h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        The Google Sign-In popup was closed before completing authentication. This can happen if the window was dismissed, or blocked by local security extensions.
                      </p>
                      <ul className="text-xs text-amber-700 mt-2 list-disc list-inside space-y-1">
                        <li>You can click <strong>"Sign in with Google"</strong> again if you want to connect your OBESSU account.</li>
                        <li>Or simply click <strong>"Continue to Workspace as Guest"</strong> below to start using all analysis and triage tools immediately!</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-amber-950 mb-1">Sign-In Alert</h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        There was an issue authenticating with Google: <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">{authError}</span>
                      </p>
                      <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                        You can still proceed and fully access the analyzer by clicking <strong>"Continue to Workspace as Guest"</strong> below.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 w-full mb-12 text-left">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-policy/30 hover:bg-brand-policy/10/50 transition-colors">
              <Brain className="text-brand-policy w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">AI-Powered Triage</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Upload PDFs or paste emails. Our AI instantly extracts metadata, assigns priority scores, and drafts executive briefings.
              </p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-policy/30 hover:bg-brand-policy/10/50 transition-colors">
              <Calendar className="text-brand-policy w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Seamless Sync</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect your Google Calendar to automatically sync approved events and keep your team's schedule up-to-date.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-brand-policy/30 hover:bg-brand-policy/10/50 transition-colors">
              <Shield className="text-brand-policy w-8 h-8 mb-4" />
              <h3 className="text-lg font-bold mb-2">Secure & Private</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Your data is processed securely. Calendar access is strictly limited to syncing your managed events.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <button 
              onClick={onLogin}
              disabled={isLoggingIn}
              className="w-full bg-brand-policy text-white text-lg font-bold py-4 px-8 rounded-xl hover:bg-brand-policy/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-brand-policy/30 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoggingIn ? (
                 <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                 <>Sign in with Google <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full bg-white text-slate-700 border border-slate-300 text-base font-semibold py-3 px-8 rounded-xl hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <UserCheck className="w-5 h-5 text-slate-500" />
              Continue to Workspace as Guest
            </button>

            <p className="text-xs text-slate-400 text-center mt-4">
              By continuing, you agree to the OBESSU internal data processing guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
