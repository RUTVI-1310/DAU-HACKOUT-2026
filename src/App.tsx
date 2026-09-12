import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, ArrowDownRight, ArrowRight, BatteryCharging, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, CloudSun, Gauge, History, LayoutDashboard, LogIn, LogOut, Menu, Pause, Play, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal, Sun, Thermometer, TrendingDown, User, UserRound, Wind, Wrench, X, Zap } from 'lucide-react';
import { AuthProvider, useAuth, DEMO_PERSONAS, type UserRole } from '@/lib/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

type AssetStatus = 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
type Risk = 'LOW' | 'MEDIUM' | 'HIGH';
type Priority = 'P1' | 'P2' | 'P3';
type AssetType = 'WIND' | 'SOLAR';
type WorkStatus = 'ALERT' | 'INSPECTION' | 'ASSIGNED' | 'RESOLVED';
type Scenario = 'normal' | 'bearing' | 'generator' | 'gearbox';

type Asset = {
  asset_id: string; type: AssetType; location: string; capacity: number; health: number;
  status: AssetStatus; risk: Risk; priority: Priority; currentPower: number; expectedPower: number;
  powerLost: number; revenueLossPerHour: number; probableIssue: string; recommendedAction: string;
  assignedTechnician: string; lastUpdated: string;
};
type WorkOrder = { id: string; assetId: string; issue: string; priority: Priority; status: WorkStatus; technician: string; scheduledDate: string; notes: string };

const assets: Asset[] = [
  { asset_id: 'WT-017', type: 'WIND', location: 'Kutch North · Gujarat', capacity: 2, health: 63, status: 'WARNING', risk: 'HIGH', priority: 'P1', currentPower: 1.6, expectedPower: 1.95, powerLost: .35, revenueLossPerHour: 2100, probableIssue: 'Bearing degradation', recommendedAction: 'Inspect drive-train bearing within 24 hours', assignedTechnician: 'Aarav Mehta', lastUpdated: '12 sec ago' },
  { asset_id: 'WT-004', type: 'WIND', location: 'Kutch North · Gujarat', capacity: 2, health: 91, status: 'HEALTHY', risk: 'LOW', priority: 'P3', currentPower: 1.87, expectedPower: 1.92, powerLost: .05, revenueLossPerHour: 300, probableIssue: 'No material anomaly', recommendedAction: 'Continue normal monitoring', assignedTechnician: '—', lastUpdated: '2 min ago' },
  { asset_id: 'WT-021', type: 'WIND', location: 'Jaisalmer Ridge · Rajasthan', capacity: 2, health: 76, status: 'WATCH', risk: 'MEDIUM', priority: 'P2', currentPower: 1.72, expectedPower: 1.9, powerLost: .18, revenueLossPerHour: 1080, probableIssue: 'Early temperature drift', recommendedAction: 'Review nacelle cooling at next round', assignedTechnician: 'Mira Shah', lastUpdated: '4 min ago' },
  { asset_id: 'ST-008', type: 'SOLAR', location: 'Pavagada East · Karnataka', capacity: 2.5, health: 88, status: 'HEALTHY', risk: 'LOW', priority: 'P3', currentPower: 2.06, expectedPower: 2.22, powerLost: .16, revenueLossPerHour: 960, probableIssue: 'Moderate soiling', recommendedAction: 'Include in next cleaning route', assignedTechnician: '—', lastUpdated: '1 min ago' },
  { asset_id: 'ST-013', type: 'SOLAR', location: 'Rewa South · Madhya Pradesh', capacity: 2.5, health: 82, status: 'WATCH', risk: 'MEDIUM', priority: 'P2', currentPower: 1.94, expectedPower: 2.18, powerLost: .24, revenueLossPerHour: 1440, probableIssue: 'Panel temperature deviation', recommendedAction: 'Inspect inverter air intake', assignedTechnician: 'Kabir Rao', lastUpdated: '3 min ago' },
  { asset_id: 'ST-022', type: 'SOLAR', location: 'Kamuthi · Tamil Nadu', capacity: 2.5, health: 96, status: 'HEALTHY', risk: 'LOW', priority: 'P3', currentPower: 2.3, expectedPower: 2.34, powerLost: .04, revenueLossPerHour: 240, probableIssue: 'No material anomaly', recommendedAction: 'Continue normal monitoring', assignedTechnician: '—', lastUpdated: '6 min ago' },
];

const activity = [
  { time: '09:42:16', title: 'WT-017 anomaly score crossed watch band', detail: 'Vibration +18% over rolling baseline', icon: AlertTriangle, tone: 'amber' },
  { time: '09:39:04', title: 'Inspection assigned to Aarav Mehta', detail: 'Bearing check · due 18 Jun', icon: UserRound, tone: 'teal' },
  { time: '09:33:51', title: 'ST-013 moved into watch status', detail: 'Power efficiency at 89.0%', icon: Sun, tone: 'blue' },
  { time: '09:18:22', title: 'WT-004 inspection resolved', detail: 'No action required after field check', icon: Check, tone: 'green' },
];

const initialOrders: WorkOrder[] = [
  { id: 'WO-284', assetId: 'WT-017', issue: 'Bearing degradation', priority: 'P1', status: 'ALERT', technician: 'Aarav Mehta', scheduledDate: '18 Jun 2025', notes: 'Verify vibration signature and grease condition.' },
  { id: 'WO-281', assetId: 'ST-013', issue: 'Panel temperature deviation', priority: 'P2', status: 'ASSIGNED', technician: 'Kabir Rao', scheduledDate: '20 Jun 2025', notes: 'Inspect inverter air intake and thermal path.' },
  { id: 'WO-279', assetId: 'WT-021', issue: 'Early temperature drift', priority: 'P2', status: 'INSPECTION', technician: 'Mira Shah', scheduledDate: '19 Jun 2025', notes: 'Review nacelle cooling telemetry.' },
  { id: 'WO-276', assetId: 'ST-008', issue: 'Moderate soiling', priority: 'P3', status: 'RESOLVED', technician: 'Rohan Das', scheduledDate: '16 Jun 2025', notes: 'Cleaning route completed.' },
];

const scenarioMeta: Record<Scenario, { label: string; issue: string; color: string }> = {
  normal: { label: 'Normal operation', issue: 'No material anomaly', color: 'teal' },
  bearing: { label: 'Bearing degradation', issue: 'Probable bearing degradation', color: 'amber' },
  generator: { label: 'Generator overheating', issue: 'Probable generator overheating', color: 'orange' },
  gearbox: { label: 'Gearbox instability', issue: 'Probable gearbox instability', color: 'red' },
};

