import React from 'react';
import { Mail, BookOpen, PlayCircle, CheckCircle2, Database, LayoutTemplate, Settings, LogOut, User, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '../../types';

interface Props {
  step: number;
  setStep: (step: number) => void;
  isGoogleConnected: boolean;
  userProfile: UserProfile | null;
  handleLogin: () => void;
  handleLogout: () => void;
  isStepComplete: (stepId: number) => boolean;
  configSteps: { id: number; name: string; icon: any }[];
  onOpenGlobalBrain: () => void;
}

export function Header({ 
  step, 
  setStep, 
  isGoogleConnected, 
  userProfile, 
  handleLogin, 
  handleLogout, 
  isStepComplete,
  configSteps,
  onOpenGlobalBrain
}: Props) {
  return (
    <header className="bg-white border-b-4 border-black sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => setStep(0)}>
            <div className="bg-primary p-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-2">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-heading font-black tracking-tighter text-black uppercase block leading-none">MailStream</span>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">
            <button 
              onClick={() => setStep(0)}
              className="flex items-center space-x-1.5 font-mono font-black uppercase text-[10px] text-zinc-500 hover:text-black transition-colors"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
            <button 
              onClick={onOpenGlobalBrain}
              className="flex items-center space-x-1.5 font-mono font-black uppercase text-[10px] text-blue-600 hover:text-blue-800 transition-colors"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Global Brain</span>
            </button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Main Navigation */}
          <nav className="hidden md:flex items-center bg-zinc-100 border-2 border-black p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {configSteps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 font-mono font-black uppercase text-[10px] transition-all ${step === s.id ? 'bg-black text-white' : 'hover:bg-white text-zinc-500 hover:text-black'}`}
              >
                <s.icon className={`w-3.5 h-3.5 ${step === s.id ? 'text-primary' : ''}`} />
                <span>{s.name}</span>
                {isStepComplete(s.id) && s.id !== step && <CheckCircle2 className="w-3 h-3 text-accent" />}
              </button>
            ))}
          </nav>

          <div className="h-8 w-0.5 bg-black/10 hidden md:block" />

          {isGoogleConnected && userProfile ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-mono font-black uppercase leading-none">{userProfile.name}</p>
                <p className="text-[8px] font-mono text-zinc-500 uppercase leading-none mt-1">{userProfile.email}</p>
              </div>
              <div className="relative group">
                <div className="w-10 h-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
                  <img 
                    src={userProfile.picture} 
                    alt={userProfile.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button 
                  onClick={handleLogout}
                  className="absolute -bottom-1 -right-1 bg-red-500 border-2 border-black p-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleLogin}
              variant="outline"
              size="sm"
              className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-mono font-black uppercase text-[10px] h-9"
            >
              <User className="w-3.5 h-3.5 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
