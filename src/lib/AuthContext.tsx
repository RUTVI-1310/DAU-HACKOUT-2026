import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'GRID_OPERATOR' | 'UTILITY_COMPANY' | 'PLANT_OWNER' | 'ENERGY_TRADER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  organization: string;
  avatarInitials: string;
  initials?: string;
  title?: string;
  badgeColor: string;
  description: string;
}

export const DEMO_PERSONAS: Record<UserRole, UserProfile> = {
  GRID_OPERATOR: {
    id: 'usr_grid_01',
    name: 'Neel Sharma',
    email: 'operator@gridsense.energy',
    role: 'GRID_OPERATOR',
    roleLabel: 'Grid Operator',
    organization: 'Gujarat State Load Dispatch Center (SLDC)',
    avatarInitials: 'NS',
    initials: 'NS',
    title: 'Grid Operator',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Monitors grid stability, frequency deviations, and transmission curtailment orders.',
  },
  UTILITY_COMPANY: {
    id: 'usr_util_02',
    name: 'Priya Patel',
    email: 'utility@tatapower.com',
    role: 'UTILITY_COMPANY',
    roleLabel: 'Utility Company',
    organization: 'Tata Power Transmission & Distribution',
    avatarInitials: 'PP',
    initials: 'PP',
    title: 'Utility Company',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Plans generation capacity reserves, backup scheduling, and demand coverage.',
  },
  PLANT_OWNER: {
    id: 'usr_plant_03',
    name: 'Aarav Mehta',
    email: 'owner@adanigreen.com',
    role: 'PLANT_OWNER',
    roleLabel: 'Renewable Plant Owner',
    organization: 'Adani Green Energy Ltd (Kutch & Pavagada)',
    avatarInitials: 'AM',
    initials: 'AM',
    title: 'Renewable Plant Owner',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Tracks site-level wind/solar telemetry, inverter health, and maintenance dispatch.',
  },
  ENERGY_TRADER: {
    id: 'usr_trade_04',
    name: 'Vikram Malhotra',
    email: 'trader@iexindia.com',
    role: 'ENERGY_TRADER',
    roleLabel: 'Energy Trader',
    organization: 'Indian Energy Exchange (IEX) Power Desk',
    avatarInitials: 'VM',
    initials: 'VM',
    title: 'Energy Trader',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Optimizes day-ahead power contracts, price arbitrage, and financial risk exposure.',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  loginAsPersona: (role: UserRole) => void;
  register: (name: string, email: string, role: UserRole, organization: string) => Promise<boolean>;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'verdant_ops_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to Grid Operator persona for immediate rich demo experience
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEMO_PERSONAS.GRID_OPERATOR;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, role?: UserRole): Promise<boolean> => {
    // Check if matches any demo persona
    const foundRole = Object.keys(DEMO_PERSONAS).find(
      (r) => DEMO_PERSONAS[r as UserRole].email.toLowerCase() === email.toLowerCase()
    ) as UserRole | undefined;

    const targetRole = role || foundRole || 'GRID_OPERATOR';
    const profile = DEMO_PERSONAS[targetRole] || {
      ...DEMO_PERSONAS.GRID_OPERATOR,
      email,
      name: email.split('@')[0],
      avatarInitials: email.slice(0, 2).toUpperCase(),
    };

    setUser(profile);
    return true;
  };

  const loginAsPersona = (role: UserRole) => {
    if (DEMO_PERSONAS[role]) {
      setUser(DEMO_PERSONAS[role]);
    }
  };

  const register = async (name: string, email: string, role: UserRole, organization: string): Promise<boolean> => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

    const roleInfo = DEMO_PERSONAS[role];
    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
      roleLabel: roleInfo.roleLabel,
      organization: organization || roleInfo.organization,
      avatarInitials: initials,
      badgeColor: roleInfo.badgeColor,
      description: roleInfo.description,
    };

    setUser(newUser);
    return true;
  };

  const switchRole = (role: UserRole) => {
    if (DEMO_PERSONAS[role]) {
      setUser((prev) => ({
        ...prev,
        role,
        roleLabel: DEMO_PERSONAS[role].roleLabel,
        badgeColor: DEMO_PERSONAS[role].badgeColor,
        description: DEMO_PERSONAS[role].description,
      }));
    }
  };

  const logout = () => {
    setUser(DEMO_PERSONAS.GRID_OPERATOR); // Reset to default demo persona
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole: user?.role || 'GRID_OPERATOR',
        isAuthenticated: Boolean(user),
        login,
        loginAsPersona,
        register,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