function makeTelemetry(scenario: Scenario, tick: number) {
  const wave = Math.sin(tick / 2.7);
  const degraded = scenario !== 'normal';
  return {
    windSpeed: 11.1 + wave * .42,
    temperature: 64 + (scenario === 'generator' ? 10 + tick * .22 : scenario === 'bearing' ? tick * .12 : scenario === 'gearbox' ? 4 + Math.abs(wave) * 2 : wave),
    vibration: 3.1 + (scenario === 'bearing' ? tick * .26 : scenario === 'gearbox' ? 1.2 + Math.abs(wave) * 1.4 : 0) + wave * .16,
    rpm: 1501 - (scenario === 'bearing' ? tick * .9 : scenario === 'gearbox' ? wave * 48 : wave * 9),
    current: 28 + (scenario === 'generator' ? tick * .34 : wave * .6),
    powerOutput: 1.92 - (scenario === 'bearing' ? tick * .028 : scenario === 'generator' ? tick * .025 : scenario === 'gearbox' ? .18 + Math.abs(wave) * .25 : 0) + wave * .025,
    _degraded: degraded,
  };
}

const history = Array.from({ length: 18 }, (_, i) => ({ time: `${String(9 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`, health: 91 - Math.max(0, i - 5) * 2.2 + Math.sin(i) * 1.2, vibration: 3.1 + Math.max(0, i - 7) * .18, expected: 1.92, actual: 1.91 - Math.max(0, i - 7) * .025 }));

const DemoContext = createContext<{ scenario: Scenario; setScenario: (s: Scenario) => void; running: boolean; setRunning: (v: boolean) => void; tick: number; setTick: (v: number) => void } | null>(null);
function useDemo() { const value = useContext(DemoContext); if (!value) throw new Error('Demo context unavailable'); return value; }

const statusClass: Record<AssetStatus, string> = { HEALTHY: 'bg-emerald-100 text-emerald-800', WATCH: 'bg-sky-100 text-sky-800', WARNING: 'bg-amber-100 text-amber-900', CRITICAL: 'bg-red-100 text-red-800' };
const riskClass: Record<Risk, string> = { LOW: 'text-emerald-700', MEDIUM: 'text-amber-700', HIGH: 'text-red-700' };
const priorityClass: Record<Priority, string> = { P1: 'bg-red-100 text-red-800', P2: 'bg-amber-100 text-amber-900', P3: 'bg-slate-100 text-slate-600' };

