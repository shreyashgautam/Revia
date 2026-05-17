import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Clock3, Eye, MessageCircleHeart, Moon, Smartphone, Sparkles, Zap } from 'lucide-react';
import { ChatSimulationSettings } from '../types';

interface SettingsProps {
  settings: ChatSimulationSettings;
  onUpdate: (settings: ChatSimulationSettings) => void;
}

const DEFAULT_SETTINGS: ChatSimulationSettings = {
  realisticMode: true,
  minResponseDelaySeconds: 10,
  maxResponseDelaySeconds: 20,
  autoScrollToLatest: true,
  spontaneousEnabled: true,
  spontaneousFrequency: 'medium',
  lateNightMessagesEnabled: false,
};

const FREQUENCY_OPTIONS: { value: ChatSimulationSettings['spontaneousFrequency']; label: string; description: string }[] = [
  { value: 'low', label: 'Rare', description: 'Very occasional, feels like a random thought' },
  { value: 'medium', label: 'Natural', description: 'Balanced, like a real friend texting' },
  { value: 'high', label: 'Active', description: 'More frequent, emotionally present' },
];

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
        {/* Chat Simulation Card */}
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
                max={30}
                step={1}
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
                max={30}
                step={1}
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

        {/* Spontaneous Messages Card */}
        <Card className="glass border-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <MessageCircleHeart className="w-5 h-5 text-pink-400" />
              <CardTitle>Spontaneous Messages</CardTitle>
            </div>
            <CardDescription>
              Let your personas reach out to you naturally — like a real person who suddenly thought of you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Spontaneous Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Personas will send you messages on their own when they feel it's natural.
                </p>
              </div>
              <Switch
                checked={settings.spontaneousEnabled}
                onCheckedChange={(checked) => updateSetting('spontaneousEnabled', checked)}
              />
            </div>

            {settings.spontaneousEnabled && (
              <>
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Message Frequency
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateSetting('spontaneousFrequency', option.value)}
                        className={`
                          relative rounded-xl border px-4 py-3 text-left transition-all duration-200
                          ${settings.spontaneousFrequency === option.value
                            ? 'border-pink-400/50 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'}
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className={`w-3 h-3 ${settings.spontaneousFrequency === option.value ? 'text-pink-400' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-semibold ${settings.spontaneousFrequency === option.value ? 'text-pink-300' : 'text-foreground'}`}>
                            {option.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">{option.description}</p>
                        {settings.spontaneousFrequency === option.value && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      Late Night Messages
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow personas to send soft, emotional messages late at night (10pm–1am).
                    </p>
                  </div>
                  <Switch
                    checked={settings.lateNightMessagesEnabled}
                    onCheckedChange={(checked) => updateSetting('lateNightMessagesEnabled', checked)}
                  />
                </div>

                <div className="rounded-2xl border border-pink-500/10 bg-pink-500/5 px-4 py-4 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-pink-300/80 flex items-center gap-2">
                    <MessageCircleHeart className="w-4 h-4" />
                    How spontaneous messages work
                  </p>
                  <ul className="space-y-1.5 text-xs leading-relaxed pl-6">
                    <li>Messages trigger only after natural inactivity periods (2+ hours)</li>
                    <li>Each message references past conversations and emotional context</li>
                    <li>Anti-repetition system ensures no message feels scripted or repeated</li>
                    <li>Time-of-day awareness adjusts tone (soft at night, playful in morning)</li>
                    <li>Cooldown prevents multiple spontaneous messages within 4 hours</li>
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversation Comfort Card */}
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
              Realtime delivery uses the selected persona cadence together with your reply timing window, so messages can feel live while still landing after a human-like pause.
            </div>
          </CardContent>
        </Card>

        {/* Quick Reset Card */}
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
