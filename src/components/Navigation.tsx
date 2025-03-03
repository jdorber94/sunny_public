'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { signIn, signOut, useSession } from 'next-auth/react';

interface NavItem {
  name: string;
  path: string;
  icon: (props: { active: boolean }) => JSX.Element;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    path: '/',
    icon: ({ active }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Progress',
    path: '/progress',
    icon: ({ active }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Premium',
    path: '/premium',
    icon: ({ active }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const profileItem: NavItem = {
  name: 'Profile',
  path: '/profile',
  icon: ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${active ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const authItem = user ? (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mr-3">
          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
        </span>
        <span className="truncate max-w-[140px]">{user.displayName || user.email}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        Sign out
      </button>
    </div>
  ) : (
    <Link
      href="/login"
      className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-indigo-300"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-slate-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
      Sign in
    </Link>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h1 className="text-2xl font-display font-bold text-black dark:text-white">Quest</h1>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {item.icon({ active: isActive })}
                  <span className="ml-3 font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-600 dark:bg-white" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4">
            {user ? (
              <Link
                href={profileItem.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  pathname === profileItem.path 
                    ? 'bg-background text-primary' 
                    : 'text-text-secondary hover:bg-background hover:text-primary'
                }`}
              >
                {profileItem.icon({ active: pathname === profileItem.path })}
                <span className="ml-3 font-medium">{profileItem.name}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center px-4 py-3 rounded-xl text-text-secondary hover:bg-background hover:text-primary transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span className="ml-3 font-medium">Login</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe lg:hidden z-50">
        <nav className="flex justify-around items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center py-3 px-2 relative"
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-800' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}>
                  {item.icon({ active: isActive })}
                </div>
                <span className={`text-xs font-medium mt-1 ${
                  isActive 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </Link>
            );
          })}
          {user && (
            <Link
              href={profileItem.path}
              className="flex flex-col items-center py-3 px-2 relative"
            >
              <div className={`p-2 rounded-lg transition-colors ${
                pathname === profileItem.path 
                  ? 'bg-slate-100 dark:bg-slate-800' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}>
                {profileItem.icon({ active: pathname === profileItem.path })}
              </div>
              <span className={`text-xs font-medium mt-1 ${
                pathname === profileItem.path 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {profileItem.name}
              </span>
              {pathname === profileItem.path && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
              )}
            </Link>
          )}
        </nav>
      </div>
    </>
  );
} 