import React from 'react';
import { SmtpConfig } from '../../../types';
import { Settings, ShieldAlert, Server, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  config: SmtpConfig;
  setConfig: React.Dispatch<React.SetStateAction<SmtpConfig>>;
  isGoogleConnected: boolean;
}

export function Step3Settings({ config, setConfig, isGoogleConnected }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setConfig(prev => ({ ...prev, mock: checked }));
  };

  const handleMethodChange = (value: string) => {
    setConfig(prev => ({ ...prev, method: value as 'smtp' | 'gmail' }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-6 mb-6">
        <div>
          <h2 className="text-2xl font-heading font-black uppercase text-black">3. Sending Settings</h2>
          <p className="text-sm font-mono text-zinc-500 mt-1">Choose your sending method and configure preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue={config.method} onValueChange={handleMethodChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 border-2 border-black rounded-none h-12 p-1 bg-zinc-100 mb-8">
              <TabsTrigger 
                value="smtp" 
                className="font-heading font-bold uppercase data-[state=active]:bg-black data-[state=active]:text-white rounded-none transition-all"
              >
                <Server className="w-4 h-4 mr-2" />
                SMTP Server
              </TabsTrigger>
              <TabsTrigger 
                value="gmail" 
                className="font-heading font-bold uppercase data-[state=active]:bg-black data-[state=active]:text-white rounded-none transition-all"
              >
                <Mail className="w-4 h-4 mr-2" />
                Google OAuth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="smtp" className="space-y-6 mt-0">
              <Alert className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rounded-none">
                <Server className="h-4 w-4 text-black" />
                <AlertTitle className="text-black font-heading font-bold uppercase">SMTP Configuration</AlertTitle>
                <AlertDescription className="text-black font-mono">
                  Enter your SMTP credentials to send emails. For testing without sending real emails, enable "Mock Sending Mode" below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="host" className="text-xs font-mono font-black uppercase text-black">SMTP Host</Label>
                  <Input 
                    id="host"
                    type="text" 
                    name="host"
                    value={config.host}
                    onChange={handleChange}
                    placeholder="smtp.gmail.com"
                    disabled={config.mock}
                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port" className="text-xs font-mono font-black uppercase text-black">SMTP Port</Label>
                  <Input 
                    id="port"
                    type="number" 
                    name="port"
                    value={config.port}
                    onChange={handleChange}
                    placeholder="465"
                    disabled={config.mock}
                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user" className="text-xs font-mono font-black uppercase text-black">Username / Email</Label>
                  <Input 
                    id="user"
                    type="text" 
                    name="user"
                    value={config.user}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    disabled={config.mock}
                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pass" className="text-xs font-mono font-black uppercase text-black">Password / App Password</Label>
                  <Input 
                    id="pass"
                    type="password" 
                    name="pass"
                    value={config.pass}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={config.mock}
                    className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gmail" className="space-y-6 mt-0">
              <Alert className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black rounded-none ${!isGoogleConnected ? 'border-amber-500' : 'border-green-500'}`}>
                <Mail className="h-4 w-4 text-black" />
                <AlertTitle className="text-black font-heading font-bold uppercase">Google OAuth Sending</AlertTitle>
                <AlertDescription className="text-black font-mono">
                  Send emails directly through your connected Google account. This is more secure and reliable than SMTP.
                </AlertDescription>
              </Alert>

              {!isGoogleConnected ? (
                <div className="bg-amber-50 border-2 border-amber-500 p-6 flex flex-col items-center text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                  <AlertTriangle className="w-12 h-12 text-amber-500" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-black uppercase text-amber-800">Google Account Not Connected</h3>
                    <p className="text-xs font-mono text-amber-700">Go back to Step 1 to connect your Google account before using this method.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-500 p-6 flex flex-col items-center text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-black uppercase text-green-800">Connected & Ready</h3>
                    <p className="text-xs font-mono text-green-700">Emails will be sent from your connected Google account.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="h-0.5 bg-black my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fromName" className="text-xs font-mono font-black uppercase text-black">Sender Name</Label>
              <Input 
                id="fromName"
                type="text" 
                name="fromName"
                value={config.fromName}
                onChange={handleChange}
                placeholder="Acme Corp"
                className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail" className="text-xs font-mono font-black uppercase text-black">Sender Email (Optional)</Label>
              <Input 
                id="fromEmail"
                type="text" 
                name="fromEmail"
                value={config.fromEmail}
                onChange={handleChange}
                placeholder="Leave blank to use Username"
                className="border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between rounded-none border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-secondary">
            <div className="space-y-0.5">
              <Label className="text-base font-heading font-bold text-black uppercase">Mock Sending Mode</Label>
              <p className="text-[10px] font-mono text-black">
                Test automation without sending real emails.
              </p>
            </div>
            <Switch 
              checked={config.mock}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          
          <div className="space-y-4 border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
            <Label htmlFor="delay" className="text-xs font-mono font-black uppercase text-black">Delay between emails (seconds)</Label>
            <Input 
              id="delay"
              type="number" 
              name="delay"
              value={config.delay}
              onChange={handleChange}
              min="0"
              step="0.5"
              className="w-full border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <p className="text-[10px] font-mono text-zinc-500">Helps prevent rate limiting and spam filtering.</p>
            
            {config.delay < 1 && !config.mock && (
              <Alert className={`${config.delay === 0 ? 'bg-[#FF6B6B]' : 'bg-[#FFD93D]'} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none mt-4 text-black`}>
                <ShieldAlert className="h-4 w-4 text-black" />
                <AlertTitle className="text-xs font-black uppercase tracking-tight">
                  {config.delay === 0 ? "Critical: No Delay" : "Warning: Low Delay"}
                </AlertTitle>
                <AlertDescription className="text-[10px] font-mono font-bold">
                  {config.delay === 0 
                    ? "Sending emails with no delay is highly likely to get your IP blacklisted or trigger SMTP rate limits. Use with extreme caution."
                    : "A delay of less than 1 second may trigger SMTP rate limits or spam filters. We recommend at least 1-2 seconds for safety."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
