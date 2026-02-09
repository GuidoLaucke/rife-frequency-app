import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'user' | 'admin';

interface RoleContextType {
  role: UserRole;
  isAdmin: boolean;
  loginAsAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Admin password (in production, this should be hashed and stored securely)
const ADMIN_PASSWORD = 'rife2026'; // Change this!

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    // Check if admin session exists
    const storedRole = sessionStorage.getItem('alchewat_admin_session');
    if (storedRole === 'admin') {
      setRole('admin');
    }
  }, []);

  const loginAsAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setRole('admin');
      sessionStorage.setItem('alchewat_admin_session', 'admin');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setRole('user');
    sessionStorage.removeItem('alchewat_admin_session');
  };

  return (
    <RoleContext.Provider value={{ role, isAdmin: role === 'admin', loginAsAdmin, logoutAdmin }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
