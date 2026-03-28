import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GlobalContext } from '../../../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  globalContext: GlobalContext;
  setGlobalContext: (context: GlobalContext) => void;
}

export function GlobalBrainModal({ isOpen, setIsOpen, globalContext, setGlobalContext }: Props) {
  const [formData, setFormData] = useState<GlobalContext>(globalContext);

  useEffect(() => {
    setFormData(globalContext);
  }, [globalContext]);

  const handleSave = () => {
    setGlobalContext(formData);
    localStorage.setItem('mailstream_global_context', JSON.stringify(formData));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl p-0 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#E4E3E0] border-b-4 border-black p-4 sm:p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none">
                Global Brain
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-zinc-600 mt-1 uppercase font-bold">
                Zero-Cost Personalization Context
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-white space-y-6">
          <div className="bg-blue-50 border-2 border-blue-900 p-4 text-sm font-mono text-blue-900">
            <strong>HOW IT WORKS:</strong> This data is saved 100% locally in your browser. It costs $0 and is completely private. The AI automatically uses this context to hyper-personalize your emails without you typing it every time.
          </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider">Your Role / Title</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm"
                  placeholder="e.g. Senior React Developer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider">Company / Agency Name (Optional)</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm"
                placeholder="e.g. Acme Corp or Freelance"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider">Portfolio / LinkedIn URL</label>
              <input
                type="text"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm"
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider">Core Skills / Value Proposition</label>
              <textarea
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                rows={3}
                className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm resize-none"
                placeholder="e.g. React, Node.js, UI/UX Design. I specialize in building fast, accessible web applications."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider">Additional Context (The "Secret Sauce")</label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                rows={4}
                className="w-full p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-mono text-sm resize-none"
                placeholder="Paste your resume summary, agency pitch, or any other context the AI should always know about you."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#E4E3E0] border-t-4 border-black p-4 sm:p-6 flex justify-end shrink-0">
            <Button 
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase tracking-wider rounded-none px-8 py-6 flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Save to Local Storage</span>
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
