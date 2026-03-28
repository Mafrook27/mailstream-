import React, { useState, useEffect, useRef } from 'react';
import { Contact, EmailTemplate, SmtpConfig, SendLog } from '../../../types';
import { Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw, Loader2, Database, Calendar, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { processTemplate } from '../../../lib/templateUtils';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Props {
  contacts: Contact[];
  template: EmailTemplate;
  config: SmtpConfig;
  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;
}

export function Step4Send({ contacts, template, config, isGoogleConnected, setIsGoogleConnected }: Props) {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'paused' | 'completed' | 'scheduled'>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [subProgress, setSubProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [trackingSpreadsheetId, setTrackingSpreadsheetId] = useState('');
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  
  // Use refs to keep track of state inside async loop without stale closures
  const statusRef = useRef(status);
  const currentIndexRef = useRef(currentIndex);
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (status === 'idle' && contacts.length > 0) {
      setLogs(contacts.map((c, i) => ({
        id: `log-${i}`,
        email: c[template.emailColumn] || 'Unknown',
        status: 'pending',
        timestamp: 0
      })));
    }
  }, [contacts, template.emailColumn, status]);

  const scheduleCampaign = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select a valid date and time for scheduling.');
      return;
    }

    const scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    if (isNaN(scheduledTimestamp) || scheduledTimestamp <= Date.now()) {
      toast.error('Scheduled time must be in the future.');
      return;
    }

    try {
      const response = await fetch('/api/schedule-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledTime: scheduledTimestamp,
          contacts,
          template,
          config
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule campaign');
      }

      setStatus('scheduled');
      toast.success('Campaign scheduled successfully!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const sendEmail = async (contact: Contact): Promise<{ success: boolean; error?: string }> => {
    const to = contact[template.emailColumn];
    if (!to) return { success: false, error: 'Missing email address' };

    const subject = processTemplate(template.subject, contact);
    const html = processTemplate(template.body, contact).replace(/\n/g, '<br/>');

    try {
      const endpoint = config.method === 'gmail' ? '/api/send-gmail' : '/api/send-smtp';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: config,
          to,
          subject,
          html,
          attachments: template.attachments,
          mock: config.mock
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const startSending = async () => {
    setStatus('sending');

    if (!toastIdRef.current) {
      toastIdRef.current = toast.loading('Starting to send emails...');
    }

    // Loop through remaining contacts
    while (currentIndexRef.current < contacts.length && statusRef.current === 'sending') {
      const idx = currentIndexRef.current;
      const contact = contacts[idx];
      const email = contact[template.emailColumn] || 'Unknown';
      
      setCurrentTask(`Preparing email for ${email}...`);
      setSubProgress(10);
      
      toast.loading(`Sending email ${idx + 1} of ${contacts.length}`, { id: toastIdRef.current });
      
      setSubProgress(30);
      const result = await sendEmail(contact);
      setSubProgress(100);
      
      if (!result.success) {
        toast.error(`Email ${idx + 1} failed to send: ${result.error}`, { duration: 5000 });
      }
      
      setLogs(prev => {
        const newLogs = [...prev];
        newLogs[idx] = {
          ...newLogs[idx],
          status: result.success ? 'success' : 'error',
          error: result.error,
          timestamp: Date.now()
        };
        return newLogs;
      });

      // Log to Google Sheets if enabled
      if (isTrackingEnabled && trackingSpreadsheetId) {
        try {
          await fetch('/api/sheets/append', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              spreadsheetId: trackingSpreadsheetId,
              range: 'Results!A1',
              values: [
                new Date().toISOString(),
                email,
                result.success ? 'SUCCESS' : 'FAILED',
                result.error || '',
                template.subject
              ]
            })
          });
        } catch (err) {
          console.error('Failed to log to Google Sheets:', err);
        }
      }

      setCurrentIndex(idx + 1);

      // Check if we are done
      if (idx + 1 >= contacts.length) {
        setStatus('completed');
        setCurrentTask('All emails sent successfully.');
        setSubProgress(100);
        toast.success(`Completed sending ${contacts.length} emails`, { id: toastIdRef.current });
        toastIdRef.current = null;
        break;
      }

      // Delay if configured and still sending
      if (config.delay > 0 && statusRef.current === 'sending') {
        const totalDelay = config.delay * 1000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < totalDelay && statusRef.current === 'sending') {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, (totalDelay - elapsed) / 1000);
          const progress = (elapsed / totalDelay) * 100;
          
          setSubProgress(progress);
          setCurrentTask(`Cooldown: Next email in ${remaining.toFixed(1)}s`);
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }
  };

  const pauseSending = () => {
    setStatus('paused');
    if (toastIdRef.current) {
      toast.info(`Sending paused at email ${currentIndexRef.current}`, { id: toastIdRef.current });
      toastIdRef.current = null;
    }
  };

  const resetSending = () => {
    setStatus('idle');
    setCurrentIndex(0);
    setLogs([]);
    setSubProgress(0);
    setCurrentTask('');
    setScheduledDate('');
    setScheduledTime('');
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsGoogleConnected(false);
      setIsTrackingEnabled(false);
      toast.success('Disconnected from Google');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const successCount = logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const pendingCount = contacts.length - successCount - errorCount;
  const progressPercent = contacts.length > 0 ? Math.round((currentIndex / contacts.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black bg-secondary">
          <div>
            <CardTitle className="text-xl font-heading font-black uppercase text-black">4. Review & Send</CardTitle>
            <CardDescription className="mt-1.5 text-xs font-mono text-black">
              {config.mock ? (
                <span className="text-amber-600 font-bold flex items-center uppercase">
                  <AlertTriangle className="w-4 h-4 mr-1.5" /> Mock Mode is ON. No real emails will be sent.
                </span>
              ) : (
                "Ready to send emails to your contacts."
              )}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {isGoogleConnected && (
              <div className="flex items-center space-x-2 mr-4 bg-white border-2 border-black p-1 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Database className="w-4 h-4 text-green-600" />
                <label className="text-[10px] font-mono font-black uppercase text-black flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isTrackingEnabled} 
                    onChange={(e) => setIsTrackingEnabled(e.target.checked)}
                    className="mr-2 border-2 border-black rounded-none"
                  />
                  Track in Sheets
                </label>
                {isTrackingEnabled && (
                  <input 
                    placeholder="Sheet ID"
                    value={trackingSpreadsheetId}
                    onChange={(e) => setTrackingSpreadsheetId(e.target.value)}
                    className="w-24 text-[9px] font-mono border-l-2 border-black pl-2 focus:outline-none"
                  />
                )}
                <button 
                  onClick={handleGoogleDisconnect}
                  className="text-[9px] font-mono text-zinc-400 hover:text-black underline ml-2"
                  title="Disconnect Google Account"
                >
                  (X)
                </button>
              </div>
            )}
            {status === 'idle' || status === 'paused' ? (
              <div className="flex gap-2 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white border-2 border-black p-1 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Calendar className="w-4 h-4 text-primary" />
                  <Input 
                    type="date" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-6 w-32 border-none focus-visible:ring-0 text-[10px] font-mono p-0"
                  />
                  <Input 
                    type="time" 
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-6 w-24 border-none focus-visible:ring-0 text-[10px] font-mono p-0"
                  />
                  <Button
                    onClick={scheduleCampaign}
                    disabled={contacts.length === 0 || !template.emailColumn || !scheduledDate || !scheduledTime}
                    variant="ghost"
                    className="h-6 px-2 text-[10px] font-mono font-bold uppercase hover:bg-primary hover:text-white"
                  >
                    Schedule
                  </Button>
                </div>
                <Button
                  onClick={startSending}
                  disabled={contacts.length === 0 || !template.emailColumn}
                  className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white border-2 border-black font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {status === 'paused' ? 'Resume' : 'Send Now'}
                </Button>
              </div>
            ) : status === 'sending' ? (
              <Button
                onClick={pauseSending}
                variant="outline"
                className="flex-1 md:flex-none border-2 border-black bg-white text-amber-600 hover:bg-amber-50 font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : status === 'scheduled' ? (
              <Button
                onClick={resetSending}
                variant="outline"
                className="flex-1 md:flex-none border-2 border-black bg-white text-primary hover:bg-primary/10 font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            ) : (
              <Button
                onClick={resetSending}
                variant="outline"
                className="flex-1 md:flex-none border-2 border-black bg-white font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          
          {/* Progress Section */}
          <div className="space-y-6">
            {status === 'scheduled' ? (
              <Alert className="border-2 border-black bg-green-50 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertTitle className="font-heading font-black uppercase text-green-800">Campaign Scheduled</AlertTitle>
                <AlertDescription className="font-mono text-xs text-green-700 mt-2">
                  Your campaign has been queued and will be sent automatically on {scheduledDate} at {scheduledTime}.
                  You can safely close this window.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-mono font-black uppercase text-black tracking-wider">
                    <span>Overall Progress</span>
                    <span className="text-primary">{progressPercent}% ({currentIndex} / {contacts.length})</span>
                  </div>
                  <Progress value={progressPercent} className="h-6 border-2 border-black rounded-none bg-secondary" />
                </div>

                {status === 'sending' && (
                  <div className="space-y-3 p-4 border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between text-[10px] font-mono font-black uppercase text-black tracking-wider">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        {currentTask}
                      </span>
                      <span className="text-primary">{Math.round(subProgress)}%</span>
                    </div>
                    <Progress value={subProgress} className="h-3 border-2 border-black rounded-none bg-white" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-3xl font-heading font-bold text-black">{pendingCount}</div>
                    <div className="text-[10px] font-mono text-black uppercase tracking-wider font-bold mt-1">Pending</div>
                  </div>
                  <div className="bg-green-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-3xl font-heading font-bold text-green-700">{successCount}</div>
                    <div className="text-[10px] font-mono text-green-700 uppercase tracking-wider font-bold mt-1">Sent</div>
                  </div>
                  <div className="bg-red-100 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-3xl font-heading font-bold text-red-700">{errorCount}</div>
                    <div className="text-[10px] font-mono text-red-700 uppercase tracking-wider font-bold mt-1">Failed</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logs Table */}
          <div className="border-2 border-black bg-white overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-secondary px-4 py-3 border-b-2 border-black flex justify-between items-center">
              <span className="font-mono font-bold text-sm text-black uppercase">Sending Logs</span>
              {logs.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLogs(contacts.map((c, i) => ({
                      id: i.toString(),
                      email: c[template.emailColumn] as string || 'Unknown',
                      status: 'pending'
                    })));
                  }}
                  className="h-7 text-[10px] font-mono font-bold uppercase border-2 border-black bg-white hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset Logs
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-[400px]">
                {logs.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 text-sm flex flex-col items-center justify-center font-mono uppercase font-bold">
                    <Clock className="w-8 h-8 text-zinc-300 mb-3" />
                    Logs will appear here once sending starts.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50 sticky top-0 z-10 border-b-2 border-black">
                      <TableRow>
                        <TableHead className="w-[120px] font-mono font-black uppercase text-black text-xs whitespace-nowrap">Status</TableHead>
                        <TableHead className="font-mono font-black uppercase text-black text-xs whitespace-nowrap">Email</TableHead>
                        <TableHead className="font-mono font-black uppercase text-black text-xs whitespace-nowrap">Details</TableHead>
                        <TableHead className="font-mono font-black uppercase text-black text-xs whitespace-nowrap text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log, index) => {
                        const contact = contacts[index];
                        const subject = contact ? processTemplate(template.subject, contact) : '';
                        const body = contact ? processTemplate(template.body, contact) : '';
                        const mailtoLink = `mailto:${log.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                        return (
                        <TableRow key={log.id} className="border-b border-black/10">
                          <TableCell className="whitespace-nowrap">
                            {log.status === 'success' ? (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-2 border-black rounded-none font-mono uppercase text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3 mr-1" /> Sent
                              </Badge>
                            ) : log.status === 'error' ? (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-2 border-black rounded-none font-mono uppercase text-[10px] font-bold">
                                <XCircle className="w-3 h-3 mr-1" /> Failed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-secondary text-black border-2 border-black rounded-none font-mono uppercase text-[10px] font-bold">
                                <Clock className="w-3 h-3 mr-1" /> Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-black font-mono text-xs whitespace-nowrap">{log.email}</TableCell>
                          <TableCell className="text-[10px] font-mono whitespace-nowrap">
                            {log.status === 'error' && <span className="text-red-600 font-bold">{log.error}</span>}
                            {log.status === 'success' && <span className="text-zinc-400 font-bold uppercase">OK</span>}
                            {log.status === 'pending' && <span className="text-zinc-400 font-bold">-</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <a 
                              href={mailtoLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-black px-2 py-1 text-[10px] font-mono font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                              onClick={() => {
                                setLogs(prev => {
                                  const newLogs = [...prev];
                                  newLogs[index] = { ...newLogs[index], status: 'success', timestamp: Date.now() };
                                  return newLogs;
                                });
                              }}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Mailto
                            </a>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
