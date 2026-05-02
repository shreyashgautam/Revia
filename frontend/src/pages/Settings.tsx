import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Bell, Eye, Volume2, Globe, Shield, Smartphone } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto h-full overflow-auto">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Customize your experience and system preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Appearance Section */}
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-neon-purple" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>How the platform looks on your terminal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Force high-contrast nocturnal theme.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Neon Accents</Label>
                <p className="text-xs text-muted-foreground">Show glowing borders and aesthetic pulses.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Glassmorphism FX</Label>
                <p className="text-xs text-muted-foreground">Advanced backdrop blur for transparency.</p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>

        {/* System Simulation Section */}
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-neon-blue" />
              <CardTitle>AI Simulation Parameters</CardTitle>
            </div>
            <CardDescription>Adjust the realism of your companions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Realistic Mode</Label>
                <p className="text-xs text-muted-foreground">AI agents will simulate human errors and delays.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Hallucination Guard</Label>
                <p className="text-xs text-muted-foreground">Minimize imaginative responses for factual tasks.</p>
              </div>
              <Switch checked />
            </div>
            <div className="space-y-2">
              <Label>Core Personality Model</Label>
              <Select defaultValue="gpt-neuro">
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-white/10">
                  <SelectItem value="gpt-neuro">NeuroFlow 4.5 (Beta)</SelectItem>
                  <SelectItem value="claude-bio">BioSync v2</SelectItem>
                  <SelectItem value="deepmind-futura">DM Futura Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-neon-pink" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Stay connected with your agents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive real-time alerts.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Agent Ping</Label>
                <p className="text-xs text-muted-foreground">Allow agents to initiate conversations.</p>
              </div>
              <Switch checked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 p-4">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">Reset to Defaults</Button>
          <Button className="bg-neon-purple hover:bg-neon-purple/80 text-white">Save Configuration</Button>
        </div>
      </div>
    </div>
  );
}