function Badge({ children, className = '' }: { children: ReactNode; className?: string }) { return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold tracking-[.08em] ${className}`}>{children}</span>; }
function SectionTitle({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) { return <div className="mb-5 flex items-end justify-between gap-4"><div><div className="eyebrow text-muted-foreground">{eyebrow}</div><h2 className="mt-2 text-xl font-extrabold tracking-tight">{title}</h2>{detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}</div>{action}</div>; }
function Number({ value, unit }: { value: string; unit?: string }) { return <span className="mono text-2xl font-medium tracking-tight">{value}{unit && <small className="ml-1 text-xs text-muted-foreground">{unit}</small>}</span>; }

function UserProfileMenu() {
  const { user, currentRole, switchRole, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const roleColors: Record<UserRole, string> = {
    GRID_OPERATOR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    UTILITY_COMPANY: 'bg-sky-100 text-sky-800 border-sky-300',
    PLANT_OWNER: 'bg-amber-100 text-amber-900 border-amber-300',
    ENERGY_TRADER: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  const roleTitles: Record<UserRole, string> = {
    GRID_OPERATOR: 'Grid Operator',
    UTILITY_COMPANY: 'Utility Company',
    PLANT_OWNER: 'Plant Owner',
    ENERGY_TRADER: 'Energy Trader',
  };

  return (
    <div className="relative">
      <button
        data-testid="button-user-profile"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border bg-[hsl(var(--card))] px-2.5 py-1.5 transition hover:bg-[hsl(var(--muted))]"
      >
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-sm">
          {user?.initials || user?.avatarInitials || 'NS'}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-xs font-bold leading-tight">{user?.name || 'Neel Sharma'}</div>
          <div className="mono text-[10px] text-muted-foreground">{roleTitles[currentRole] || 'Grid Operator'}</div>
        </div>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="panel absolute right-0 top-12 z-50 w-72 p-4 shadow-2xl border fade-up">
            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-muted-foreground">Active Persona</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleColors[currentRole]}`}>
                  {roleTitles[currentRole]}
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-foreground">{user?.name}</div>
              <div className="mono text-xs text-muted-foreground truncate">{user?.email}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 size={12} className="text-[hsl(var(--primary))]" />
                <span className="truncate">{user?.organization}</span>
              </div>
            </div>

            <div className="py-3 border-b">
              <div className="eyebrow text-muted-foreground mb-2 flex items-center justify-between">
                <span>Switch Persona Role</span>
                <span className="text-[10px] text-[hsl(var(--primary))] font-bold">1-Click</span>
              </div>
              <div className="space-y-1">
                {(Object.entries(DEMO_PERSONAS) as [UserRole, typeof DEMO_PERSONAS[UserRole]][]).map(([rKey, persona]) => {
                  const isSelected = currentRole === rKey;
                  return (
                    <button
                      key={rKey}
                      data-testid={`menu-persona-${rKey.toLowerCase()}`}
                      onClick={() => {
                        switchRole(rKey);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        isSelected
                          ? 'bg-[hsl(var(--primary)/.1)] font-bold text-[hsl(var(--primary))]'
                          : 'text-foreground hover:bg-[hsl(var(--muted))]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate">{persona.name}</div>
                        <div className="mono text-[10px] text-muted-foreground truncate">{persona.title || persona.roleLabel}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={14} className="shrink-0 text-[hsl(var(--primary))]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 space-y-1">
              <button
                data-testid="button-menu-login"
                onClick={() => {
                  setOpen(false);
                  setLocation('/login');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[hsl(var(--muted))]"
              >
                <LogIn size={13} className="text-[hsl(var(--primary))]" />
                Switch Account / Login
              </button>
              <button
                data-testid="button-menu-register"
                onClick={() => {
                  setOpen(false);
                  setLocation('/register');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-[hsl(var(--muted))]"
              >
                <User size={13} className="text-[hsl(var(--accent))]" />
                Register New Role
              </button>
              <button
                data-testid="button-menu-logout"
                onClick={() => {
                  logout();
                  setOpen(false);
                  setLocation('/login');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { running, setRunning, scenario } = useDemo();
  const [mobileNav, setMobileNav] = useState(false);
  const nav = [
    { href: '/', label: 'Command center', icon: LayoutDashboard },
    { href: '/assets', label: 'Asset registry', icon: Wind },
    { href: '/maintenance', label: 'Maintenance queue', icon: ClipboardCheck, count: 3 },
    { href: '/simulation', label: 'Live simulation', icon: Activity },
    { href: '/playbook', label: 'Intelligence playbook', icon: BookOpen },
    { href: '/roadmap', label: 'Delivery roadmap', icon: ArrowRight },
  ];
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))]">
    <aside className={`fixed inset-y-0 left-0 z-30 w-[245px] bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] transition-transform md:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-3"><Link href="/" data-testid="link-brand" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"><Wind size={20} strokeWidth={2.5} /></span><span><strong className="block text-sm tracking-tight">verdant / ops</strong><small className="mono text-[9px] text-[hsl(var(--sidebar-foreground)/.6)]">RENEWABLE INTELLIGENCE</small></span></Link><button data-testid="button-close-nav" className="rounded-lg p-1 md:hidden" onClick={() => setMobileNav(false)}><X size={17} /></button></div>
      <div className="mt-10 px-3 eyebrow text-[hsl(var(--sidebar-foreground)/.45)]">Workspace</div>
      <nav className="mt-3 space-y-1">{nav.map(item => { const Icon = item.icon; const active = location === item.href || (item.href !== '/' && location.startsWith(item.href)); return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span className="flex-1">{item.label}</span>{item.count && <Badge className={active ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--sidebar-foreground)/.12)] text-[hsl(var(--sidebar-foreground)/.7)]'}>{item.count}</Badge>}</Link>; })}</nav>
      
      <div className="mt-6 px-3 eyebrow text-[hsl(var(--sidebar-foreground)/.45)]">Personas & Access</div>
      <nav className="mt-2 space-y-1">
        <Link href="/login" data-testid="link-nav-login" onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${location === '/login' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`}><LogIn size={15} /><span>Sign In / Switch</span></Link>
        <Link href="/register" data-testid="link-nav-register" onClick={() => setMobileNav(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs transition-colors ${location === '/register' ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.7)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`}><User size={15} /><span>Register Role</span></Link>
      </nav>

      <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.55)] p-3"><div className="eyebrow text-[hsl(var(--sidebar-foreground)/.5)]">Fleet pulse</div><div className="mt-3 flex items-center gap-2 text-xs"><span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />{running ? 'Simulation streaming' : 'Telemetry synced'}<span className="ml-auto mono text-[10px] text-[hsl(var(--sidebar-foreground)/.55)]">09:42</span></div><div className="mt-3 h-1 rounded-full bg-[hsl(var(--sidebar-foreground)/.12)]"><div className="h-1 w-[72%] rounded-full bg-[hsl(var(--accent))]" /></div></div>
    </aside>
    <div className="md:pl-[245px]"><header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b bg-[hsl(var(--background)/.9)] px-4 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button data-testid="button-open-nav" className="rounded-lg border p-2 md:hidden" onClick={() => setMobileNav(true)}><Menu size={18} /></button><div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />All systems nominal · 18 assets reporting</div><span className="eyebrow text-muted-foreground md:hidden">verdant / ops</span></div><div className="flex items-center gap-2"><button data-testid="button-global-simulation" onClick={() => setRunning(!running)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${running ? 'border-amber-300 bg-amber-50 text-amber-900' : 'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))]'}`}>{running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause demo' : 'Run demo'}<span className="hidden text-muted-foreground sm:inline">· {scenarioMeta[scenario].label}</span></button><button data-testid="button-settings" className="rounded-xl border bg-[hsl(var(--card))] p-2 hover:bg-[hsl(var(--muted))]"><Settings2 size={16} /></button><UserProfileMenu /></div></header><main className="shell-grid min-h-[calc(100dvh-68px)] px-4 py-7 md:px-8">{children}</main></div>
  </div>;
}

function MetricCard({ label, value, unit, delta, tone = 'teal', icon: Icon }: { label: string; value: string; unit?: string; delta?: string; tone?: 'teal'|'amber'|'red'|'blue'; icon: typeof Activity }) {
  const colors = { teal: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700' };
  return <div className="panel p-4"><div className="flex items-start justify-between"><div className="eyebrow text-muted-foreground">{label}</div><span className={`grid h-8 w-8 place-items-center rounded-lg ${colors[tone]}`}><Icon size={16} /></span></div><div className="mt-4 flex items-baseline gap-2"><Number value={value} unit={unit} />{delta && <span className={`text-xs font-bold ${tone === 'red' ? 'text-red-700' : 'text-emerald-700'}`}>{delta}</span>}</div></div>;
}

function Overview() {
  const { running, scenario } = useDemo();
  const { user, currentRole } = useAuth();
  const totalCapacity = assets.reduce((sum, a) => sum + a.capacity, 0);
  const totalPower = assets.reduce((sum, a) => sum + a.currentPower, 0);

  const roleSubtitles: Record<UserRole, string> = {
    GRID_OPERATOR: 'RLDC / SLDC Balancing: Real-time generation dispatch, spinning reserve, and frequency stability.',
    UTILITY_COMPANY: 'DISCOM Demand Coverage: Day-ahead capacity scheduling, contracted volume, and backup reserves.',
    PLANT_OWNER: 'Asset SCADA Telemetry: Predictive fault triage, turbine health scores, and loss mitigation.',
    ENERGY_TRADER: 'Day-Ahead Power Market: Schedule arbitrage, deviation settlement, and price exposure.',
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Neel';
  const orgName = user?.organization || 'Gujarat SLDC';

  return <div className="mx-auto max-w-[1450px] fade-up">
    <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="eyebrow text-[hsl(var(--primary))]">Monday · 16 June 2025 · {orgName}</div><h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-.04em] md:text-4xl">Good morning, {firstName}.<br /><span className="text-[hsl(var(--primary))]">{roleSubtitles[currentRole] || 'Here is what needs your attention.'}</span></h1></div><Link href="/simulation" data-testid="link-overview-simulation" className="group flex items-center gap-3 self-start rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))] shadow-lg shadow-emerald-900/10 lg:self-end">Open live demo <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Available capacity" value={`${totalCapacity.toFixed(1)}`} unit="MW" delta="+2.4%" icon={BatteryCharging} /><MetricCard label="Live generation" value={`${totalPower.toFixed(2)}`} unit="MW" delta="91.6% of forecast" icon={Activity} tone="blue" /><MetricCard label="Energy exposure / hr" value="₹6,120" delta="↑ ₹2,100 from WT-017" icon={TrendingDown} tone="red" /><MetricCard label="Assets needing action" value="03" unit="open" delta="1 priority one" icon={AlertTriangle} tone="amber" /></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><div className="panel overflow-hidden"><div className="flex items-start justify-between border-b p-5"><div><div className="eyebrow text-muted-foreground">Operating picture</div><h2 className="mt-2 text-lg font-bold">Generation vs expected</h2></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />Actual</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />Expected</span></div></div><div className="h-[260px] p-3 pt-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}><defs><linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(164 52% 30%)" stopOpacity=".22" /><stop offset="100%" stopColor="hsl(164 52% 30%)" stopOpacity="0" /></linearGradient></defs><CartesianGrid stroke="hsl(42 22% 84% / .7)" vertical={false} /><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(171 12% 42%)' }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10, fill: 'hsl(171 12% 42%)' }} tickLine={false} axisLine={false} domain={[0, 2.2]} unit=" MW" width={50} /><ChartTooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(42 22% 84%)', fontSize: 12, background: 'hsl(45 42% 98%)' }} /><Area type="monotone" dataKey="expected" stroke="hsl(37 83% 58%)" strokeWidth={2} strokeDasharray="5 4" fill="none" /><Area type="monotone" dataKey="actual" stroke="hsl(164 52% 30%)" strokeWidth={2.5} fill="url(#actualFill)" /></AreaChart></ResponsiveContainer></div><div className="flex items-center justify-between border-t px-5 py-3 text-xs text-muted-foreground"><span>Last 3 hours · fleet weighted</span><span className="mono text-[hsl(var(--primary))]">-8.4% gap</span></div></div>
      <div className="panel p-5"><SectionTitle eyebrow="Decision queue" title="What matters now" detail="Ranked by loss exposure and confidence." action={<Link href="/maintenance" data-testid="link-view-queue" className="text-xs font-bold text-[hsl(var(--primary))]">View queue</Link>} /><div className="space-y-3">{assets.filter(a => a.status !== 'HEALTHY').map(asset => <Link href={`/assets/${asset.asset_id}`} key={asset.asset_id} data-testid={`card-priority-${asset.asset_id}`} className="group flex items-center gap-3 rounded-xl border bg-[hsl(var(--background)/.55)] p-3 transition hover:-translate-y-0.5 hover:border-[hsl(var(--primary)/.35)]"><div className={`grid h-9 w-9 place-items-center rounded-lg ${asset.type === 'WIND' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}`}>{asset.type === 'WIND' ? <Wind size={17} /> : <Sun size={17} />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="mono text-sm">{asset.asset_id}</strong><Badge className={priorityClass[asset.priority]}>{asset.priority}</Badge></div><div className="mt-1 truncate text-xs text-muted-foreground">{asset.probableIssue} · ₹{asset.revenueLossPerHour.toLocaleString('en-IN')}/hr</div></div><ChevronRight size={16} className="text-muted-foreground transition group-hover:translate-x-1" /></Link>)}</div></div></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]"><div className="panel p-5"><SectionTitle eyebrow="Fleet registry" title="Asset overview" detail="Shared wind + solar operating model." action={<Link href="/assets" data-testid="link-browse-assets" className="text-xs font-bold text-[hsl(var(--primary))]">Browse all →</Link>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{assets.map(asset => <Link href={`/assets/${asset.asset_id}`} key={asset.asset_id} data-testid={`card-asset-${asset.asset_id}`} className="rounded-xl border p-3 hover:border-[hsl(var(--primary)/.4)]"><div className="flex items-center justify-between"><span className="flex items-center gap-2 mono text-xs font-medium">{asset.type === 'WIND' ? <Wind size={14} className="text-[hsl(var(--primary))]" /> : <Sun size={14} className="text-sky-600" />}{asset.asset_id}</span><span className={`h-2 w-2 rounded-full ${asset.status === 'HEALTHY' ? 'bg-emerald-500' : asset.status === 'WATCH' ? 'bg-sky-500' : 'bg-amber-500'}`} /></div><div className="mt-3 flex items-end justify-between"><div><div className="mono text-lg">{asset.health}<small className="text-[10px] text-muted-foreground"> / 100</small></div><div className="text-[10px] text-muted-foreground">{asset.location.split(' · ')[0]}</div></div><Badge className={statusClass[asset.status]}>{asset.status}</Badge></div><div className="mt-3 h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${asset.health > 85 ? 'bg-emerald-500' : asset.health > 70 ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${asset.health}%` }} /></div></Link>)}</div></div><div className="panel p-5"><SectionTitle eyebrow="Live activity" title="Signal trail" detail={running ? `Demo stream active · ${scenarioMeta[scenario].label}` : 'Most recent fleet events.'} /><div className="space-y-5">{activity.map((item, i) => { const Icon = item.icon; return <div className="relative flex gap-3" key={item.time}>{i < activity.length - 1 && <span className="absolute left-[9px] top-6 h-8 w-px bg-border" />}<span className={`relative grid h-5 w-5 shrink-0 place-items-center rounded-full ${item.tone === 'amber' ? 'bg-amber-100 text-amber-800' : item.tone === 'blue' ? 'bg-sky-100 text-sky-700' : item.tone === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700'}`}><Icon size={11} /></span><div className="min-w-0"><div className="flex justify-between gap-2"><strong className="text-xs">{item.title}</strong><span className="mono shrink-0 text-[9px] text-muted-foreground">{item.time}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div></div>; })}</div></div></div>
  </div>;
}

function AssetsPage() {
  const [query, setQuery] = useState(''); const [type, setType] = useState<'ALL' | AssetType>('ALL'); const [status, setStatus] = useState<'ALL' | AssetStatus>('ALL');
  const filtered = assets.filter(a => `${a.asset_id} ${a.location} ${a.probableIssue}`.toLowerCase().includes(query.toLowerCase()) && (type === 'ALL' || a.type === type) && (status === 'ALL' || a.status === status));
  return <div className="mx-auto max-w-[1450px] fade-up"><PageHead eyebrow="Asset registry" title="Every asset, one operating model." detail="Search the fleet, inspect health, and follow a signal into its recommended next action." /><div className="panel mb-5 flex flex-col gap-3 p-4 lg:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input data-testid="input-asset-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search asset ID, location, or issue" className="h-10 w-full rounded-lg border bg-[hsl(var(--background))] pl-9 pr-3 text-sm outline-none focus:border-[hsl(var(--primary))]" /></div><div className="flex gap-2 overflow-x-auto">{(['ALL', 'WIND', 'SOLAR'] as const).map(value => <button key={value} data-testid={`button-filter-type-${value.toLowerCase()}`} onClick={() => setType(value)} className={`rounded-lg border px-3 text-xs font-bold ${type === value ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--card))]'}`}>{value === 'ALL' ? 'All types' : value}</button>)}<select data-testid="select-asset-status" value={status} onChange={e => setStatus(e.target.value as 'ALL' | AssetStatus)} className="h-10 rounded-lg border bg-[hsl(var(--card))] px-3 text-xs"><option value="ALL">All status</option><option value="HEALTHY">Healthy</option><option value="WATCH">Watch</option><option value="WARNING">Warning</option></select></div></div><div className="panel overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b bg-[hsl(var(--muted)/.55)]"><tr>{['Asset', 'Location', 'Health', 'Status', 'Power now', 'Loss exposure', 'Action'].map(h => <th className="eyebrow px-5 py-4 text-muted-foreground" key={h}>{h}</th>)}</tr></thead><tbody>{filtered.map(asset => <tr key={asset.asset_id} className="border-b last:border-0 hover:bg-[hsl(var(--muted)/.35)]"><td className="px-5 py-4"><Link href={`/assets/${asset.asset_id}`} data-testid={`link-asset-${asset.asset_id}`} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${asset.type === 'WIND' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}`}>{asset.type === 'WIND' ? <Wind size={15} /> : <Sun size={15} />}</span><span><strong className="mono block text-sm">{asset.asset_id}</strong><small className="text-xs text-muted-foreground">{asset.type}</small></span></Link></td><td className="px-5 py-4 text-sm text-muted-foreground">{asset.location}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><span className="mono text-sm">{asset.health}</span><div className="h-1.5 w-16 rounded bg-muted"><div className="h-1.5 rounded bg-[hsl(var(--primary))]" style={{ width: `${asset.health}%` }} /></div></div></td><td className="px-5 py-4"><Badge className={statusClass[asset.status]}>{asset.status}</Badge></td><td className="mono px-5 py-4 text-sm">{asset.currentPower.toFixed(2)} <small className="text-muted-foreground">MW</small></td><td className="px-5 py-4"><span className={`mono text-sm ${asset.powerLost > .2 ? 'text-red-700' : 'text-foreground'}`}>₹{asset.revenueLossPerHour.toLocaleString('en-IN')}<small className="text-muted-foreground">/hr</small></span></td><td className="px-5 py-4"><Link href={`/assets/${asset.asset_id}`} data-testid={`button-inspect-${asset.asset_id}`} className="inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]">Inspect <ArrowRight size={13} /></Link></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState title="No assets match those filters" detail="Try a different ID, type, or status." action={() => { setQuery(''); setType('ALL'); setStatus('ALL'); }} actionLabel="Reset filters" />}</div></div>;
}

function PageHead({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) { return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="eyebrow text-[hsl(var(--primary))]">{eyebrow}</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{detail}</p></div>{action}</div>; }
function EmptyState({ title, detail, action, actionLabel }: { title: string; detail: string; action: () => void; actionLabel: string }) { return <div className="p-12 text-center"><CircleHelp className="mx-auto text-muted-foreground" size={28} /><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{detail}</p><button data-testid="button-empty-action" onClick={action} className="mt-4 rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))]">{actionLabel}</button></div>; }

function AssetDetail() {
  const params = useParams<{ id: string }>(); const asset = assets.find(a => a.asset_id === params.id) ?? assets[0]; const { scenario, running, tick } = useDemo();
  const live = asset.asset_id === 'WT-017' && running ? makeTelemetry(scenario, tick) : makeTelemetry('bearing', 4);
  const chart = history.map((row, i) => ({ ...row, vibration: i > 10 && asset.asset_id === 'WT-017' ? live.vibration - (17 - i) * .22 : row.vibration, temperature: 64 + (i > 11 && asset.asset_id === 'WT-017' ? (i - 10) * 1.1 : Math.sin(i) * 1.2) }));
  const drivers = asset.asset_id === 'WT-017' ? [{ label: 'Vibration deviation', value: '+31%', score: 86, color: 'bg-red-500' }, { label: 'Temperature deviation', value: '+8.4%', score: 62, color: 'bg-amber-500' }, { label: 'Power efficiency', value: '82.1%', score: 54, color: 'bg-sky-500' }] : [{ label: 'Power efficiency', value: '89.0%', score: 32, color: 'bg-sky-500' }, { label: 'Temperature deviation', value: '+4.2%', score: 26, color: 'bg-amber-500' }, { label: 'Soiling signal', value: 'Moderate', score: 19, color: 'bg-emerald-500' }];
  return <div className="mx-auto max-w-[1450px] fade-up"><div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Link href="/assets" data-testid="link-back-assets" className="hover:text-[hsl(var(--primary))]">Asset registry</Link><ChevronRight size={13} /><span className="mono">{asset.asset_id}</span></div><div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="flex items-center gap-4"><span className={`grid h-14 w-14 place-items-center rounded-2xl ${asset.type === 'WIND' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}`}>{asset.type === 'WIND' ? <Wind size={28} /> : <Sun size={28} />}</span><div><div className="eyebrow text-[hsl(var(--primary))]">{asset.type} asset · {asset.location}</div><h1 className="mt-1 text-3xl font-extrabold tracking-[-.04em]">{asset.asset_id}</h1><p className="mt-1 text-sm text-muted-foreground">Last updated {asset.lastUpdated}</p></div></div><div className="flex items-center gap-2"><Badge className={statusClass[asset.status]}>{asset.status}</Badge><Badge className={priorityClass[asset.priority]}>{asset.priority} priority</Badge>{asset.asset_id === 'WT-017' && running && <Badge className="bg-amber-100 text-amber-900"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 pulse-dot" />LIVE</Badge>}</div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Health score" value={asset.asset_id === 'WT-017' && running ? `${Math.max(38, asset.health - tick * 1.1).toFixed(0)}` : `${asset.health}`} unit="/ 100" tone={asset.health < 70 ? 'red' : 'teal'} icon={Gauge} /><MetricCard label="Current power" value={`${asset.asset_id === 'WT-017' && running ? live.powerOutput.toFixed(2) : asset.currentPower.toFixed(2)}`} unit="MW" tone="blue" icon={Activity} /><MetricCard label="Power lost" value={`${asset.powerLost.toFixed(2)}`} unit="MW" tone="amber" icon={ArrowDownRight} /><MetricCard label="Revenue exposure" value={`₹${asset.revenueLossPerHour.toLocaleString('en-IN')}`} unit="/ hr" tone="red" icon={TrendingDown} /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]"><div className="panel overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><div className="eyebrow text-muted-foreground">Sensor trends</div><h2 className="mt-2 text-lg font-bold">Signal movement · last 3 hours</h2></div><Badge className="bg-[hsl(var(--muted))] text-muted-foreground">15 min resolution</Badge></div><div className="grid grid-cols-2 border-b"><div className="h-[220px] border-r p-3"><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>Vibration</span><span className="mono text-amber-800">{live.vibration.toFixed(1)} mm/s</span></div><ResponsiveContainer width="100%" height="90%"><LineChart data={chart}><CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} /><XAxis dataKey="time" hide /><YAxis domain={[2, 7]} hide /><Line type="monotone" dataKey="vibration" stroke="hsl(12 67% 58%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div><div className="h-[220px] p-3"><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>Temperature</span><span className="mono text-amber-800">{live.temperature.toFixed(1)} °C</span></div><ResponsiveContainer width="100%" height="90%"><LineChart data={chart}><CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} /><XAxis dataKey="time" hide /><YAxis domain={[58, 78]} hide /><Line type="monotone" dataKey="temperature" stroke="hsl(37 83% 58%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="h-[220px] p-3"><div className="mb-1 flex justify-between text-[10px] text-muted-foreground"><span>Expected vs actual output</span><span className="mono text-[hsl(var(--primary))]">{live.powerOutput.toFixed(2)} MW actual</span></div><ResponsiveContainer width="100%" height="90%"><LineChart data={chart}><CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} /><XAxis dataKey="time" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis domain={[1.4, 2.1]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={30} /><Line type="monotone" dataKey="expected" stroke="hsl(37 83% 58%)" strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="actual" stroke="hsl(164 52% 30%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="panel p-5"><SectionTitle eyebrow="Explainable signal" title="Why this asset is here" detail="A probable issue, not a certain diagnosis." /><div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4"><div className="flex items-center gap-2 text-xs font-bold text-amber-900"><AlertTriangle size={15} /> Probable issue</div><div className="mt-2 text-lg font-extrabold text-amber-950">{asset.probableIssue}</div><p className="mt-1 text-xs leading-5 text-amber-900/75">Pattern matches the modeled fault signature. Validate on site before taking corrective action.</p></div><div className="mt-5 space-y-4">{drivers.map(driver => <div key={driver.label}><div className="mb-1.5 flex justify-between text-xs"><span>{driver.label}</span><span className="mono font-medium">{driver.value}</span></div><div className="h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${driver.color}`} style={{ width: `${driver.score}%` }} /></div></div>)}</div><div className="mt-6 border-t pt-4"><div className="eyebrow text-muted-foreground">Recommended action</div><p className="mt-2 text-sm font-bold">{asset.recommendedAction}</p><button data-testid={`button-create-workorder-${asset.asset_id}`} onClick={() => window.alert(`Work order draft created for ${asset.asset_id}`)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3 py-2.5 text-xs font-bold text-[hsl(var(--primary-foreground))]"><Wrench size={14} /> Create work order draft</button></div></div></div></div>;
}

function MaintenancePage() {
  const [orders, setOrders] = useState(initialOrders); const [filter, setFilter] = useState<'ALL' | WorkStatus>('ALL'); const [toast, setToast] = useState('');
  const visible = orders.filter(o => filter === 'ALL' || o.status === filter);
  const advance = (id: string) => { setOrders(current => current.map(o => o.id === id ? { ...o, status: o.status === 'ALERT' ? 'INSPECTION' : o.status === 'INSPECTION' ? 'ASSIGNED' : o.status === 'ASSIGNED' ? 'RESOLVED' : 'RESOLVED' } : o)); setToast('Work order workflow updated'); setTimeout(() => setToast(''), 2200); };
  return <div className="mx-auto max-w-[1450px] fade-up"><PageHead eyebrow="Maintenance queue" title="Put the right hands on the right asset." detail="A loss-weighted queue for moving from alert to verified resolution." action={<button data-testid="button-export-queue" onClick={() => setToast('Queue snapshot ready to share')} className="flex items-center gap-2 rounded-lg border bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold"><History size={14} /> Export snapshot</button>} />{toast && <div data-testid="status-maintenance-toast" className="fixed bottom-5 right-5 z-40 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-xl">{toast}</div>}<div className="mb-5 grid gap-3 sm:grid-cols-3">{[['P1', '1', 'Immediate attention'], ['P2', '2', 'Plan within 48 hours'], ['P3', '1', 'Routine follow-up']].map(([p, n, d]) => <div className="panel flex items-center gap-3 p-4" key={p}><Badge className={priorityClass[p as Priority]}>{p}</Badge><div><div className="mono text-xl">{n}</div><div className="text-xs text-muted-foreground">{d}</div></div></div>)}</div><div className="panel overflow-hidden"><div className="flex flex-wrap gap-2 border-b p-4">{(['ALL', 'ALERT', 'INSPECTION', 'ASSIGNED', 'RESOLVED'] as const).map(value => <button key={value} data-testid={`button-work-filter-${value.toLowerCase()}`} onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === value ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--muted))] text-muted-foreground'}`}>{value === 'ALL' ? 'All work' : value[0] + value.slice(1).toLowerCase()}</button>)}</div><div className="divide-y">{visible.map(order => { const asset = assets.find(a => a.asset_id === order.assetId)!; const next = order.status === 'ALERT' ? 'Start inspection' : order.status === 'INSPECTION' ? 'Assign technician' : order.status === 'ASSIGNED' ? 'Mark resolved' : 'Resolved'; return <div key={order.id} data-testid={`row-workorder-${order.id}`} className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1fr_.85fr_.85fr_auto] lg:items-center"><div><div className="flex items-center gap-2"><span className="mono text-sm font-bold">{order.id}</span><Badge className={priorityClass[order.priority]}>{order.priority}</Badge></div><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><span className="mono">{order.assetId}</span><span>·</span>{order.issue}</div></div><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[hsl(var(--muted))]">{asset.type === 'WIND' ? <Wind size={15} /> : <Sun size={15} />}</div><div><div className="text-xs font-bold">{order.technician}</div><div className="text-[11px] text-muted-foreground">{order.scheduledDate}</div></div></div><div><div className="eyebrow text-muted-foreground">Exposure</div><div className="mt-1 mono text-sm">₹{asset.revenueLossPerHour.toLocaleString('en-IN')}<small className="text-muted-foreground">/hr</small></div></div><div><Badge className={order.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : order.status === 'ASSIGNED' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-900'}>{order.status}</Badge></div><button data-testid={`button-advance-${order.id}`} disabled={order.status === 'RESOLVED'} onClick={() => advance(order.id)} className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-default disabled:opacity-50">{order.status === 'RESOLVED' ? <Check size={14} /> : <ArrowRight size={14} />}{next}</button></div>})}</div></div></div>;
}

function SimulationPage() {
  const { scenario, setScenario, running, setRunning, tick, setTick } = useDemo();
  const telemetry = makeTelemetry(scenario, tick);
  const simChart = Array.from({ length: 20 }, (_, i) => { const d = makeTelemetry(scenario, Math.max(0, tick - (19 - i))); return { time: i, vibration: d.vibration, temperature: d.temperature, power: d.powerOutput }; });
  useEffect(() => { if (!running) return; const timer = setInterval(() => setTick(tick + 1), 1600); return () => clearInterval(timer); }, [running, tick, setTick]);
  const health = Math.max(31, Math.round(94 - (scenario === 'normal' ? 0 : tick * (scenario === 'bearing' ? 1.25 : .85))));
  const story = ['Telemetry ingested', 'Features engineered', 'Anomaly detected', 'Health score updated', 'Risk classified', 'Loss exposure estimated', 'Technician action'];
  return <div className="mx-auto max-w-[1450px] fade-up"><PageHead eyebrow="Live demo · WT-017" title="Watch a fault become a decision." detail="Synthetic telemetry makes the model legible in real time. Start with normal, then introduce a fault signature." action={<div className="flex items-center gap-2 rounded-full border bg-[hsl(var(--card))] px-3 py-2 text-xs"><span className={`h-2 w-2 rounded-full ${running ? 'bg-amber-500 pulse-dot' : 'bg-muted-foreground'}`} />{running ? 'Streaming every 1.6 sec' : 'Stream paused'}</div>} /><div className="grid gap-5 xl:grid-cols-[.8fr_1.6fr]"><div className="space-y-5"><div className="panel p-5"><div className="eyebrow text-muted-foreground">1 · Choose a signature</div><div className="mt-4 grid gap-2">{(Object.keys(scenarioMeta) as Scenario[]).map(key => <button key={key} data-testid={`button-scenario-${key}`} onClick={() => { setScenario(key); setTick(key === 'normal' ? 0 : 3); setRunning(true); }} className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${scenario === key ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.07)]' : 'hover:bg-[hsl(var(--muted)/.5)]'}`}><span><strong className="block text-sm">{scenarioMeta[key].label}</strong><small className="mt-1 block text-xs text-muted-foreground">{key === 'normal' ? 'Baseline ranges' : key === 'bearing' ? 'Vibration ↑ · temp ↑ · RPM ↓' : key === 'generator' ? 'Temperature ↑↑ · current ↑' : 'Vibration ↑↑ · RPM unstable'}</small></span>{scenario === key && <Check size={16} className="text-[hsl(var(--primary))]" />}</button>)}</div><button data-testid="button-toggle-simulation" onClick={() => setRunning(!running)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]">{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Pause telemetry' : 'Start telemetry'}</button></div><div className="panel p-5"><div className="eyebrow text-muted-foreground">2 · Storyline</div><div className="mt-4 space-y-3">{story.map((label, i) => <div key={label} className={`flex items-center gap-3 text-xs ${i <= (running ? Math.min(6, Math.floor(tick / 2)) : 0) ? 'text-foreground' : 'text-muted-foreground/50'}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${i <= (running ? Math.min(6, Math.floor(tick / 2)) : 0) ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-muted'}`}>{i + 1}</span><span>{label}</span>{i < 6 && <span className="ml-auto h-px w-5 bg-border" />}</div>)}</div></div></div><div className="space-y-5"><div className="panel overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><div className="eyebrow text-muted-foreground">3 · Live telemetry stream</div><h2 className="mt-2 text-lg font-bold"><span className="mono">WT-017</span> · {scenarioMeta[scenario].label}</h2></div><div className="text-right"><div className="eyebrow text-muted-foreground">Elapsed</div><div className="mono mt-1 text-lg">{String(Math.floor(tick / 60)).padStart(2, '0')}:{String(tick % 60).padStart(2, '0')}</div></div></div><div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">{[['Wind speed', telemetry.windSpeed.toFixed(1), 'm/s'], ['Temperature', telemetry.temperature.toFixed(1), '°C'], ['Vibration', telemetry.vibration.toFixed(1), 'mm/s'], ['RPM', telemetry.rpm.toFixed(0), 'rpm'], ['Current', telemetry.current.toFixed(1), 'A'], ['Power output', telemetry.powerOutput.toFixed(2), 'MW']].map(([label, value, unit]) => <div className="bg-[hsl(var(--card))] p-4" key={label}><div className="text-[10px] text-muted-foreground">{label}</div><div className={`mono mt-2 text-xl ${label === 'Vibration' && telemetry.vibration > 4 ? 'text-red-700' : label === 'Temperature' && telemetry.temperature > 68 ? 'text-amber-800' : ''}`}>{value}</div><div className="text-[10px] text-muted-foreground">{unit}</div></div>)}</div><div className="h-[220px] p-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={simChart}><CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} /><XAxis dataKey="time" tick={false} /><YAxis yAxisId="left" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} /><ChartTooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} /><Line yAxisId="left" type="monotone" dataKey="vibration" stroke="hsl(12 67% 58%)" strokeWidth={2} dot={false} /><Line yAxisId="right" type="monotone" dataKey="power" stroke="hsl(164 52% 30%)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div><div className="grid gap-5 md:grid-cols-3"><div className="panel p-5"><div className="eyebrow text-muted-foreground">Health</div><div className="mt-3 flex items-end gap-2"><span className="mono text-4xl font-medium">{health}</span><span className="mb-1 text-xs text-muted-foreground">/ 100</span></div><div className="mt-3 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${health > 70 ? 'bg-emerald-500' : health > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${health}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">Weighted score updates from five signals.</p></div><div className="panel p-5"><div className="eyebrow text-muted-foreground">Risk classification</div><div className="mt-3 text-2xl font-extrabold text-red-700">{scenario === 'normal' ? 'LOW' : health < 55 ? 'HIGH' : 'MEDIUM'}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Threshold logic combines severity, trend, and loss exposure.</p></div><div className="panel p-5"><div className="eyebrow text-muted-foreground">Next action</div><div className="mt-3 text-sm font-bold">{scenario === 'normal' ? 'Continue monitoring' : 'Inspect drive-train within 24 hours'}</div><Link href="/maintenance" data-testid="link-simulation-maintenance" className="mt-4 flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]">Open maintenance queue <ArrowRight size={13} /></Link></div></div></div></div></div>;
}

function PlaybookPage() {
  const weights = [['Vibration', '25%', 'Mechanical oscillation against rolling baseline', 'bg-red-500'], ['Temperature', '20%', 'Thermal drift and rate of change', 'bg-amber-500'], ['Power', '25%', 'Expected vs actual efficiency', 'bg-[hsl(var(--primary))]'], ['RPM', '15%', 'Speed stability under load', 'bg-sky-500'], ['Current', '15%', 'Load draw and thermal correlation', 'bg-violet-500']];
  return <div className="mx-auto max-w-[1200px] fade-up"><PageHead eyebrow="Intelligence playbook" title="Make the model explain itself." detail="A plain-language view of how telemetry becomes a maintenance recommendation. Designed for trust, not black-box theater." action={<Badge className="bg-emerald-100 text-emerald-800"><ShieldCheck size={13} className="mr-1.5" /> Explainable by design</Badge>} /><div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="panel p-6"><div className="eyebrow text-muted-foreground">Isolation Forest</div><h2 className="mt-2 text-xl font-extrabold">Find what is unusual for this asset.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">The detector compares a new telemetry window against recent behavior. Signals that isolate quickly from the normal cluster raise the anomaly severity. It is a screening layer: it surfaces what deserves a human look, not a certain diagnosis.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{[['01', 'Baseline', 'Learn 14 days of operating behavior'], ['02', 'Isolate', 'Split unusual feature combinations'], ['03', 'Explain', 'Map signature to probable issue']].map(([n, title, text]) => <div className="rounded-xl border bg-[hsl(var(--background)/.6)] p-4" key={n}><span className="mono text-xs text-[hsl(var(--primary))]">{n}</span><h3 className="mt-5 text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div>)}</div></div><div className="panel p-6"><div className="eyebrow text-muted-foreground">Signal vocabulary</div><h2 className="mt-2 text-xl font-extrabold">Feature engineering</h2><div className="mt-5 space-y-3">{['temperatureDeviation', 'vibrationDeviation', 'rpmDeviation', 'powerDeviation', 'currentDeviation', 'rollingVibration', 'rollingTemperature', 'powerEfficiency'].map(feature => <div className="flex items-center justify-between rounded-lg bg-[hsl(var(--muted)/.65)] px-3 py-2" key={feature}><span className="mono text-xs">{feature}</span><span className="text-[10px] text-muted-foreground">{feature.startsWith('rolling') ? 'windowed trend' : 'normalized vs baseline'}</span></div>)}</div></div></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><div className="panel p-6"><SectionTitle eyebrow="Weighted health score" title="Five signals, one useful number." detail="Weights are fixed for this demo and visible to the operator." /><div className="space-y-5">{weights.map(([name, weight, description, color]) => <div key={name}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="text-sm font-bold">{name}</span></div><span className="mono text-sm">{weight}</span></div><div className="mt-2 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${color}`} style={{ width: weight }} /></div><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>)}</div></div><div className="panel p-6"><SectionTitle eyebrow="Health bands" title="Thresholds operators can see." /><div className="space-y-3">{[['85–100', 'Healthy', 'Normal monitoring', 'bg-emerald-100 text-emerald-800'], ['70–84', 'Watch', 'Review on next round', 'bg-sky-100 text-sky-800'], ['50–69', 'Warning', 'Plan inspection', 'bg-amber-100 text-amber-900'], ['0–49', 'Critical', 'Escalate now', 'bg-red-100 text-red-800']].map(([range, label, action, cls]) => <div className="flex items-center gap-3 rounded-xl border p-3" key={range}><span className="mono w-16 text-xs">{range}</span><Badge className={cls}>{label}</Badge><span className="ml-auto text-[10px] text-muted-foreground">{action}</span></div>)}</div><div className="mt-5 border-t pt-4"><div className="eyebrow text-muted-foreground">Rule-based recommendations</div><p className="mt-2 text-xs leading-5 text-muted-foreground">High vibration + rising temperature + falling RPM → probable bearing or gearbox issue. Sharp temperature + current rise → probable generator issue. Always validate in the field.</p></div></div></div></div>;
}

function RoadmapPage() {
  const phases = [['00–06 h', 'Command center foundation', 'Shared asset model, status vocabulary, fleet metrics, and the first loss-exposure view.', 'Shipped'], ['06–18 h', 'WT-017 live demo', 'Scenario controls, streaming telemetry, trend charts, explainable fault signatures, and a clear technician action.', 'Shipped'], ['18–30 h', 'Operations workflow', 'Ranked maintenance queue, work-order status workflow, asset detail, and operator-ready filters.', 'Shipped'], ['30–48 h', 'Evaluator readiness', 'Playbook transparency, honest simulated-data framing, responsive polish, and demo narrative.', 'Now'], ['Future', 'Production telemetry', 'Real SCADA / IoT ingestion, asset-specific retraining, edge inference, and weather-aware baselines.', 'Planned'], ['Future', 'Technician loop', 'Mobile workflow for inspection evidence, parts, sign-off, and closed-loop outcome labels.', 'Planned']];
  return <div className="mx-auto max-w-[1200px] fade-up"><PageHead eyebrow="Delivery roadmap" title="From a convincing demo to a dependable system." detail="A transparent plan for what is real today, what is simulated, and what comes next." action={<Badge className="bg-amber-100 text-amber-900"><CloudSun size={13} className="mr-1.5" /> Demo data clearly marked</Badge>} /><div className="panel overflow-hidden"><div className="border-b bg-[hsl(var(--muted)/.45)] p-5"><div className="eyebrow text-muted-foreground">Delivery plan · 0–48 hours</div><h2 className="mt-2 text-lg font-bold">Build the trust layer before the automation layer.</h2></div><div className="divide-y">{phases.map(([time, title, detail, status]) => <div className="grid gap-4 p-5 md:grid-cols-[110px_1fr_100px] md:items-center" key={time + title}><div className="mono text-xs text-[hsl(var(--primary))]">{time}</div><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{detail}</p></div><Badge className={status === 'Planned' ? 'bg-slate-100 text-slate-600' : status === 'Now' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}>{status}</Badge></div>)}</div></div><div className="mt-5 grid gap-5 md:grid-cols-3"><div className="panel p-5"><div className="eyebrow text-muted-foreground">Validation</div><h3 className="mt-3 font-bold">Make the evaluator see the chain.</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Telemetry → derived signals → health → risk → loss → work order. Every transition is visible and interactive.</p></div><div className="panel p-5"><div className="eyebrow text-muted-foreground">Honest framing</div><h3 className="mt-3 font-bold">Simulated data, real product shape.</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">This prototype uses local demo data. Outputs are probable issues for triage, never claims of certainty or model accuracy.</p></div><div className="panel p-5"><div className="eyebrow text-muted-foreground">Production north star</div><h3 className="mt-3 font-bold">Close the field feedback loop.</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Technician confirmation becomes the next training label, with weather context and asset-specific baselines.</p></div></div></div>;
}

function NotFound() { return <div className="mx-auto max-w-2xl py-24 text-center"><div className="eyebrow text-[hsl(var(--primary))]">404 / signal lost</div><h1 className="mt-4 text-4xl font-extrabold">This route is not in the operating picture.</h1><Link href="/" data-testid="link-back-home" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-sm font-bold text-[hsl(var(--primary-foreground))]">Back to command center <ArrowRight size={15} /></Link></div>; }

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route>
        <Shell>
          <Switch>
            <Route path="/" component={Overview} />
            <Route path="/assets" component={AssetsPage} />
            <Route path="/assets/:id" component={AssetDetail} />
            <Route path="/maintenance" component={MaintenancePage} />
            <Route path="/simulation" component={SimulationPage} />
            <Route path="/playbook" component={PlaybookPage} />
            <Route path="/roadmap" component={RoadmapPage} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </Route>
    </Switch>
  );
}

const queryClient = new QueryClient();
function App() {
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const context = useMemo(() => ({ scenario, setScenario, running, setRunning, tick, setTick }), [scenario, running, tick]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DemoContext.Provider value={context}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </DemoContext.Provider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;