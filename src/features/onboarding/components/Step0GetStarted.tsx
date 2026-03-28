import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, FileSpreadsheet, Mail, Sparkles, ArrowRight, Briefcase, TrendingUp, ShieldCheck, FileText, Shuffle } from 'lucide-react';

interface Props {
  onNext: () => void;
}

export function Step0GetStarted({ onNext }: Props) {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-heading font-black uppercase tracking-tighter text-black">
          Master Your <span className="text-primary">Outreach</span>
        </h1>
        <p className="text-xl font-mono text-zinc-600 max-w-2xl mx-auto">
          A zero-cost, local-first CRM and email automation engine for developers, job seekers, and founders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-primary border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Briefcase className="text-white w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">100% Free & Local</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            No subscriptions. No database costs. Your contacts and templates are stored securely in your browser's local storage.
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-secondary border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <TrendingUp className="text-black w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">Native Mailto</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            Send emails directly through your native email client (Gmail, Outlook, Apple Mail) using the built-in mailto engine. No SMTP required.
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-zinc-100 border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">Global Brain AI</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            Set your context once. The AI automatically uses your profile to hyper-personalize every outreach email you generate.
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-green-100 border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="text-green-700 w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">Deliverability Score</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            Analyze your emails for spam triggers, length, and link density to ensure your messages land in the primary inbox.
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-blue-100 border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Shuffle className="text-blue-700 w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">Spintax Support</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            Use {'{Hi|Hello|Hey}'} syntax to generate unique variations of your emails, bypassing spam filters and improving open rates.
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 bg-amber-100 border-2 border-black flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="text-amber-700 w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-heading font-bold uppercase">AI Icebreakers</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-mono text-zinc-600">
            Automatically generate highly personalized opening sentences for each contact based on their specific data (Company, Role, etc.).
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-heading font-black uppercase">Spreadsheet Format Demo</h2>
        </div>
        
        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
          <div className="bg-zinc-100 border-b-4 border-black p-2 flex gap-2 overflow-x-auto">
            <div className="px-4 py-1 bg-white border-2 border-black font-mono text-xs font-bold uppercase">Recipients.csv</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b-2 border-black">
                  <th className="p-3 border-r-2 border-black bg-zinc-200">Email</th>
                  <th className="p-3 border-r-2 border-black">FirstName</th>
                  <th className="p-3 border-r-2 border-black">Company</th>
                  <th className="p-3 border-r-2 border-black">Role</th>
                  <th className="p-3">RecentProject</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b-2 border-black">
                  <td className="p-3 border-r-2 border-black font-bold">jane@techcorp.com</td>
                  <td className="p-3 border-r-2 border-black">Jane</td>
                  <td className="p-3 border-r-2 border-black">TechCorp</td>
                  <td className="p-3 border-r-2 border-black">Engineering Manager</td>
                  <td className="p-3">New AI Platform</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="p-3 border-r-2 border-black font-bold">mike@startup.io</td>
                  <td className="p-3 border-r-2 border-black">Mike</td>
                  <td className="p-3 border-r-2 border-black">StartupIO</td>
                  <td className="p-3 border-r-2 border-black">Founder</td>
                  <td className="p-3">Series A Funding</td>
                </tr>
                <tr>
                  <td className="p-3 border-r-2 border-black font-bold">sarah@global.com</td>
                  <td className="p-3 border-r-2 border-black">Sarah</td>
                  <td className="p-3 border-r-2 border-black">Global Inc</td>
                  <td className="p-3 border-r-2 border-black">Head of Sales</td>
                  <td className="p-3">Q1 Expansion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs font-mono text-zinc-500 italic">
          * Pro-tip: Include custom columns like "RecentProject" to make your AI-generated emails hyper-personalized.
        </p>
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          onClick={onNext}
          size="lg"
          className="h-16 px-12 text-xl font-heading font-black uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-none"
        >
          Get Started <ArrowRight className="ml-4 w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
