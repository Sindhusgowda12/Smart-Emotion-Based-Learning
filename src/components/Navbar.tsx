import React from 'react';
import { auth, signOut } from '../firebase';
import { LogOut, GraduationCap, LayoutDashboard, BookOpen, ShieldCheck, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface NavbarProps {
  isAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isAdmin }) => {
  const location = useLocation();
  const user = auth.currentUser;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Teacher', path: '/teacher', icon: Users },
  ];

  const isPrimaryAdmin = user?.email === 'sindhus8012@gmail.com';

  if (isAdmin || isPrimaryAdmin) {
    navItems.push({ label: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              EmoLearn
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.path
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="h-8 w-px bg-gray-200 hidden md:block" />

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-gray-900">{user.displayName}</span>
                  <span className="text-xs text-gray-500">{user.email}</span>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
