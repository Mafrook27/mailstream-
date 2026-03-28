import React, { useRef, useMemo, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, AlertCircle, AlertTriangle, Trash2, Database, Link2, RefreshCw, Loader2, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';
import { Contact } from '../../../types';
import { Button } from '@/components/ui/button';
import { GoogleGenAI } from '@google/genai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  columns: string[];
  setColumns: (columns: string[]) => void;
  emailColumn: string;
  setEmailColumn: (col: string) => void;
  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;
}

export function Step1Data({ 
  contacts, 
  setContacts, 
  columns, 
  setColumns, 
  emailColumn, 
  setEmailColumn,
  isGoogleConnected,
  setIsGoogleConnected
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('A1:Z100');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [isGeneratingIcebreakers, setIsGeneratingIcebreakers] = useState(false);
  const [icebreakerProgress, setIcebreakerProgress] = useState(0);

  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        const data = await res.json();
        setIsGoogleConnected(data.connected);
      } catch (err) {
        console.error('Error checking Google status:', err);
      }
    };
    checkGoogleStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        setIsGoogleConnected(true);
        toast.success('Connected to Google Sheets!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setIsGoogleConnected]);

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err) {
      toast.error('Failed to get Google Auth URL');
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsGoogleConnected(false);
      toast.success('Disconnected from Google');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const fetchMetadata = async () => {
    if (!spreadsheetId) return;
    setIsLoadingMetadata(true);
    try {
      const res = await fetch(`/api/sheets/metadata?spreadsheetId=${spreadsheetId}`);
      if (!res.ok) throw new Error('Failed to fetch metadata');
      const data = await res.json();
      setSheetNames(data.sheets || []);
      if (data.sheets && data.sheets.length > 0) {
        setSelectedSheet(data.sheets[0]);
      }
    } catch (err) {
      console.error('Error fetching sheet metadata:', err);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const fetchSheetData = async () => {
    if (!spreadsheetId) {
      toast.error('Please enter a Spreadsheet ID');
      return;
    }
    if (!selectedSheet) {
      toast.error('Please select a sheet');
      return;
    }
    setIsLoadingSheet(true);
    try {
      const fullRange = `${selectedSheet}!${range}`;
      const res = await fetch(`/api/sheets/data?spreadsheetId=${spreadsheetId}&range=${encodeURIComponent(fullRange)}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const rows = await res.json();
      
      if (rows && rows.length > 0) {
        const headers = rows[0];
        const data = rows.slice(1).map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index];
          });
          return obj;
        });

        setColumns(headers);
        setContacts(data);
        
        const possibleEmailCols = headers.filter((c: string) => c.toLowerCase().includes('email'));
        if (possibleEmailCols.length > 0) {
          setEmailColumn(possibleEmailCols[0]);
        } else {
          setEmailColumn(headers[0]);
        }
        toast.success(`Imported ${data.length} contacts from Google Sheets`);
      }
    } catch (err) {
      toast.error('Failed to fetch Google Sheet data. Make sure the ID is correct and you have access.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const parsedData = results.data as Contact[];
          const cols = Object.keys(parsedData[0]);
          setColumns(cols);
          setContacts(parsedData);
          
          // Auto-detect email column
          const possibleEmailCols = cols.filter(c => c.toLowerCase().includes('email'));
          if (possibleEmailCols.length > 0) {
            setEmailColumn(possibleEmailCols[0]);
          } else {
            setEmailColumn(cols[0]);
          }
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV file.');
      }
    });
  };

  const invalidContacts = useMemo(() => {
    if (!emailColumn || !contacts.length) return [];
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return contacts.filter(c => {
      const email = c[emailColumn];
      return !email || !emailRegex.test(String(email).trim());
    });
  }, [contacts, emailColumn]);

  const removeInvalidContacts = () => {
    if (!emailColumn) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validContacts = contacts.filter(c => {
      const email = c[emailColumn];
      return email && emailRegex.test(String(email).trim());
    });
    setContacts(validContacts);
  };

  const clearData = () => {
    setContacts([]);
    setColumns([]);
    setEmailColumn('');
    setSpreadsheetId('');
    setSheetNames([]);
    setSelectedSheet('');
    toast.success('Data cleared successfully');
  };

  const generateIcebreakers = async () => {
    if (contacts.length === 0) return;
    
    setIsGeneratingIcebreakers(true);
    setIcebreakerProgress(0);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing.');
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const newContacts = [...contacts];
      
      // If the column doesn't exist, add it
      if (!columns.includes('Icebreaker')) {
        setColumns([...columns, 'Icebreaker']);
      }

      for (let i = 0; i < newContacts.length; i++) {
        const contact = newContacts[i];
        
        // Skip if already has an icebreaker
        if (contact['Icebreaker']) {
          setIcebreakerProgress(Math.round(((i + 1) / newContacts.length) * 100));
          continue;
        }

        const contactDataStr = Object.entries(contact)
          .filter(([key, val]) => val && key.toLowerCase() !== 'email' && key !== 'Icebreaker')
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');

        if (!contactDataStr) {
           newContacts[i]['Icebreaker'] = "Hope you're having a great week!";
           setIcebreakerProgress(Math.round(((i + 1) / newContacts.length) * 100));
           continue;
        }

        const prompt = `Generate a single, highly personalized, and casual opening sentence (an "icebreaker") for an email to this person based on their data. 
        Data: ${contactDataStr}
        Rules:
        1. Keep it under 15 words.
        2. Make it sound natural and human, not like an AI wrote it.
        3. Do NOT include greetings like "Hi [Name]," or "Dear [Name],". Just the sentence itself.
        4. Focus on complimenting their company, role, or recent project if available.
        5. Return ONLY the sentence, nothing else.`;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          
          if (response.text) {
            newContacts[i]['Icebreaker'] = response.text.replace(/^["']|["']$/g, '').trim();
          }
        } catch (err) {
          console.error(`Failed to generate icebreaker for row ${i}:`, err);
          newContacts[i]['Icebreaker'] = "Hope you're having a great week!";
        }
        
        setIcebreakerProgress(Math.round(((i + 1) / newContacts.length) * 100));
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      }
      
      setContacts(newContacts);
      toast.success('Successfully generated AI Icebreakers for all contacts!');
      
    } catch (error: any) {
      console.error('Icebreaker generation failed:', error);
      toast.error(error.message || 'Failed to generate icebreakers.');
    } finally {
      setIsGeneratingIcebreakers(false);
      setIcebreakerProgress(0);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-6 mb-6">
        <div>
          <h2 className="text-2xl font-heading font-black uppercase text-black">1. Import Contacts</h2>
          <p className="text-sm font-mono text-zinc-500 mt-1">Upload a CSV file containing your recipients' data.</p>
        </div>
        {contacts.length > 0 && (
          <Button 
            variant="outline" 
            onClick={clearData}
            className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-mono font-bold uppercase text-xs"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Data
          </Button>
        )}
      </div>

      {!contacts.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-black bg-secondary p-8 sm:p-16 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <UploadCloud className="w-12 h-12 sm:w-16 sm:h-16 text-black mb-4" />
            <h3 className="text-lg sm:text-xl font-heading font-bold text-black uppercase">Upload CSV File</h3>
            <p className="text-xs sm:text-sm font-mono text-black mt-1 mb-4">Drag and drop or click to browse</p>
            <Button 
              variant="outline" 
              size="sm"
              className="border-2 border-black font-mono font-bold uppercase text-[10px] bg-white hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                const csvContent = "Email,FirstName,LastName,Company,Role,RecentProject\njohn.doe@example.com,John,Doe,Acme Corp,Engineering Manager,Project Phoenix\njane.smith@example.com,Jane,Smith,Globex,VP of Sales,Q3 Expansion\nalice.jones@example.com,Alice,Jones,Initech,Director of HR,Employee Wellness Program";
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", "sample_contacts.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Sample CSV
            </Button>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </div>

          <div className="border-4 border-black bg-white p-8 flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 border-2 border-black">
                <Database className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-xl font-heading font-black uppercase">Google Sheets</h3>
            </div>

            {!isGoogleConnected ? (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <p className="text-sm font-mono text-zinc-600">
                  Connect your Google account to import contacts directly from your spreadsheets.
                </p>
                <Button 
                  onClick={handleGoogleConnect}
                  className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-heading font-bold uppercase"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Google Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black uppercase text-zinc-500">Spreadsheet ID</label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      onBlur={fetchMetadata}
                      className="border-2 border-black rounded-none font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={fetchMetadata}
                      disabled={isLoadingMetadata || !spreadsheetId}
                      className="border-2 border-black rounded-none shrink-0"
                    >
                      {isLoadingMetadata ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-400">Paste ID and click refresh to load sheets</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase text-zinc-500">Select Sheet</label>
                    <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={sheetNames.length === 0}>
                      <SelectTrigger className="border-2 border-black rounded-none font-mono text-xs h-9 bg-white">
                        <SelectValue placeholder={sheetNames.length === 0 ? "No sheets" : "Select sheet"} />
                      </SelectTrigger>
                      <SelectContent className="border-2 border-black rounded-none">
                        {sheetNames.map(name => (
                          <SelectItem key={name} value={name} className="text-xs font-mono">{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase text-zinc-500">Range</label>
                    <Input 
                      placeholder="A1:Z100"
                      value={range}
                      onChange={(e) => setRange(e.target.value)}
                      className="border-2 border-black rounded-none font-mono text-xs h-9"
                    />
                  </div>
                </div>

                <Button 
                  onClick={fetchSheetData}
                  disabled={isLoadingSheet || !selectedSheet}
                  className="w-full bg-green-400 text-black hover:bg-green-500 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-heading font-bold uppercase"
                >
                  {isLoadingSheet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Import from Sheet
                </Button>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-green-600 uppercase flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                  </span>
                  <button 
                    onClick={handleGoogleDisconnect}
                    className="text-[10px] font-mono font-bold text-zinc-400 uppercase hover:text-black underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between bg-secondary p-4 sm:p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-4">
            <div className="flex items-center space-x-4">
              <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              <div>
                <p className="font-heading font-bold text-black uppercase text-base sm:text-lg">{contacts.length} contacts loaded</p>
                <p className="text-xs sm:text-sm font-mono text-black">{columns.length} columns detected</p>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="w-full sm:w-auto border-2 border-black font-mono font-bold uppercase"
              onClick={() => { setContacts([]); setColumns([]); }}
            >
              Upload different file
            </Button>
          </div>

          <div className="bg-amber-50 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-200 border-2 border-black shrink-0">
                <Sparkles className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h3 className="font-heading font-black uppercase text-amber-900 text-sm">AI Icebreaker Generator</h3>
                <p className="text-xs font-mono text-amber-800 mt-1 max-w-xl">
                  Automatically generate a highly personalized opening sentence for each contact based on their data (Company, Role, etc.). This adds a new <code className="bg-amber-200 px-1 font-bold">Icebreaker</code> column you can use in your template.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-col items-end gap-2">
              <Button 
                onClick={generateIcebreakers}
                disabled={isGeneratingIcebreakers || contacts.length === 0}
                className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-mono font-bold uppercase text-xs h-9"
              >
                {isGeneratingIcebreakers ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating ({icebreakerProgress}%)</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Icebreakers</>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-mono font-black uppercase text-black tracking-wider">
                Which column contains the recipient's email address?
              </label>
              <Select value={emailColumn} onValueChange={setEmailColumn}>
                <SelectTrigger className="w-full border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue placeholder="Select email column" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black rounded-none">
                  {columns.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!emailColumn.toLowerCase().includes('email') && (
                <p className="text-[10px] text-amber-600 flex items-center font-bold uppercase font-mono">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Double check that this column contains valid email addresses.
                </p>
              )}
            </div>

            {invalidContacts.length > 0 && (
              <Alert variant="destructive" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-red-50">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <AlertTitle className="font-heading font-bold uppercase text-red-600">Found {invalidContacts.length} invalid email{invalidContacts.length === 1 ? '' : 's'}</AlertTitle>
                    <AlertDescription className="font-mono text-xs text-red-600">
                      Missing or incorrectly formatted emails in "{emailColumn}".
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={removeInvalidContacts}
                  className="whitespace-nowrap bg-white text-black hover:bg-zinc-100 border-2 border-black font-mono font-bold uppercase"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Invalid
                </Button>
              </Alert>
            )}
          </div>

          <div className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
            <div className="bg-secondary px-4 py-3 border-b-2 border-black text-sm font-mono font-bold text-black uppercase flex items-center justify-between">
              <span>Data Preview (First 3 rows)</span>
              <Dialog open={showAllContacts} onOpenChange={setShowAllContacts}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-mono font-black uppercase border-2 border-black bg-white hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    View All {contacts.length}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-2 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="font-heading font-black uppercase text-black">All Contacts ({contacts.length})</DialogTitle>
                    <DialogDescription className="font-mono text-xs text-black">Preview of all imported data.</DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto border-2 border-black mt-4">
                    <Table>
                      <TableHeader className="bg-zinc-50 border-b-2 border-black sticky top-0 z-10">
                        <TableRow>
                          {columns.map(col => (
                            <TableHead key={col} className="font-mono font-black uppercase text-black text-xs whitespace-nowrap bg-zinc-50">{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact, idx) => {
                          const email = contact[emailColumn];
                          const isInvalid = !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
                          
                          return (
                            <TableRow key={idx} className={isInvalid ? 'bg-red-50/50 hover:bg-red-50/80' : ''}>
                              {columns.map(col => (
                                <TableCell key={col} className={`font-mono text-xs whitespace-nowrap ${col === emailColumn && isInvalid ? 'text-red-600 font-bold' : 'text-black'}`}>
                                  {contact[col]}
                                  {col === emailColumn && isInvalid && (
                                    <Badge variant="destructive" className="ml-2 border-2 border-black rounded-none font-mono uppercase text-[8px]">Invalid</Badge>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50 border-b-2 border-black">
                  <TableRow>
                    {columns.map(col => (
                      <TableHead key={col} className="font-mono font-black uppercase text-black text-xs whitespace-nowrap">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.slice(0, 3).map((contact, idx) => {
                    const email = contact[emailColumn];
                    const isInvalid = !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
                    
                    return (
                      <TableRow key={idx} className={isInvalid ? 'bg-red-50/50 hover:bg-red-50/80' : ''}>
                        {columns.map(col => (
                          <TableCell key={col} className={`font-mono text-xs whitespace-nowrap ${col === emailColumn && isInvalid ? 'text-red-600 font-bold' : 'text-black'}`}>
                            {contact[col]}
                            {col === emailColumn && isInvalid && (
                              <Badge variant="destructive" className="ml-2 border-2 border-black rounded-none font-mono uppercase text-[8px]">Invalid</Badge>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
