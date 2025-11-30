import React from 'react';
import { Layout, User as UserIcon, LogOut, Phone } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  onNavigate: (section: string) => void;
  user: User | null;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, user, onSignOut, onSignIn }) => {
  return (
    <nav className="w-full h-16 bg-cream-50 border-b border-stone-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('home')}>
        <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold font-display group-hover:scale-105 transition-transform shrink-0">
          S
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] tracking-widest text-orange-600 font-bold uppercase hidden sm:block">AI Site Builder</span>
          <span className="font-display font-bold text-lg text-slate-800 leading-none">SiteWeaver</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <button onClick={() => onNavigate('home')} className="hover:text-slate-900 transition-colors">Home</button>
        <button onClick={() => onNavigate('projects')} className="hover:text-slate-900 transition-colors">Projects</button>
        <button onClick={() => onNavigate('templates')} className="hover:text-slate-900 transition-colors">Templates</button>
        <button onClick={() => onNavigate('contact')} className="hover:text-slate-900 transition-colors">Contact</button>
      </div>

      <div className="flex items-center gap-3">
        {!user ? (
          <>
            <button onClick={onSignIn} className="text-slate-600 font-medium hover:text-slate-900 text-sm whitespace-nowrap">Sign In</button>
            <button onClick={onSignIn} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs md:text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap">
              Get Started
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <div className="text-xs font-bold text-slate-900">{user.name}</div>
               <div className="text-[10px] text-slate-500">Free Plan</div>
             </div>
             <div className="group relative">
               <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 cursor-pointer overflow-hidden">
                  <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
               </div>
               {/* Dropdown for Sign Out */}
               <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 hidden group-hover:block">
                 <button onClick={onSignOut} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                   <LogOut size={12} /> Sign Out
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>
    </nav>
  );
};