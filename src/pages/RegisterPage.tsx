import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Wind, Activity, Building2, Sun, TrendingUp, Check, ArrowRight, ShieldCheck, User, Mail, Building, Lock } from 'lucide-react';
import { useAuth, UserRole } from '../lib/AuthContext';

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('GRID_OPERATOR');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const rolesConfig: Record<
    UserRole,
    { title: string; subtitle: string; icon: any; capabilities: string[]; badge: string }
  > = {
    GRID_OPERATOR: {
      title: 'Grid Operator',
      subtitle: 'Regional & State Load Dispatch Centers (RLDC / SLDC)',
      icon: Activity,
      badge: 'Transmission & Dispatch',
      capabilities: [
        'Real-time frequency balancing & curtailment alerts',
        '24–72 hour generation forecast aggregation',
        'Storage dispatch & emergency backup activation',
      ],
    },
    UTILITY_COMPANY: {
      title: 'Utility Company',
      subtitle: 'Transmission & Distribution Utilities (DISCOMs)',
      icon: Building2,
      badge: 'Capacity Planning',
      capabilities: [
        'Peak load reserve planning & spinning reserve optimization',
        'Fossil-fuel backup cost reduction modeling',
        'Long-term renewable integration compliance',
      ],
    },
    PLANT_OWNER: {
      title: 'Renewable Plant Owner',
      subtitle: 'Solar PV & Wind Farm Asset Operators',
      icon: Sun,
      badge: 'Asset Health & SCADA',
      capabilities: [
        'Multi-sensor turbine & inverter predictive maintenance',
        'Physical power curve efficiency vs. expected loss',
        'Automated work order creation & technician allocation',
      ],
    },
    ENERGY_TRADER: {
      title: 'Energy Trader',
      subtitle: 'Day-Ahead & Real-Time Power Markets (IEX / PXIL)',
      icon: TrendingUp,
      badge: 'Financial & Arbitrage',
      capabilities: [
        'Day-ahead schedule vs actual revenue risk modeling',
        'Deviation Settlement Mechanism (DSM) penalty protection',
        'Arbitrage opportunity forecasting @ Time-of-Day tariffs',
      ],
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    await register(name, email, selectedRole, organization);
    setTimeout(() => {
      setIsLoading(false);
      setLocation('/');
    }, 400);
  };

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
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
          Select your operator role & create account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Tailored tools and analytics designed specifically for participants in the renewable energy supply chain.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* 1. Role Selection Grid */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow text-muted-foreground font-bold tracking-wider">
                1. SELECT YOUR PARTICIPANT ROLE (PROBLEM STATEMENT SPECIFICATION)
              </span>
              <span className="text-[11px] text-[hsl(var(--primary))] font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Role-Based Access Control
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(Object.keys(rolesConfig) as UserRole[]).map((roleKey) => {
                const config = rolesConfig[roleKey];
                const Icon = config.icon;
                const isSelected = selectedRole === roleKey;

                return (
                  <div
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                      isSelected
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent)/0.12)] ring-2 ring-[hsl(var(--primary))]'
                        : 'border-muted hover:border-[hsl(var(--border))] bg-background hover:bg-[hsl(var(--muted)/0.3)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`p-2.5 rounded-xl border ${
                            isSelected
                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon size={18} strokeWidth={2.2} />
                        </span>
                        <div>
                          <strong className="block text-sm font-extrabold text-foreground">{config.title}</strong>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            {config.badge}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border grid place-items-center ${
                          isSelected
                            ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'border-muted'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-muted-foreground">{config.subtitle}</p>

                    <ul className="mt-3 space-y-1.5 border-t pt-3">
                      {config.capabilities.map((cap, i) => (
                        <li key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
                          <span className="text-[hsl(var(--primary))] mt-0.5">•</span>
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. User Credentials Form */}
          <div className="border-t pt-6">
            <span className="eyebrow text-muted-foreground font-bold tracking-wider block mb-4">
              2. OPERATOR CREDENTIALS & ORGANIZATION
            </span>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Full Name *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="e.g. Vikram Malhotra"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Work Email *
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
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="e.g. trader@iexindia.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Organization / Entity
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Building size={16} />
                  </div>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="e.g. Indian Energy Exchange / Gujarat SLDC"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
                  Password *
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
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="Create secure password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3.5 text-sm font-extrabold shadow hover:opacity-95 transition cursor-pointer"
            >
              {isLoading ? (
                <span>Creating Operator Profile...</span>
              ) : (
                <>
                  Register as {rolesConfig[selectedRole].title} & Enter Platform <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t text-center text-xs text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-[hsl(var(--primary))] hover:underline">
              Sign in with your credentials
            </Link>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
            ← Return to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
