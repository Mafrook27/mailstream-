import React, { useState, useEffect, useRef } from 'react';
import { EmailTemplate, Contact, SmtpConfig, GlobalContext } from '../../../types';
import { Save, FolderOpen, Sparkles, Loader2, BrainCircuit, Trash2, Paperclip, File, X, UploadCloud, UserCircle2, MessageSquare, FileText, ImageIcon, FileArchive, FileCode, Eye, EyeOff, Layout, Split, ChevronLeft, ChevronRight, Copy, Check, FileSpreadsheet, FileAudio, FileVideo } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Attachment } from '../../../types';
import { replaceVars } from '../../../lib/templateUtils';
import { DeliverabilityScore } from './DeliverabilityScore';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';

interface Props {
  template: EmailTemplate;
  setTemplate: React.Dispatch<React.SetStateAction<EmailTemplate>>;
  columns: string[];
  contacts: Contact[];
  config: SmtpConfig;
  globalContext: GlobalContext;
}

interface SavedTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function Step2Template({ template, setTemplate, columns, contacts, config, globalContext }: Props) {
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const currentContact = contacts.length > 0 ? contacts[previewIndex % contacts.length] : null;

  const copyToClipboard = () => {
    const rendered = replaceVars(template.body, currentContact);
    navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Refs for cursor position insertion
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiAudience, setAiAudience] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiCTA, setAiCTA] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loaded = localStorage.getItem('mailstream_templates');
    if (loaded) {
      try {
        setSavedTemplates(JSON.parse(loaded));
      } catch (e) {
        console.error('Failed to parse saved templates');
      }
    }
  }, []);

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject: template.subject,
      body: template.body
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('mailstream_templates', JSON.stringify(updated));
    setShowSaveModal(false);
    setTemplateName('');
  };

  const loadTemplate = (t: SavedTemplate) => {
    setTemplate(prev => ({
      ...prev,
      subject: t.subject,
      body: t.body
    }));
    setShowLoadModal(false);
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('mailstream_templates', JSON.stringify(updated));
  };

  const generateWithAi = async (mode: 'quick' | 'deep') => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing. Please set it in the environment variables.');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const hasGlobalContext = globalContext && (globalContext.name || globalContext.role || globalContext.skills || globalContext.company || globalContext.portfolioUrl || globalContext.additionalInfo);
      
      const globalContextString = hasGlobalContext ? `
---
GLOBAL CONTEXT (ABOUT THE SENDER):
The user has provided the following global context about themselves. You MUST use this information to hyper-personalize the email and write from their perspective:
- Name: ${globalContext.name || 'Not provided'}
- Role/Title: ${globalContext.role || 'Not provided'}
- Company/Agency: ${globalContext.company || 'Not provided'}
- Portfolio/LinkedIn: ${globalContext.portfolioUrl || 'Not provided'}
- Core Skills/Value Prop: ${globalContext.skills || 'Not provided'}
- Additional Info: ${globalContext.additionalInfo || 'Not provided'}
---
` : '';

      const systemInstruction = `You are an expert email copywriter and marketing strategist specializing in high-converting bulk email campaigns for job seekers and sales professionals. Generate an email template based on the user's prompt.
The user has the following variables available from their data: ${columns.map(c => `{{${c}}}`).join(', ')}.
${globalContextString}
CRITICAL INSTRUCTIONS:
1. PERSONALIZATION: Use the provided variables where appropriate to personalize the email. Do not invent variables that are not in the list.
2. SUBJECT LINE: Ensure the subject line is highly engaging, concise, and optimized for high open rates. Avoid spam trigger words. Use curiosity or clear value propositions.
3. CALL TO ACTION (CTA): Include a single, clear, and compelling Call to Action unless explicitly instructed otherwise. Make it obvious what the recipient should do next.
4. TONE & STYLE: The email MUST be written in a ${aiTone} tone. Match the style requested by the user. Keep paragraphs short and scannable.
5. TARGET AUDIENCE: The target audience is: ${aiAudience || 'General recipients'}. Tailor the language and value proposition specifically for them.
6. PRIMARY GOAL: The main objective of this email is: ${aiGoal || 'To engage the recipient'}. Ensure every sentence supports this goal.
7. CALL TO ACTION: The primary action you want the user to take is: ${aiCTA || 'Reply to this email'}. Make it clear and compelling.
8. FORMATTING: Return ONLY a valid JSON object with two keys: "subject" and "body".
9. HTML BODY: The "body" must be formatted with clean, responsive HTML (e.g., <p>, <br>, <strong>, <em>, <ul>, <li>, <a href="#">). Use semantic HTML. Do not use markdown blocks or backticks in the final output.
10. JOB SEEKER OPTIMIZATION: If the prompt is about job seeking, focus on demonstrating value, research about the company, and how the candidate's skills solve specific problems. Avoid generic "I'm looking for a job" language.
11. SALES OPTIMIZATION: If the prompt is about sales, focus on the "Problem-Agitate-Solve" framework or "Bridge-the-Gap". Focus on the recipient's pain points and the specific ROI of the solution.
12. BEST PRACTICES: Ensure the email follows bulk sending best practices (e.g., providing an unsubscribe option placeholder if appropriate, clear sender identity).`;

      const modelName = mode === 'deep' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: aiPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: {
                type: Type.STRING,
                description: "The generated email subject line"
              },
              body: {
                type: Type.STRING,
                description: "The generated email body in HTML format"
              }
            },
            required: ["subject", "body"]
          },
          maxOutputTokens: 2048,
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        setTemplate(prev => ({
          ...prev,
          subject: result.subject || prev.subject,
          body: result.body || prev.body
        }));
        setShowAiModal(false);
        setAiPrompt('');
      }
    } catch (error: any) {
      console.error('AI Generation failed:', error);
      alert(error.message || 'Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const insertVariable = (variable: string, field: 'subject' | 'body') => {
    const textToInsert = `{{${variable}}}`;
    let ref: HTMLInputElement | HTMLTextAreaElement | null = null;
    
    if (field === 'subject') {
      ref = subjectRef.current;
    } else if (field === 'body' && bodyContainerRef.current) {
      ref = bodyContainerRef.current.querySelector('textarea');
    }
    
    if (ref) {
      const start = ref.selectionStart || 0;
      const end = ref.selectionEnd || 0;
      const currentValue = template[field];
      
      const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
      
      setTemplate(prev => ({
        ...prev,
        [field]: newValue
      }));

      // Set cursor position after insertion
      setTimeout(() => {
        if (ref) {
          ref.focus();
          ref.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        }
      }, 0);
    } else {
      // Fallback if ref is not available
      setTemplate(prev => ({
        ...prev,
        [field]: template[field] + textToInsert
      }));
    }
  };

  const copySubject = () => {
    const rendered = replaceVars(template.subject, currentContact);
    navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStats = (text: string) => {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return { chars, words };
  };

  const bodyStats = getStats(template.body);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (files: File[]) => {
    let addedCount = 0;
    files.forEach(file => {
      // Basic size limit check (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newAttachment: Attachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64.split(',')[1] // only the base64 part
        };
        setTemplate(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), newAttachment]
        }));
        addedCount++;
        if (addedCount === files.length) {
          toast.success(`Successfully attached ${files.length} file${files.length > 1 ? 's' : ''}`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index)
    }));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border-2 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:hidden">
        <div className="flex bg-zinc-100 p-1 border-2 border-black">
          <button 
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all ${viewMode === 'editor' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
          >
            Editor
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-black text-white' : 'text-zinc-500 hover:text-black'}`}
          >
            Preview
          </button>
        </div>
        <div className="text-[10px] font-mono font-bold text-primary flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          MAGIC SYNC
        </div>
      </div>

      <div className={`grid grid-cols-1 ${viewMode === 'split' ? 'lg:grid-cols-2' : ''} gap-6`}>
        
        {/* Editor */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none flex flex-col h-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4 border-b-2 border-black bg-secondary">
              <div>
                <CardTitle className="text-xl font-heading font-black uppercase text-black">2. Compose Email</CardTitle>
                <CardDescription className="text-xs font-mono text-black">Write your email or use AI to generate one.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none text-purple-600 border-2 border-black bg-white hover:bg-purple-50 hover:text-purple-700 font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => setShowAiModal(true)}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  AI Assist
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none border-2 border-black bg-white font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => setShowLoadModal(true)}
                >
                  <FolderOpen className="w-3 h-3 mr-1.5" />
                  Load
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 sm:flex-none border-2 border-black bg-white font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => setShowSaveModal(true)}
                >
                  <Save className="w-3 h-3 mr-1.5" />
                  Save
                </Button>
                {columns.includes('Icebreaker') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none text-amber-600 border-2 border-black bg-white hover:bg-amber-50 hover:text-amber-700 font-mono font-bold uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => insertVariable('Icebreaker', 'body')}
                  >
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Insert Icebreaker
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject" className="text-xs font-mono font-black uppercase text-black tracking-wider">Subject Line</Label>
                  <Select onValueChange={(val: string) => insertVariable(val, 'subject')}>
                    <SelectTrigger className="w-[160px] h-8 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-[10px] font-mono font-bold uppercase">
                      <SelectValue placeholder="Insert Variable" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black rounded-none">
                      {columns.length > 0 ? columns.map(col => (
                        <SelectItem key={col} value={col} className="text-[10px] font-mono">{`{{${col}}}`}</SelectItem>
                      )) : (
                        <div className="p-2 text-[10px] font-mono text-muted-foreground italic">No variables</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Input 
                  id="subject"
                  ref={subjectRef}
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  placeholder="e.g., Hello {{FirstName}}, special offer inside!"
                  className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body" className="text-xs font-mono font-black uppercase text-black tracking-wider flex items-center gap-2">
                    <File className="w-3 h-3" />
                    Email Body (HTML supported)
                  </Label>
                  <Select onValueChange={(val: string) => insertVariable(val, 'body')}>
                    <SelectTrigger className="w-[160px] h-8 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-[10px] font-mono font-bold uppercase">
                      <SelectValue placeholder="Insert Variable" />
                    </SelectTrigger>
                    <SelectContent className="border-2 border-black rounded-none">
                      {columns.length > 0 ? columns.map(col => (
                        <SelectItem key={col} value={col} className="text-[10px] font-mono">{`{{${col}}}`}</SelectItem>
                      )) : (
                        <div className="p-2 text-[10px] font-mono text-muted-foreground italic">No variables</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div ref={bodyContainerRef} className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white min-h-[300px] overflow-hidden flex flex-col">
                  <Editor
                    value={template.body}
                    onValueChange={code => setTemplate({ ...template, body: code })}
                    highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
                    padding={10}
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 14,
                      minHeight: '300px',
                    }}
                    className="focus:outline-none flex-1"
                  />
                  <div className="bg-zinc-50 border-t-2 border-black p-2 flex justify-between items-center text-[10px] font-mono font-bold uppercase text-zinc-500">
                    <div className="flex gap-4">
                      <span>{bodyStats.words} Words</span>
                      <span>{bodyStats.chars} Characters</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Live Sync Active
                    </div>
                  </div>
                </div>
              </div>

              <DeliverabilityScore subject={template.subject} body={template.body} />

              <div className="space-y-2">
                <Label className="text-xs font-mono font-black uppercase text-black tracking-wider">Attachments</Label>
                <div 
                  className={`border-4 border-dashed rounded-none p-8 transition-all duration-300 flex flex-col items-center justify-center space-y-4 relative group ${
                    isDragging 
                      ? 'border-primary bg-primary/10 scale-[1.02] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' 
                      : 'border-black bg-zinc-50 hover:bg-zinc-100'
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className={`p-4 rounded-full border-2 border-black transition-transform duration-300 ${isDragging ? 'bg-primary text-white scale-110 rotate-12' : 'bg-white text-zinc-400'}`}>
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-heading font-black text-black uppercase tracking-tight">
                      {isDragging ? 'Drop to Upload!' : 'Drag & Drop Attachments'}
                    </p>
                    <p className="text-xs font-mono text-zinc-500 mt-1">
                      {isDragging ? 'Release your files now' : 'Supports PDF, Images, and more (Max 5MB)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-8 bg-black/10" />
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">OR</span>
                    <div className="h-[2px] w-8 bg-black/10" />
                  </div>
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="font-heading uppercase font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all bg-white text-black hover:bg-zinc-100 h-12 px-8"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Browse Local Files
                  </Button>
                  <input 
                    id="file-upload"
                    type="file" 
                    multiple 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>

                {template.attachments && template.attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {template.attachments.map((file, idx) => {
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div key={idx} className="group relative flex flex-col border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform">
                          <div className="aspect-video w-full bg-zinc-100 border-b-2 border-black flex items-center justify-center overflow-hidden relative">
                            {isImage ? (
                              <img 
                                src={`data:${file.type};base64,${file.data}`} 
                                alt={file.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-black">
                                {file.type.includes('pdf') ? <FileText className="w-10 h-10" /> : 
                                 file.type.includes('zip') || file.type.includes('rar') ? <FileArchive className="w-10 h-10" /> :
                                 file.type.includes('html') || file.type.includes('javascript') ? <FileCode className="w-10 h-10" /> :
                                 file.type.includes('csv') || file.type.includes('excel') || file.type.includes('spreadsheet') ? <FileSpreadsheet className="w-10 h-10" /> :
                                 file.type.includes('audio') ? <FileAudio className="w-10 h-10" /> :
                                 file.type.includes('video') ? <FileVideo className="w-10 h-10" /> :
                                 <File className="w-10 h-10" />}
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 border-2 border-black rounded-none font-mono text-[8px] uppercase bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                          </div>
                          <div className="p-3 bg-white space-y-1">
                            <p className="text-[10px] font-mono font-black truncate text-black uppercase leading-tight">{file.name}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                                {file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024).toFixed(1)} KB
                              </span>
                              <button 
                                onClick={() => {
                                  removeAttachment(idx);
                                  toast.info(`Removed ${file.name}`);
                                }}
                                className="p-1 hover:bg-red-500 hover:text-white text-red-600 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0.5"
                                title="Remove attachment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none flex flex-col h-full sticky top-24">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-black bg-secondary gap-4">
              <div>
                <CardTitle className="text-xl font-heading font-black uppercase text-black">Live Preview</CardTitle>
                <CardDescription className="text-xs font-mono text-black">See how your email looks with real data.</CardDescription>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {contacts.length > 1 && (
                  <div className="flex items-center bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <button 
                      onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                      disabled={previewIndex === 0}
                      className="p-1.5 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-white border-r-2 border-black"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase">
                      {previewIndex + 1} / {contacts.length}
                    </div>
                    <button 
                      onClick={() => setPreviewIndex(prev => Math.min(contacts.length - 1, prev + 1))}
                      disabled={previewIndex === contacts.length - 1}
                      className="p-1.5 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-white border-l-2 border-black"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white border-2 border-black text-[10px] font-mono font-bold text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  MAGIC SYNC
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1 overflow-y-auto">
              {currentContact ? (
                <div className="border-2 border-black rounded-none overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full min-h-[500px]">
                  <div className="p-4 border-b-2 border-black bg-zinc-50 space-y-2">
                    <div className="text-xs font-mono text-black flex items-center">
                      <span className="w-16 font-black uppercase opacity-50">From:</span>
                      <span className="font-bold truncate">
                        {config.fromName ? `${config.fromName} <${config.fromEmail || 'noreply@mailstream.io'}>` : (config.fromEmail || 'noreply@mailstream.io')}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-black flex items-center">
                      <span className="w-16 font-black uppercase opacity-50">To:</span>
                      <span className="font-bold truncate bg-zinc-200 px-1.5 py-0.5 rounded-sm">{currentContact[template.emailColumn] || '[Email Address]'}</span>
                    </div>
                    <div className="text-xs font-mono text-black flex items-center group/subject">
                      <span className="w-16 font-black uppercase opacity-50">Subject:</span>
                      <span className="font-bold truncate flex-1">{replaceVars(template.subject, currentContact) || '[Subject]'}</span>
                      <button 
                        onClick={copySubject}
                        className="p-1 hover:bg-zinc-200 opacity-0 group-hover/subject:opacity-100 transition-opacity"
                        title="Copy Subject"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-6 bg-white overflow-hidden relative group/preview flex flex-col">
                    <button 
                      onClick={copyToClipboard}
                      className="absolute top-4 right-4 p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all opacity-0 group-hover/preview:opacity-100 z-10"
                      title="Copy Rendered HTML"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
                      <div 
                        className="prose prose-sm max-w-none font-sans email-preview-content break-words whitespace-pre-wrap prose-headings:font-heading prose-headings:font-bold prose-headings:text-black prose-a:text-primary prose-a:font-bold prose-a:underline prose-p:text-foreground prose-strong:font-bold prose-strong:text-black prose-ul:list-disc prose-ol:list-decimal prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: replaceVars(template.body, currentContact) || '<span class="text-muted-foreground italic font-mono">Email body preview...</span>' }}
                      />
                      
                      {template.attachments && template.attachments.length > 0 && (
                        <div className="mt-12 pt-6 border-t-2 border-black border-dashed">
                          <p className="text-xs font-mono font-black uppercase text-black mb-4 flex items-center">
                            <Paperclip className="w-3 h-3 mr-2" />
                            Attachments ({template.attachments.length})
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {template.attachments.map((file, idx) => {
                              const isImage = file.type.startsWith('image/');
                              return (
                                <div key={idx} className="flex flex-col border-2 border-black bg-zinc-50 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  {isImage ? (
                                    <div className="aspect-square w-full border-b-2 border-black overflow-hidden">
                                      <img 
                                        src={`data:${file.type};base64,${file.data}`} 
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  ) : (
                                    <div className="aspect-square w-full border-b-2 border-black flex items-center justify-center bg-white">
                                      {file.type.includes('pdf') ? <FileText className="w-8 h-8 text-black" /> : 
                                       file.type.includes('zip') || file.type.includes('rar') ? <FileArchive className="w-8 h-8 text-black" /> :
                                       file.type.includes('html') || file.type.includes('javascript') ? <FileCode className="w-8 h-8 text-black" /> :
                                       file.type.includes('csv') || file.type.includes('excel') || file.type.includes('spreadsheet') ? <FileSpreadsheet className="w-8 h-8 text-black" /> :
                                       file.type.includes('audio') ? <FileAudio className="w-8 h-8 text-black" /> :
                                       file.type.includes('video') ? <FileVideo className="w-8 h-8 text-black" /> :
                                       <File className="w-8 h-8 text-black" />}
                                    </div>
                                  )}
                                  <div className="p-2 flex flex-col min-w-0">
                                    <span className="text-[9px] font-mono font-bold truncate text-black uppercase" title={file.name}>{file.name}</span>
                                    <span className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5">
                                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-4 border-dashed border-black bg-secondary rounded-none p-8 text-center text-black font-mono font-bold uppercase flex flex-col items-center justify-center min-h-[400px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <UploadCloud className="w-12 h-12 mb-4 opacity-20" />
                  Upload data in Step 1 to see a live preview.
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>

      {/* Save Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-black uppercase">Save Template</DialogTitle>
            <DialogDescription className="font-mono text-black">Give your template a name to save it for later.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name (e.g., Welcome Email)"
              autoFocus
              className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={!templateName.trim()}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Modal */}
      <Dialog open={showLoadModal} onOpenChange={setShowLoadModal}>
        <DialogContent className="max-w-md border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-black uppercase">Load Template</DialogTitle>
            <DialogDescription className="font-mono text-black">Select a previously saved template.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-2 space-y-2">
            {savedTemplates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm font-mono">No saved templates found.</p>
            ) : (
              savedTemplates.map(t => (
                <div 
                  key={t.id} 
                  className="flex items-center justify-between p-3 border-2 border-black rounded-none hover:bg-secondary transition-colors cursor-pointer group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => loadTemplate(t)}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="font-heading font-bold text-black text-sm uppercase">{t.name}</div>
                    <div className="text-xs font-mono text-black truncate mt-0.5">{t.subject}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-white hover:bg-red-600 ml-2 border-2 border-transparent hover:border-black rounded-none"
                    onClick={(e) => deleteTemplate(t.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent className="w-[95vw] sm:max-w-[95vw] lg:max-w-[1000px] h-[90vh] max-h-[850px] border-4 border-black rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col p-0 overflow-hidden bg-white">
          <div className="p-4 sm:p-6 border-b-4 border-black bg-[#E4E3E0] shrink-0">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3 font-heading font-black text-black uppercase text-xl sm:text-2xl tracking-tight">
                <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <span>AI Template Assistant</span>
              </DialogTitle>
              <DialogDescription className="font-mono text-black text-sm mt-3 font-medium">
                Describe the email you want to write. The AI will use your available variables:
                <div className="mt-3 flex flex-wrap gap-2">
                  {columns.length > 0 ? columns.map(c => <Badge key={c} variant="secondary" className="font-mono text-xs bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none px-2 py-1">{`{{${c}}}`}</Badge>) : <span className="text-xs italic">None loaded</span>}
                </div>
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-hidden bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-full min-w-0">
                {/* Left Column: Parameters & Presets */}
                <div className="lg:col-span-5 flex flex-col gap-8 min-w-0">
                  
                  {/* Parameters Section */}
                  <div className="bg-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-0">
                    <h3 className="font-heading font-black uppercase text-base border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
                      <Layout className="w-5 h-5" />
                      Email Parameters
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-mono font-bold text-black uppercase tracking-wider">Email Tone</Label>
                        <Select value={aiTone} onValueChange={setAiTone}>
                          <SelectTrigger className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white h-10 text-sm font-mono w-full focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Select Tone" />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-black rounded-none font-mono">
                            <SelectItem value="professional">Professional & Formal</SelectItem>
                            <SelectItem value="friendly">Friendly & Casual</SelectItem>
                            <SelectItem value="urgent">Urgent & Direct</SelectItem>
                            <SelectItem value="persuasive">Persuasive & Sales-y</SelectItem>
                            <SelectItem value="educational">Educational & Informative</SelectItem>
                            <SelectItem value="humorous">Humorous & Witty</SelectItem>
                            <SelectItem value="empathetic">Empathetic & Caring</SelectItem>
                            <SelectItem value="minimalist">Short & Sweet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-mono font-bold text-black uppercase tracking-wider">Target Audience</Label>
                        <Input 
                          value={aiAudience}
                          onChange={(e) => setAiAudience(e.target.value)}
                          placeholder="e.g., Small business owners..."
                          className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white h-10 text-sm font-mono w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-mono font-bold text-black uppercase tracking-wider">Primary Goal</Label>
                        <Input 
                          value={aiGoal}
                          onChange={(e) => setAiGoal(e.target.value)}
                          placeholder="e.g., Book a demo..."
                          className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white h-10 text-sm font-mono w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-mono font-bold text-black uppercase tracking-wider">Call to Action</Label>
                        <Input 
                          value={aiCTA}
                          onChange={(e) => setAiCTA(e.target.value)}
                          placeholder="e.g., Reply 'YES'..."
                          className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white h-10 text-sm font-mono w-full focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Presets Section */}
                  <div className="bg-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-0">
                    <h3 className="font-heading font-black uppercase text-base border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Quick Presets
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      <button 
                        onClick={() => {
                          setAiPrompt("Write a personalized cold email for a {{JobTitle}} position at {{Company}}. I noticed their recent work on {{RecentProject}} and I want to explain how my background in {{Skill}} can help them scale. Focus on being a 'Value-Add' rather than a 'Job-Seeker'.");
                          setAiTone("professional");
                          setAiAudience("Hiring Manager / Team Lead");
                          setAiGoal("Get an interview or introductory call");
                          setAiCTA("Schedule a 15-minute chat");
                        }}
                        className="text-left p-3 border-2 border-black bg-white hover:bg-[#E4E3E0] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group"
                      >
                        <div className="font-heading font-bold text-sm text-black uppercase tracking-tight">Value-Based Application</div>
                        <div className="text-xs text-zinc-700 mt-1 font-mono line-clamp-2">Cold email for a job position focusing on value-add and recent projects.</div>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setAiPrompt("Write a cold sales email to {{Name}} at {{Company}}. Use the 'Problem-Agitate-Solve' framework. Focus on the pain point of {{PainPoint}} and how our solution {{Product}} can solve it. Mention their competitor {{Competitor}} if applicable.");
                          setAiTone("persuasive");
                          setAiAudience("Decision Maker / CEO");
                          setAiGoal("Book a demo");
                          setAiCTA("Book a 15-minute demo");
                        }}
                        className="text-left p-3 border-2 border-black bg-white hover:bg-[#E4E3E0] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group"
                      >
                        <div className="font-heading font-bold text-sm text-black uppercase tracking-tight">PAS Sales Framework</div>
                        <div className="text-xs text-zinc-700 mt-1 font-mono line-clamp-2">Problem-Agitate-Solve cold outreach targeting decision makers.</div>
                      </button>

                      <button 
                        onClick={() => {
                          setAiPrompt("Write a short, punchy 'Bump' email for a previous outreach that went unanswered. Keep it under 50 words. Ask if {{PainPoint}} is still a priority for them this quarter.");
                          setAiTone("minimalist");
                          setAiAudience("Previous Prospect");
                          setAiGoal("Re-engage prospect");
                          setAiCTA("Simple reply");
                        }}
                        className="text-left p-3 border-2 border-black bg-white hover:bg-[#E4E3E0] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group"
                      >
                        <div className="font-heading font-bold text-sm text-black uppercase tracking-tight">The 'Bump' Follow-up</div>
                        <div className="text-xs text-zinc-700 mt-1 font-mono line-clamp-2">Short, punchy follow-up for unanswered outreach.</div>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: AI Prompt Editor */}
                <div className="lg:col-span-7 flex flex-col h-full min-h-[400px] lg:min-h-0 min-w-0">
                  <div className="flex-1 flex flex-col h-full min-w-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="px-4 py-3 border-b-2 border-black bg-[#E4E3E0] flex items-center justify-between shrink-0">
                      <Label className="text-xs font-heading font-black text-black uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Prompt Editor
                      </Label>
                      <Badge variant="secondary" className="bg-white text-black text-[10px] font-mono rounded-none border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Markdown Supported</Badge>
                    </div>
                    <div className="flex-1 relative group min-w-0 bg-zinc-50">
                      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
                        <Editor
                          value={aiPrompt}
                          onValueChange={code => setAiPrompt(code)}
                          highlight={code => Prism.highlight(code, Prism.languages.markdown, 'markdown')}
                          padding={20}
                          disabled={isGenerating}
                          style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 14,
                            lineHeight: 1.6,
                            minHeight: '100%',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: '#000',
                          }}
                          className="focus:outline-none min-h-full w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t-4 border-black bg-[#E4E3E0] shrink-0">
            <DialogFooter className="flex-col sm:flex-row gap-4 sm:justify-between w-full">
              <Button 
                variant="outline" 
                onClick={() => setShowAiModal(false)}
                disabled={isGenerating}
                className="border-2 border-black rounded-none font-mono font-bold uppercase text-xs w-full sm:w-auto bg-white hover:bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Cancel
              </Button>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button 
                  variant="secondary"
                  onClick={() => generateWithAi('quick')}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-white border-2 border-black text-black hover:bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 rounded-none font-heading font-bold uppercase w-full sm:w-auto transition-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-primary" />}
                  Quick Draft
                </Button>
                <Button 
                  onClick={() => generateWithAi('deep')}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="bg-primary hover:bg-primary/90 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 rounded-none font-heading font-bold uppercase w-full sm:w-auto transition-all"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                  Deep Think
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
