'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: (active: boolean) => JSX.Element;
}

const navItems: NavItem[] = [
  {
    name: 'Quest',
    path: '/',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-6 h-6 ${active ? 'text-indigo-500' : 'text-slate-400'}`}
      >
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
      </svg>
    ),
  },
  {
    name: 'Progress',
    path: '/progress',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-6 h-6 ${active ? 'text-indigo-500' : 'text-slate-400'}`}
      >
        <path
          fillRule="evenodd"
          d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: 'History',
    path: '/history',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`w-6 h-6 ${active ? 'text-indigo-500' : 'text-slate-400'}`}
      >
        <path
          fillRule="evenodd"
          d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z"
          clipRule="evenodd"
        />
        <path
          fillRule="evenodd"
          d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 p-4">
        <div className="flex items-center gap-3 px-2 py-4">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            Quest
          </span>
        </div>
        <nav className="flex-1 mt-8">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${pathname === item.path
                      ? 'bg-indigo-50 text-indigo-500'
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {item.icon(pathname === item.path)}
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Profile Section */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${pathname === '/profile'
                ? 'bg-indigo-50 text-indigo-500'
                : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-medium">
              JD
            </div>
            <div className="flex-1">
              <div className="font-medium">John Doe</div>
              <div className="text-sm text-slate-400">View Profile</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 pb-6 pt-2 z-50">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all
                ${pathname === item.path
                  ? 'text-indigo-500 bg-indigo-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              {item.icon(pathname === item.path)}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
          <Link
            href="/profile"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all
              ${pathname === '/profile'
                ? 'text-indigo-500 bg-indigo-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium">
              JD
            </div>
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </nav>
      </div>
    </>
  );
} 