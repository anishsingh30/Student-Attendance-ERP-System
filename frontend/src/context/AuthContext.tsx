import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, portalRole?: string) => Promise<User>;
  quickLogin: (roleKey: 'student_borderline' | 'student_safe' | 'student_critical' | 'faculty' | 'admin') => Promise<User>;
  updateUserData: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem('user', JSON.stringify(profile));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string, portalRole?: string): Promise<User> => {
    const res = await api.login(email, password, portalRole);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);

    const profile = await api.getMe();
    if (res.must_change_password !== undefined) {
      profile.must_change_password = res.must_change_password;
    }
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
    return profile;
  };

  const quickLogin = async (roleKey: 'student_borderline' | 'student_safe' | 'student_critical' | 'faculty' | 'admin'): Promise<User> => {
    const credentials = {
      student_borderline: { email: 'rahul.verma@college.edu', pw: 'student123' },
      student_safe: { email: 'priya.sharma@college.edu', pw: 'student123' },
      student_critical: { email: 'amit.kumar@college.edu', pw: 'student123' },
      faculty: { email: 'faculty.rajesh@college.edu', pw: 'faculty123' },
      admin: { email: 'admin@college.edu', pw: 'admin123' },
    };

    const cred = credentials[roleKey];
    return login(cred.email, cred.pw);
  };

  const updateUserData = (updatedUser: User) => {
    if (updatedUser.access_token) {
      localStorage.setItem('token', updatedUser.access_token);
      setToken(updatedUser.access_token);
    }
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, quickLogin, updateUserData, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
