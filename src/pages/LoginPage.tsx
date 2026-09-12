import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Wind, Activity, Building2, Sun, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useAuth, UserRole, DEMO_PERSONAS } from '../lib/AuthContext';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, loginAsPersona } = useAuth();
  
  const [email, setEmail] = useState('operator@gridsense.energy');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('GRID_OPERATOR');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, selectedRole);
    setTimeout(() => {
      setIsLoading(false);
      setLocation('/');
    }, 400);
  };

  const handleQuickLogin = (role: UserRole) => {
    loginAsPersona(role);
    setLocation('/');
  };

  const roleIcons = {
    GRID_OPERATOR: Activity,
    UTILITY_COMPANY: Building2,
    PLANT_OWNER: Sun,
    ENERGY_TRADER: TrendingUp,
  };

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Brand Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-md">
            <Wind size={24} strokeWidth={2.5} />
          </span>
          <div className="text-left">
            <strong className="block text-xl tracking-tight text-foreground font-extrabold">verdant / ops</strong>
            <small className="mono text-[10px] text-muted-foreground tracking-widest font-semibold uppercase">
              RENEWABLE ENERGY INTELLIGENCE
            </small>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Sign in to access renewable generation forecasts, asset telemetry & dispatch controls.
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* Quick 1-Click Role Login Carousel */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow text-muted-foreground font-bold tracking-wider">
                1-CLICK DEMO ACCESS (SELECT YOUR ROLE)
              </span>
              <span className="text-[11px] text-[hsl(var(--primary))] font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Instant Persona Login
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(DEMO_PERSONAS) as UserRole[]).map((r) => {
                const persona = DEMO_PERSONAS[r];
                const Icon = roleIcons[r];
                const isSelected = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickLogin(r)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative group ${
                      isSelected
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent)/0.15)] ring-1 ring-[hsl(var(--primary))]'
                        : 'bg-[hsl(var(--muted)/0.3)] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]'
                    }`}
                  >
                    <span className="p-2 rounded-lg bg-card border text-[hsl(var(--primary))] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold text-foreground truncate block">
                          {persona.roleLabel}
                        </strong>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${persona.badgeColor}`}>
                          {persona.avatarInitials}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {persona.name} · {persona.organization}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-semibold">Or sign in with email</span>
            </div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                Work Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition"
                  placeholder="operator@gridsense.energy"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                Role Persona
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="block w-full px-3 py-2.5 rounded-xl border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              >
                <option value="GRID_OPERATOR">Grid Operator (System Stability & Curtailment)</option>
                <option value="UTILITY_COMPANY">Utility Company (Capacity Planning & Reserves)</option>
                <option value="PLANT_OWNER">Renewable Plant Owner (Site Telemetry & Predictive Health)</option>
                <option value="ENERGY_TRADER">Energy Trader (Day-Ahead Market & Arbitrage)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                <input type="checkbox" defaultChecked className="rounded border-muted text-[hsl(var(--primary))]" />
                Remember this workstation
              </label>
              <a href="#" className="font-semibold text-[hsl(var(--primary))] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 text-sm font-bold shadow hover:opacity-95 transition cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  Sign in to Command Center <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-5 border-t text-center text-xs text-muted-foreground">
            Don't have an operator profile?{' '}
            <Link href="/register" className="font-bold text-[hsl(var(--primary))] hover:underline">
              Create an account with your role
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            ← Continue as Guest to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
