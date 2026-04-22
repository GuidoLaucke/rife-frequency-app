import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { openDB } from '@/lib/db';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      db.getById('users', storedUserId).then(foundUser => {
        if (foundUser) setUser(foundUser);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const users = await db.getAll('users');
      const foundUser = users.find(u => u.email === email);
      
      if (!foundUser) return false;
      
      // Simple password check (in production, use proper hashing)
      if (foundUser.password_hash === password) {
        setUser(foundUser);
        localStorage.setItem('userId', foundUser.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const users = await db.getAll('users');
      if (users.some(u => u.email === email)) {
        return false; // Email already exists
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        email,
        password_hash: password, // In production, hash this!
        name,
        created_at: new Date(),
      };

      await db.add('users', newUser);
      setUser(newUser);
      localStorage.setItem('userId', newUser.id);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
