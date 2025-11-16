import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Search, Filter, Bell, ExternalLink, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const AuctionCalendar = () => {
  const [selectedState, setSelectedState] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // calendar or list

  // Mock auction data - in production this would come from API
  const upcomingAuctions = [
    {
      id: 1,
      county: 'Maricopa County',
      state: 'Arizona',
      date: '2025-11-20',
      time: '10:00 AM',
      location: 'County Courthouse',
      type: 'Tax Deed',
      propertiesCount: 142,
      registrationDeadline: '2025-11-18',
      contactPhone: '(602) 555-0100',
      website: 'https://maricopa.gov/auctions',
      requirements: ['Photo ID', 'Deposit: $5,000', 'Registration form'],
      notes: 'Online and in-person bidding available'
    },
    {
      id: 2,
      county: 'Miami-Dade County',
      state: 'Florida',
      date: '2025-11-22',
      time: '9:00 AM',
      location: 'Online Only',
      type: 'Tax Lien Certificate',
      propertiesCount: 287,
      registrationDeadline: '2025-11-20',
      contactPhone: '(305) 555-0200',
      website: 'https://miamidade.gov/taxsale',
      requirements: ['Online registration', 'Deposit: 10% of bid'],
      notes: 'Competitive bidding down on interest rate'
    },
    {
      id: 3,
      county: 'Cook County',
      state: 'Illinois',
      date: '2025-11-25',
      time: '11:00 AM',
      location: 'Daley Center',
      type: 'Tax Deed',
      propertiesCount: 198,
      registrationDeadline: '2025-11-23',
      contactPhone: '(312) 555-0300',
      website: 'https://cookcountyil.gov/sales',
      requirements: ['Government-issued ID', 'Deposit: $1,000 minimum'],
      notes: 'Annual scavenger sale - significant opportunities'
    },
    {
      id: 4,
      county: 'Harris County',
      state: 'Texas',
      date: '2025-11-27',
      time: '10:00 AM',
      location: 'County Administration Building',
      type: 'Tax Deed',
      propertiesCount: 231,
      registrationDeadline: '2025-11-26',
      contactPhone: '(713) 555-0400',
      website: 'https://hctax.net',
      requirements: ['Photo ID', 'Cashier\'s check or cash only'],
      notes: 'First Tuesday of each month'
    },
    {
      id: 5,
      county: 'Fulton County',
      state: 'Georgia',
      date: '2025-12-01',
      time: '10:00 AM',
      location: 'County Courthouse Steps',
      type: 'Tax Deed',
      propertiesCount: 156,
      registrationDeadline: '2025-11-29',
      contactPhone: '(404) 555-0500',
      website: 'https://fultoncountyga.gov',
      requirements: ['Photo ID', 'Cash or certified funds'],
      notes: 'First Tuesday of month - traditional auction style'
    }
  ];

  const states = [
    { code: 'all', name: 'All States' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'FL', name: 'Florida' },
    { code: 'IL', name: 'Illinois' },
    { code: 'TX', name: 'Texas' },
    { code: 'GA', name: 'Georgia' },
    { code: 'CA', name: 'California' },
    { code: 'NY', name: 'New York' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'OH', name: 'Ohio' },
    { code: 'NV', name: 'Nevada' }
  ];

  const filteredAuctions = useMemo(() => {
    return upcomingAuctions.filter(auction => {
      const matchesState = selectedState === 'all' || auction.state.includes(states.find(s => s.code === selectedState)?.name || '');
      const matchesSearch = auction.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           auction.state.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [selectedState, searchTerm, upcomingAuctions]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Auction Calendar - Tax Deed Pro</title>
        <meta name="description" content="Never miss a tax deed auction. Track auctions across all 50 states with our comprehensive calendar." />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Auction Calendar</h1>
          </div>
          <p className="text-lg text-slate-600">
            Track tax deed and tax lien auctions across all 50 states. Get alerts, registration info, and important deadlines.
          </p>
        </motion.div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Search County</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search county or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {states.map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Bell className="w-4 h-4 mr-2" />
                Set Alerts
              </Button>
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Auction List */}
        <div className="space-y-6">
          {filteredAuctions.map((auction, index) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-1">{auction.county}</h3>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{auction.state}</span>
                          <span className="mx-2">•</span>
                          <span className="font-semibold text-purple-600">{auction.type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Auction Date & Time</p>
                        <p className="font-semibold text-slate-900">{new Date(auction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-slate-700">{auction.time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Location</p>
                        <p className="font-semibold text-slate-900">{auction.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Properties Available</p>
                        <p className="text-2xl font-bold text-purple-600">{auction.propertiesCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Registration Deadline</p>
                        <p className="font-semibold text-slate-900">{new Date(auction.registrationDeadline).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {auction.requirements.map((req, idx) => (
                          <li key={idx} className="text-slate-600">{req}</li>
                        ))}
                      </ul>
                    </div>

                    {auction.notes && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800"><span className="font-semibold">Note:</span> {auction.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:w-64">
                    <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                      <Bell className="w-4 h-4 mr-2" />
                      Set Reminder
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={auction.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Official Website
                      </a>
                    </Button>
                    <div className="text-sm text-slate-600">
                      <p className="font-semibold mb-1">Contact:</p>
                      <p>{auction.contactPhone}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Auctions Found</h3>
            <p className="text-slate-600">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AuctionCalendar;
