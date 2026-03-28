import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Contact, EmailTemplate, SmtpConfig, UserProfile } from './types';
import { Database, LayoutTemplate, Settings, Send, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import { Header } from './components/layout';
import { GlobalBrainModal } from './features/global-brain';
import { GlobalContext } from './types';

const Step0GetStarted = lazy(() => import('./features/onboarding').then(m => ({ default: m.Step0GetStarted })));
const Step1Data = lazy(() => import('./features/data-management').then(m => ({ default: m.Step1Data })));
const Step2Template = lazy(() => import('./features/email-editor').then(m => ({ default: m.Step2Template })));
const Step3Settings = lazy(() => import('./features/configuration').then(m => ({ default: m.Step3Settings })));
const Step4Send = lazy(() => import('./features/delivery').then(m => ({ default: m.Step4Send })));

const LoadingStep = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="w-12 h-12 text-primary animate-spin" />
    <p className="font-mono font-bold uppercase text-zinc-500">Loading Engine...</p>
  </div>
);

export default function App() {
  const [step, setStep] = useState(0);
  
  // App State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [template, setTemplate] = useState<EmailTemplate>({
    subject: '',
    body: '',
    emailColumn: '',
    attachments: []
  });
  const [config, setConfig] = useState<SmtpConfig>({
    method: 'smtp',
    host: '',
    port: 465,
    user: '',
    pass: '',
    fromName: '',
    fromEmail: '',
    mock: true,
    delay: 1
  });

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem('mailstream_contacts');
      if (savedContacts) setContacts(JSON.parse(savedContacts));

      const savedColumns = localStorage.getItem('mailstream_columns');
      if (savedColumns) setColumns(JSON.parse(savedColumns));

      const savedTemplate = localStorage.getItem('mailstream_template');
      if (savedTemplate) setTemplate(JSON.parse(savedTemplate));

      const savedConfig = localStorage.getItem('mailstream_config');
      if (savedConfig) setConfig(JSON.parse(savedConfig));
    } catch (e) {
      console.error('Failed to load state from local storage', e);
    }
  }, []);

  // Save state to local storage when it changes
  useEffect(() => {
    localStorage.setItem('mailstream_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('mailstream_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('mailstream_template', JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    localStorage.setItem('mailstream_config', JSON.stringify(config));
  }, [config]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsGoogleConnected(data.connected);
      
      if (data.connected) {
        const profileRes = await fetch('/api/auth/me');
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData);
        }
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to check auth status');
    }
  };

  useEffect(() => {
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
        toast.success('Successfully connected to Google!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      toast.error('Failed to initiate login');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsGoogleConnected(false);
      setUserProfile(null);
      toast.info('Logged out successfully');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  const [globalContext, setGlobalContext] = useState<GlobalContext>({
    name: '',
    role: '',
    company: '',
    skills: '',
    portfolioUrl: '',
    additionalInfo: ''
  });
  const [isGlobalBrainOpen, setIsGlobalBrainOpen] = useState(false);

  useEffect(() => {
    const savedContext = localStorage.getItem('mailstream_global_context');
    if (savedContext) {
      try {
        setGlobalContext(JSON.parse(savedContext));
      } catch (e) {
        console.error('Failed to parse global context');
      }
    }
  }, []);

  const configSteps = [
    { id: 1, name: 'Data', icon: Database },
    { id: 2, name: 'Template', icon: LayoutTemplate },
    { id: 3, name: 'Settings', icon: Settings },
  ];

  const isStepComplete = (stepId: number) => {
    if (stepId === 1) return contacts.length > 0;
    if (stepId === 2) return template.subject.length > 0 && template.body.length > 0;
    if (stepId === 3) return config.host.length > 0 || config.mock;
    return false;
  };

  const progress = (Math.min(step, 3) / 3) * 100;

  return (
    <div className="min-h-screen bg-[#E4E3E0] font-sans text-zinc-900 selection:bg-zinc-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      
      <Toaster position="top-right" richColors />
      
      <Header 
        step={step}
        setStep={setStep}
        isGoogleConnected={isGoogleConnected}
        userProfile={userProfile}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isStepComplete={isStepComplete}
        configSteps={configSteps}
        onOpenGlobalBrain={() => setIsGlobalBrainOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Mobile Navigation */}
        <div className="md:hidden mb-6 flex bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden sticky top-20 z-20">
          {configSteps.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 border-r-2 last:border-r-0 border-black font-mono font-black uppercase text-[9px] transition-all ${step === s.id ? 'bg-black text-white' : 'bg-white text-zinc-500'}`}
            >
              <s.icon className={`w-4 h-4 mb-1 ${step === s.id ? 'text-primary' : ''}`} />
              {s.name}
            </button>
          ))}
          <button
            onClick={() => setStep(4)}
            className={`flex-1 flex flex-col items-center justify-center py-3 font-mono font-black uppercase text-[9px] transition-all ${step === 4 ? 'bg-black text-white' : 'bg-white text-zinc-500'}`}
          >
            <Send className={`w-4 h-4 mb-1 ${step === 4 ? 'text-green-400' : ''}`} />
            Dispatch
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="bg-white border-4 border-black p-4 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] min-h-[500px] sm:min-h-[600px]"
          >
            <Suspense fallback={<LoadingStep />}>
              {step === 0 && (
                <Step0GetStarted onNext={() => setStep(1)} />
              )}
              {step === 1 && (
                <Step1Data 
                  contacts={contacts} 
                  setContacts={setContacts} 
                  columns={columns} 
                  setColumns={setColumns}
                  emailColumn={template.emailColumn}
                  setEmailColumn={(col) => setTemplate({ ...template, emailColumn: col })}
                  isGoogleConnected={isGoogleConnected}
                  setIsGoogleConnected={setIsGoogleConnected}
                />
              )}
              {step === 2 && (
                <Step2Template 
                  template={template} 
                  setTemplate={setTemplate} 
                  columns={columns}
                  contacts={contacts}
                  config={config}
                  globalContext={globalContext}
                />
              )}
              {step === 3 && (
                <Step3Settings 
                  config={config} 
                  setConfig={setConfig} 
                  isGoogleConnected={isGoogleConnected}
                />
              )}
              {step === 4 && (
                <Step4Send 
                  contacts={contacts} 
                  template={template} 
                  config={config} 
                  isGoogleConnected={isGoogleConnected}
                  setIsGoogleConnected={setIsGoogleConnected}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer */}
        {step > 0 && (
          <div className="mt-8 sm:mt-12 flex justify-between items-center gap-4">
            <Button 
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="h-12 sm:h-14 px-4 sm:px-8 border-2 sm:border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-mono uppercase font-black text-sm sm:text-lg bg-white flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              Back
            </Button>
            
            <div className="hidden sm:flex items-center space-x-2">
              {configSteps.map(s => (
                <div 
                  key={s.id} 
                  className={`w-3 h-3 border-2 border-black rotate-45 transition-colors ${s.id === step ? 'bg-primary' : s.id < step || isStepComplete(s.id) ? 'bg-accent' : 'bg-white'}`}
                />
              ))}
              <div className={`w-3 h-3 border-2 border-black rotate-45 transition-colors ${step === 4 ? 'bg-green-400' : 'bg-white'}`} />
            </div>

            {step < 4 ? (
              <Button 
                onClick={() => setStep(Math.min(4, step + 1))}
                disabled={step === 1 && contacts.length === 0}
                className="h-12 sm:h-14 px-4 sm:px-8 border-2 sm:border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-mono uppercase font-black text-sm sm:text-lg bg-primary text-white flex-1 sm:flex-none"
              >
                Continue
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <div className="flex items-center space-x-2 bg-green-400 border-2 sm:border-4 border-black px-4 sm:px-6 h-12 sm:h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1 sm:flex-none justify-center">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                <span className="font-mono font-black uppercase text-black text-xs sm:text-base">Final Step: Dispatch</span>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer Decoration */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t-2 border-black/10 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.3em]">
            &copy; 2026 MailStream Engine // All Rights Reserved
          </div>
          <div className="flex space-x-8">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase cursor-pointer hover:text-black transition-colors">Documentation</span>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase cursor-pointer hover:text-black transition-colors">API Status</span>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase cursor-pointer hover:text-black transition-colors">Support</span>
          </div>
        </div>
      </footer>
      <GlobalBrainModal 
        isOpen={isGlobalBrainOpen}
        setIsOpen={setIsGlobalBrainOpen}
        globalContext={globalContext}
        setGlobalContext={setGlobalContext}
      />
    </div>
  );
}
