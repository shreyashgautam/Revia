import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Clock3, Eye, Smartphone } from 'lucide-react';
import { ChatSimulationSettings } from '../types';

interface SettingsProps {
  settings: ChatSimulationSettings;
  onUpdate: (settings: ChatSimulationSettings) => void;
}

const DEFAULT_SETTINGS: ChatSimulationSettings = {
  realisticMode: true,
  minResponseDelaySeconds: 60,
  maxResponseDelaySeconds: 120,
  autoScrollToLatest: true,
};

export default function Settings({ settings, onUpdate }: SettingsProps) {
  const updateSetting = <K extends keyof ChatSimulationSettings>(
    key: K,
    value: ChatSimulationSettings[K]
  ) => {
    const nextSettings = {
      ...settings,
      [key]: value,
    };

    if (key === 'minResponseDelaySeconds' && nextSettings.maxResponseDelaySeconds < nextSettings.minResponseDelaySeconds) {
      nextSettings.maxResponseDelaySeconds = nextSettings.minResponseDelaySeconds;
    }

    if (key === 'maxResponseDelaySeconds' && nextSettings.minResponseDelaySeconds > nextSettings.maxResponseDelaySeconds) {
      nextSettings.minResponseDelaySeconds = nextSettings.maxResponseDelaySeconds;
    }

    onUpdate(nextSettings);
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto h-full overflow-auto">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Control how real and how patient your companions feel in chat.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-neon-blue" />
              <CardTitle>Chat Simulation</CardTitle>
            </div>
            <CardDescription>Make replies feel more human, less instant, and closer to the persona cadence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Realistic Reply Timing</Label>
                <p className="text-xs text-muted-foreground">Delay replies in a more human way instead of showing them instantly.</p>
              </div>
              <Switch
                checked={settings.realisticMode}
                onCheckedChange={(checked) => updateSetting('realisticMode', checked)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Minimum Reply Delay</Label>
                  <p className="text-xs text-muted-foreground">Shortest wait before a persona sends a response.</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{settings.minResponseDelaySeconds}s</span>
              </div>
              <input
                type="range"
                value={settings.minResponseDelaySeconds}
                min={5}
                max={180}
                step={5}
                onChange={(event) => updateSetting('minResponseDelaySeconds', Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maximum Reply Delay</Label>
                  <p className="text-xs text-muted-foreground">Upper timing window for more natural delayed replies.</p>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{settings.maxResponseDelaySeconds}s</span>
              </div>
              <input
                type="range"
                value={settings.maxResponseDelaySeconds}
                min={settings.minResponseDelaySeconds}
                max={240}
                step={5}
                onChange={(event) => updateSetting('maxResponseDelaySeconds', Number(event.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-scroll To Latest</Label>
                <p className="text-xs text-muted-foreground">Stay pinned to the newest messages only when you want to.</p>
              </div>
              <Switch
                checked={settings.autoScrollToLatest}
                onCheckedChange={(checked) => updateSetting('autoScrollToLatest', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-neon-purple" />
              <CardTitle>Conversation Comfort</CardTitle>
            </div>
            <CardDescription>These controls tune how much the UI stays anchored while you read older messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-muted-foreground">
              When auto-scroll is off, the chat will stop jumping to the bottom while you are reading older messages. New replies still appear once you go back near the latest messages.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-muted-foreground">
              Realistic timing uses the selected persona cadence together with your reply timing window, so fast personas answer sooner and slow personas take longer within your chosen range.
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-neon-pink" />
              <CardTitle>Quick Reset</CardTitle>
            </div>
            <CardDescription>Go back to the default delayed reply behavior anytime.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock3 className="w-4 h-4" />
              Default range keeps replies feeling human instead of instant.
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => onUpdate(DEFAULT_SETTINGS)}>
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
