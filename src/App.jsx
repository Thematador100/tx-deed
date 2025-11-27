import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import Profile from '@/pages/Profile';
import PropertyDetails from '@/pages/PropertyDetails';
import BuyerMatch from '@/pages/BuyerMatch';
import DealDossier from '@/pages/DealDossier';
import DealMicrosite from '@/pages/DealMicrosite';
import Outreach from '@/pages/Outreach';
import DealRescue from '@/pages/DealRescue';
import Automation from '@/pages/Automation';
import Membership from '@/pages/Membership';
import Leads from '@/pages/Leads';
import LeadMarketplace from '@/pages/LeadMarketplace';
import AIWorkforce from '@/pages/AIWorkforce';
import LeadUpload from '@/pages/LeadUpload';
import MyPipeline from '@/pages/MyPipeline';
import Calendar from '@/pages/Calendar';
import Checkout from '@/pages/Checkout';
import DeveloperHub from '@/pages/DeveloperHub';
import FundingPortal from '@/pages/FundingPortal';
import ScoutAgent from '@/pages/ScoutAgent';
import AffiliateProgram from '@/pages/AffiliateProgram';
import PropertyLookup from '@/pages/PropertyLookup';
import About from '@/pages/About';
import TaxDelinquentLeads from '@/pages/TaxDelinquentLeads';
import RedeemableDeeds from '@/pages/RedeemableDeeds';
import PlatformTour from '@/pages/PlatformTour';
import CountyScraper from '@/pages/CountyScraper';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import AdminLibrary from '@/pages/admin/AdminLibrary';
import AdminIntegrations from '@/pages/admin/AdminIntegrations';
import AdminAIWorkforce from '@/pages/admin/AdminAIWorkforce';
import AdminAffiliates from '@/pages/admin/AdminAffiliates';
import AdminApiKeys from '@/pages/admin/AdminApiKeys';
import AdminProperties from '@/pages/admin/AdminProperties';
import LibrarianChat from '@/components/LibrarianChat';
import AdminLayout from '@/pages/admin/AdminLayout';
import MemberDashboard from '@/pages/MemberDashboard';
import ProtectedRoute from '@/components/ProtectedRoute';
import CheckEmail from '@/pages/CheckEmail';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import SetupAdmin from '@/pages/SetupAdmin';
import DoneForYouTraining from '@/pages/DoneForYouTraining';
import PropertyAnalysisService from '@/pages/PropertyAnalysisService';
import QuietTitleService from '@/pages/QuietTitleService';
import Messages from '@/pages/Messages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white text-slate-800 flex flex-col">
          <Helmet>
            <title>Win With Deeds - The Premier Tax Deed Investment Platform</title>
            <meta name="description" content="Discover, analyze, and invest in tax deed properties. Access upcoming auctions, buy/sell marketplace, and expert resources all in one place." />
          </Helmet>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/platform-tour" element={<PlatformTour />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/affiliate-program" element={<AffiliateProgram />} />
            <Route path="/about" element={<About />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/setup-admin" element={<SetupAdmin />} />
                        <Route path="/training" element={<DoneForYouTraining />} />
            <Route path="/analysis-service" element={<PropertyAnalysisService />} />
            <Route path="/quiet-title-service" element={<QuietTitleService />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Member Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
            <Route path="/property/:id" element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/buyer-match" element={<ProtectedRoute><BuyerMatch /></ProtectedRoute>} />
                      <Route path="/deal-dossier" element={<ProtectedRoute><DealDossier /></ProtectedRoute>} />
            <Route path="/deal-microsite" element={<ProtectedRoute><DealMicrosite /></ProtectedRoute>} />
            <Route path="/outreach" element={<ProtectedRoute><Outreach /></ProtectedRoute>} />
            <Route path="/deal-rescue" element={<ProtectedRoute><DealRescue /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="/auctions-leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/lead-marketplace" element={<ProtectedRoute><LeadMarketplace /></ProtectedRoute>} />
            <Route path="/ai-workforce" element={<ProtectedRoute><AIWorkforce /></ProtectedRoute>} />
            <Route path="/lead-upload" element={<ProtectedRoute><LeadUpload /></ProtectedRoute>} />
            <Route path="/my-pipeline" element={<ProtectedRoute><MyPipeline /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/developer-hub" element={<ProtectedRoute><DeveloperHub /></ProtectedRoute>} />
            <Route path="/funding-portal" element={<ProtectedRoute><FundingPortal /></ProtectedRoute>} />
            <Route path="/scout-agent" element={<RoleProtectedRoute allowedRoles={['admin', 'Mentee Elite']}><ScoutAgent /></RoleProtectedRoute>} />
            <Route path="/property-lookup" element={<ProtectedRoute><PropertyLookup /></ProtectedRoute>} />
            <Route path="/tax-delinquent-leads" element={<ProtectedRoute><TaxDelinquentLeads /></ProtectedRoute>} />
            <Route path="/redeemable-deeds" element={<ProtectedRoute><RedeemableDeeds /></ProtectedRoute>} />
            <Route path="/county-scraper" element={<ProtectedRoute><CountyScraper /></ProtectedRoute>} />
            <Route path="/member-dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><AdminLayout><AdminTransactions /></AdminLayout></AdminRoute>} />
            <Route path="/admin/library" element={<AdminRoute><AdminLayout><AdminLibrary /></AdminLayout></AdminRoute>} />
            <Route path="/admin/integrations" element={<AdminRoute><AdminLayout><AdminIntegrations /></AdminLayout></AdminRoute>} />
            <Route path="/admin/ai-workforce" element={<AdminRoute><AdminLayout><AdminAIWorkforce /></AdminLayout></AdminRoute>} />
            <Route path="/admin/affiliates" element={<AdminRoute><AdminLayout><AdminAffiliates /></AdminLayout></AdminRoute>} />
            <Route path="/admin/api-keys" element={<AdminRoute><AdminLayout><AdminApiKeys /></AdminLayout></AdminRoute>} />
            <Route path="/admin/properties" element={<AdminRoute><AdminLayout><AdminProperties /></AdminLayout></AdminRoute>} />
            
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <LibrarianChat />
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
