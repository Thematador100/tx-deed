import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Users, MessageSquare, UserPlus, Star, MapPin, Briefcase,
  TrendingUp, Award, Search, Filter, DollarSign, Target,
  CheckCircle2, Mail, Phone
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InvestorNetwork = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const investors = [
    {
      id: 1,
      name: 'Michael Chen',
      type: 'Buyer',
      location: 'Phoenix, AZ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      rating: 4.9,
      deals: 127,
      specialties: ['Single Family', 'Land'],
      budget: '$50K - $250K',
      verified: true,
      bio: 'Looking for off-market tax deed properties in AZ and NV. Fast cash buyer, can close in 7-10 days.'
    },
    {
      id: 2,
      name: 'Sarah Williams',
      type: 'Wholesaler',
      location: 'Miami, FL',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
      rating: 5.0,
      deals: 89,
      specialties: ['Condos', 'Multi-Family'],
      budget: '$100K - $500K',
      verified: true,
      bio: 'Experienced wholesaler with a network of cash buyers. Specializing in South Florida markets.'
    },
    {
      id: 3,
      name: 'David Rodriguez',
      type: 'Partner',
      location: 'Houston, TX',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      rating: 4.8,
      deals: 234,
      specialties: ['Commercial', 'Land Development'],
      budget: '$200K - $2M',
      verified: true,
      bio: 'Seeking joint venture partners for large commercial tax deed acquisitions. 20+ years experience.'
    },
    {
      id: 4,
      name: 'Jennifer Thompson',
      type: 'Lender',
      location: 'Atlanta, GA',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      rating: 4.9,
      deals: 156,
      specialties: ['Private Money', 'Hard Money'],
      budget: '$25K - $1M',
      verified: true,
      bio: 'Private lender offering competitive rates for tax deed acquisitions. Quick approvals, flexible terms.'
    },
    {
      id: 5,
      name: 'Robert Johnson',
      type: 'Mentor',
      location: 'Las Vegas, NV',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      rating: 5.0,
      deals: 312,
      specialties: ['Strategy', 'Due Diligence'],
      budget: 'Mentorship',
      verified: true,
      bio: 'Veteran tax deed investor offering 1-on-1 mentorship. Helped 50+ students close their first deals.'
    },
    {
      id: 6,
      name: 'Lisa Martinez',
      type: 'Buyer',
      location: 'Chicago, IL',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      rating: 4.7,
      deals: 78,
      specialties: ['Rehab Projects', 'Fix & Flip'],
      budget: '$75K - $350K',
      verified: true,
      bio: 'Licensed contractor and investor. Looking for properties needing moderate to heavy renovation.'
    }
  ];

  const partnershipOpportunities = [
    {
      id: 1,
      title: 'JV Partner Needed - 50-Unit Portfolio',
      author: 'David Rodriguez',
      location: 'Houston, TX',
      investment: '$2.5M',
      type: 'Joint Venture',
      equity: '50/50 split',
      description: 'Assembling a portfolio of 50 tax deed properties. Looking for experienced partner with capital and local market knowledge.',
      experience: 'Advanced',
      responses: 12
    },
    {
      id: 2,
      title: 'Land Development Partnership - Phoenix Metro',
      author: 'Michael Chen',
      location: 'Phoenix, AZ',
      investment: '$850K',
      type: 'Development',
      equity: '60/40 split',
      description: '125 acres acquired via tax deed, zoned for residential. Seeking development partner.',
      experience: 'Intermediate',
      responses: 8
    },
    {
      id: 3,
      title: 'Wholesale Deal Flow Partnership',
      author: 'Sarah Williams',
      location: 'Miami, FL',
      investment: '$0 - Assignment fees',
      type: 'Wholesale',
      equity: 'Fee split',
      description: 'Looking for motivated wholesalers to share deal flow. I have 20+ active buyers.',
      experience: 'Beginner',
      responses: 24
    }
  ];

  const mentorPrograms = [
    {
      id: 1,
      mentor: 'Robert Johnson',
      program: 'Tax Deed Mastery',
      duration: '12 weeks',
      price: '$5,000',
      spots: '3 available',
      includes: ['Weekly 1-on-1 calls', 'Deal analysis reviews', 'Auction attendance', 'Contract templates'],
      rating: 5.0,
      students: 47
    },
    {
      id: 2,
      mentor: 'Jennifer Thompson',
      program: 'Due Diligence Deep Dive',
      duration: '8 weeks',
      price: '$3,500',
      spots: '5 available',
      includes: ['Title research training', 'Lien analysis', 'Property inspections', 'Risk assessment'],
      rating: 4.9,
      students: 32
    }
  ];

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || investor.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Investor Network - Tax Deed Pro</title>
        <meta name="description" content="Connect with buyers, partners, lenders, and mentors in the tax deed investing community." />
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
            <Users className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Investor Network</h1>
          </div>
          <p className="text-lg text-slate-600">
            Connect with buyers, wholesalers, JV partners, lenders, and mentors to grow your tax deed business.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">24.5K+</div>
            <div className="text-sm text-slate-600">Active Members</div>
          </Card>
          <Card className="p-6 text-center">
            <UserPlus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">1,234</div>
            <div className="text-sm text-slate-600">Deals Closed</div>
          </Card>
          <Card className="p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">$127M</div>
            <div className="text-sm text-slate-600">Total Volume</div>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">4.8</div>
            <div className="text-sm text-slate-600">Avg Rating</div>
          </Card>
        </div>

        <Tabs defaultValue="members" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search members by name, location, or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'Buyer', 'Wholesaler', 'Partner', 'Lender', 'Mentor'].map((type) => (
                  <Button
                    key={type}
                    onClick={() => setFilterType(type)}
                    variant={filterType === type ? 'default' : 'outline'}
                    className="capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInvestors.map((investor, index) => (
                <motion.div
                  key={investor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={investor.avatar}
                        alt={investor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-slate-900">{investor.name}</h3>
                          {investor.verified && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600" title="Verified" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                            {investor.type}
                          </span>
                          <MapPin className="w-4 h-4" />
                          <span>{investor.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{investor.rating}</span>
                          </div>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{investor.deals} deals</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 mb-4">{investor.bio}</p>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Specialties:</p>
                      <div className="flex flex-wrap gap-2">
                        {investor.specialties.map((specialty, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    {investor.budget && (
                      <div className="mb-4">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">Budget/Range:</span> {investor.budget}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="flex-1">
                        View Profile
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Partnerships Tab */}
          <TabsContent value="partnerships" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Partnership Opportunities</h3>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Post Opportunity
              </Button>
            </div>

            <div className="space-y-4">
              {partnershipOpportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-slate-900 mb-2">{opportunity.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{opportunity.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{opportunity.location}</span>
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {opportunity.type}
                      </span>
                    </div>

                    <p className="text-slate-700 mb-4">{opportunity.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Investment</p>
                        <p className="font-bold text-slate-900">{opportunity.investment}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Equity Split</p>
                        <p className="font-bold text-purple-600">{opportunity.equity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Experience Level</p>
                        <p className="font-bold text-slate-900">{opportunity.experience}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Responses</p>
                        <p className="font-bold text-blue-600">{opportunity.responses}</p>
                      </div>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Express Interest
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Mentorship Tab */}
          <TabsContent value="mentorship" className="space-y-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Mentorship Programs</h3>
              <p className="text-slate-600">Learn from experienced investors who have closed hundreds of tax deed deals.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mentorPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <Award className="w-12 h-12 text-purple-600" />
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{program.program}</h4>
                        <p className="text-slate-600">with {program.mentor}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Duration</p>
                        <p className="font-bold text-slate-900">{program.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Investment</p>
                        <p className="font-bold text-green-600">{program.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-slate-900">{program.rating}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Students</p>
                        <p className="font-bold text-slate-900">{program.students}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Program Includes:</p>
                      <ul className="space-y-1">
                        {program.includes.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-orange-800 font-semibold">{program.spots}</p>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Apply for Program
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default InvestorNetwork;
