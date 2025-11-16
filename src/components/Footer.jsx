import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Twitter, Linkedin, Facebook } from 'lucide-react';

const Footer = () => {
  const footerLinks = {
    "Company": [
      { name: "About Us", path: "/about" },
      { name: "Platform Tour", path: "/platform-tour" },
      { name: "Membership", path: "/membership" },
    ],
    "Resources": [
      { name: "Affiliate Program", path: "/affiliate-program" },
      { name: "Developer Hub", path: "/developer-hub" },
      { name: "Funding Portal", path: "/funding-portal" },
    ],
    "Legal": [
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, path: "#" },
    { name: "LinkedIn", icon: Linkedin, path: "#" },
    { name: "Facebook", icon: Facebook, path: "#" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Win With Deeds</span>
            </Link>
            <p className="text-sm text-slate-400">The premier platform for tax deed investors to discover, analyze, and profit from hidden real estate opportunities.</p>
          </div>
          
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="font-semibold text-white mb-4">{title}</p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-sm text-slate-400 hover:text-white transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Win With Deeds. All rights reserved. <Link to="/admin/login" className="hover:text-white">Admin Login</Link></p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            {socialLinks.map(social => (
              <a key={social.name} href={social.path} className="text-slate-500 hover:text-white transition-colors">
                <social.icon className="w-5 h-5" />
                <span className="sr-only">{social.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;