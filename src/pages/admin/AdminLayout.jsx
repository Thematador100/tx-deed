import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Library, Zap, Bot, HeartHandshake, KeyRound, Building, ListFilter, FileClock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const sidebarNavItems = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Properties", href: "/admin/properties", icon: Building },
    { title: "Tax Leads", href: "/admin/tax-leads", icon: ListFilter },
    { title: "Redeemable Deeds", href: "/admin/redeemable-deeds", icon: FileClock },
    { title: "Transactions", href: "/admin/transactions", icon: CreditCard },
    { title: "Library", href: "/admin/library", icon: Library },
    { title: "Integrations", href: "/admin/integrations", icon: Zap },
    { title: "AI Workforce", href: "/admin/ai-workforce", icon: Bot },
    { title: "Affiliates", href: "/admin/affiliates", icon: HeartHandshake },
    { title: "API Keys", href: "/admin/api-keys", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 flex-shrink-0">
            <nav className="flex flex-row md:flex-col gap-2">
              {sidebarNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.title}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;