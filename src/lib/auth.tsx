import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserByEmail, createUser, openDB } from '@/lib/db';

interface User {
  id?: number;
  email: string;
  name: string;
}

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
      loadUser(Number(storedUserId));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async (userId: number) => {
  try {
    if (!userId || isNaN(userId)) {
      setIsLoading(false);
      return;
    }
    const db = await openDB();
    const foundUser = await db.get('users', userId);
      if (foundUser) {
        setUser(foundUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = await getUserByEmail(email);
      
      if (foundUser && foundUser.password === password) {
        setUser(foundUser);
        localStorage.setItem('userId', String(foundUser.id));
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
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return false; // User already exists
      }

      const userId = await createUser({
        email,
        password,
        name,
        createdAt: new Date(),
      });

      const newUser = { id: userId, email, name };
      setUser(newUser);
      localStorage.setItem('userId', String(userId));
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
