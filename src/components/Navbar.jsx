import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Menu, X, LayoutDashboard, LogOut, Search, ChevronDown, ShoppingCart, Bot, ShieldCheck, UploadCloud, Columns, Calendar, Bell, HeartHandshake as Handshake, UserCheck, Users, FileSearch, Terminal, Zap, Briefcase, ListFilter, FileClock, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import NotificationCenter from './NotificationCenter';

const NavLink = ({ to, children, className, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${isActive ? 'text-purple-600' : 'text-slate-600 hover:text-purple-600'} ${className}`}
    >
      {children}
    </Link>
  );
};

const NavDropdown = ({ title, icon: Icon, items }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = items.some(item => location.pathname.startsWith(item.path));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center text-sm font-medium transition-colors ${isActive ? 'text-purple-600' : 'text-slate-600 hover:text-purple-600'}`}>
          {Icon && <Icon className="w-4 h-4 mr-1.5" />}
          {title}
          <ChevronDown className="w-4 h-4 ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white w-56">
        {items.map(item => (
          <DropdownMenuItem key={item.path} onSelect={() => navigate(item.path)} className="cursor-pointer">
            <item.icon className="w-4 h-4 mr-2" />
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been successfully signed out." });
    navigate('/');
  };

  const guestNav = [
    { name: 'Home', path: '/' },
    { name: 'Platform Tour', path: '/platform-tour' },
    { name: 'Membership', path: '/membership' },
    { name: 'About', path: '/about' },
  ];

  const memberNav = {
    links: [
      { name: 'Dashboard', path: '/member-dashboard', icon: LayoutDashboard },
      { name: 'Properties', path: '/properties', icon: Building2 },
      { name: 'My Pipeline', path: '/my-pipeline', icon: Columns },
    ],
    dropdowns: [
      {
        title: 'Lead Generation',
        icon: Search,
        items: [
          { name: 'Property Lookup', path: '/property-lookup', icon: FileSearch },
          { name: 'Upcoming Auctions', path: '/auctions-leads', icon: Search },
          { name: 'Lead Marketplace', path: '/lead-marketplace', icon: ShoppingCart },
          { name: 'Tax Delinquent Leads', path: '/tax-delinquent-leads', icon: ListFilter },
          { name: 'Redeemable Deeds', path: '/redeemable-deeds', icon: FileClock },
          { name: 'Scout AI', path: '/scout-agent', icon: UserCheck },
          { name: 'Upload Leads', path: '/lead-upload', icon: UploadCloud },
        ]
      },
      {
        title: 'Deal Tools',
        icon: Zap,
        items: [
          { name: 'Buyer-Match Graph', path: '/buyer-match', icon: Users },
          { name: 'AI Dispo Copilot', path: '/deal-microsite', icon: Zap },
          { name: 'Deal Rescue Engine', path: '/deal-rescue', icon: Handshake },
        ]
      },
      {
        title: 'Resources',
        icon: Briefcase,
        items: [
          { name: 'Funding Portal', path: '/funding-portal', icon: Handshake },
          { name: 'Affiliate Program', path: '/affiliate-program', icon: Users },
          { name: 'Developer Hub', path: '/developer-hub', icon: Terminal },
        ]
      }
    ]
  };

  const renderDesktopNav = () => {
    if (user) {
      return (
        <>
          {memberNav.links.map(item => <NavLink key={item.path} to={item.path}>{item.name}</NavLink>)}
          {memberNav.dropdowns.map(dd => <NavDropdown key={dd.title} {...dd} />)}
          {isAdmin && <NavLink to="/admin" className="font-bold text-red-500 hover:text-red-600">Admin</NavLink>}
        </>
      );
    }
    return guestNav.map(item => <NavLink key={item.path} to={item.path}>{item.name}</NavLink>);
  };

  const renderMobileNav = () => {
    if (user) {
      return (
        <>
          {memberNav.links.map(item => <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)}>{item.name}</NavLink>)}
          {memberNav.dropdowns.map(dd => (
            <div key={dd.title}>
              <p className="text-slate-500 text-sm font-bold mt-4 mb-2">{dd.title}</p>
              {dd.items.map(subItem => (
                <NavLink key={subItem.path} to={subItem.path} onClick={() => setIsOpen(false)} className="block pl-4 py-1">
                  <subItem.icon className="inline-block mr-2 h-4 w-4" />
                  {subItem.name}
                </NavLink>
              ))}
            </div>
          ))}
          {isAdmin && <NavLink to="/admin" onClick={() => setIsOpen(false)} className="font-bold text-red-500">Admin</NavLink>}
        </>
      );
    }
    return guestNav.map(item => <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)}>{item.name}</NavLink>);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Win With Deeds</span>
        </Link>

        <nav className="hidden lg:flex items-center space-x-6">{renderDesktopNav()}</nav>

        <div className="flex items-center space-x-2">
          {user ? (
            <div className="hidden md:flex items-center space-x-2">
              <NotificationCenter />
              <Button variant="ghost" onClick={() => navigate('/profile')}>Profile</Button>
              <Button onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>Log In</Button>
              <Button onClick={() => navigate('/register')} className="bg-purple-600 hover:bg-purple-700 text-white">Sign Up</Button>
            </div>
          )}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-slate-600 hover:text-purple-600"><span className="sr-only">Open menu</span>{isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
        </div>
      </div>

      {isOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden py-4 border-t border-slate-200">
          <div className="container mx-auto px-4 space-y-4">
            {renderMobileNav()}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {user ? (
                <>
                  <NavLink to="/profile" onClick={() => setIsOpen(false)}>Profile</NavLink>
                  <Button onClick={() => { handleSignOut(); setIsOpen(false); }} className="w-full">Sign Out</Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" onClick={() => { navigate('/login'); setIsOpen(false); }}>Log In</Button>
                  <Button onClick={() => { navigate('/register'); setIsOpen(false); }} className="bg-purple-600 hover:bg-purple-700 text-white">Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Navbar;