'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { 
  BookOpen, QrCode, Clock, Bell, Settings, LogOut, 
  Home, GraduationCap, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/profile/profile-dropdown';
import RealTimeClock from '@/components/real-time-clock';

interface ProfessorHeaderProps {
  currentPage: 'dashboard' | 'classes' | 'sessions' | 'students' | 'analytics';
  userProfile?: any;
  onSignOut: () => void;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onUploadAvatar: (file: File) => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
}

export default function ProfessorHeader({
  currentPage,
  userProfile,
  onSignOut,
  onEditProfile,
  onChangePassword,
  onUploadAvatar,
  onDeleteAvatar
}: ProfessorHeaderProps) {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };


  const getButtonClass = (page: string) => {
    const baseClass = "hover:bg-slate-100 dark:hover:bg-slate-700";
    const activeClass = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800";
    
    return currentPage === page ? activeClass : baseClass;
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/professor/dashboard" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">FSAS</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Professor Portal</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link href="/professor/dashboard">
              <Button variant="ghost" size="sm" className={getButtonClass('dashboard')}>
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/professor/classes">
              <Button variant="ghost" size="sm" className={getButtonClass('classes')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Classes
              </Button>
            </Link>
            <Link href="/professor/sessions">
              <Button variant="ghost" size="sm" className={getButtonClass('sessions')}>
                <QrCode className="w-4 h-4 mr-2" />
                Sessions
              </Button>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Real Time Clock */}
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <RealTimeClock showSeconds={true} />
            </div>

            {/* Notifications */}
            <NotificationPanel />

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown
              user={user}
              userProfile={userProfile}
              onSignOut={onSignOut}
              onEditProfile={onEditProfile}
              onChangePassword={onChangePassword}
              onUploadAvatar={onUploadAvatar}
              onDeleteAvatar={onDeleteAvatar}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
