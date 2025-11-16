import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  BookOpen, Video, FileText, Award, Users, Search,
  Play, Download, CheckCircle2, Star, Clock, TrendingUp,
  MessageSquare, Calendar as CalendarIcon, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EducationCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const courses = [
    {
      id: 1,
      title: 'Tax Deed Investing Fundamentals',
      category: 'beginner',
      type: 'video',
      duration: '3.5 hours',
      lessons: 24,
      rating: 4.9,
      students: 2847,
      description: 'Master the basics of tax deed investing from property research to closing your first deal.',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173',
      instructor: 'John Martinez',
      topics: ['Finding Properties', 'Due Diligence', 'Auction Strategies', 'Legal Basics']
    },
    {
      id: 2,
      title: 'State-Specific Strategies: Florida',
      category: 'intermediate',
      type: 'video',
      duration: '2 hours',
      lessons: 15,
      rating: 4.8,
      students: 1523,
      description: 'Complete guide to Florida tax deed sales, including county-specific procedures and laws.',
      image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84',
      instructor: 'Sarah Chen',
      topics: ['FL Statute 197', 'County Procedures', 'Quiet Title', 'Case Studies']
    },
    {
      id: 3,
      title: 'Advanced Due Diligence Techniques',
      category: 'advanced',
      type: 'video',
      duration: '4 hours',
      lessons: 32,
      rating: 5.0,
      students: 934,
      description: 'Deep dive into title research, lien analysis, environmental checks, and risk assessment.',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
      instructor: 'Michael Roberts',
      topics: ['Title Chains', 'Lien Priority', 'Environmental Reports', 'Property Inspections']
    },
    {
      id: 4,
      title: 'Scaling Your Tax Deed Business',
      category: 'advanced',
      type: 'video',
      duration: '5 hours',
      lessons: 28,
      rating: 4.9,
      students: 1267,
      description: 'Build systems, hire teams, raise capital, and scale from 1-2 deals to 10+ per month.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
      instructor: 'David Thompson',
      topics: ['Team Building', 'Capital Raising', 'Systems', 'Portfolio Management']
    }
  ];

  const stateGuides = [
    { state: 'Arizona', type: 'Tax Deed', redemption: 'None', frequency: 'Monthly', pages: 45 },
    { state: 'Florida', type: 'Tax Deed', redemption: 'None', frequency: 'Varies by County', pages: 67 },
    { state: 'Georgia', type: 'Tax Deed', redemption: '1 Year', frequency: 'First Tuesday', pages: 52 },
    { state: 'Texas', type: 'Tax Deed', redemption: '6 Months - 2 Years', frequency: 'First Tuesday', pages: 78 },
    { state: 'Illinois', type: 'Tax Deed', redemption: '2-3 Years', frequency: 'Annual', pages: 61 },
    { state: 'Indiana', type: 'Tax Lien/Deed', redemption: '1 Year', frequency: 'Varies', pages: 43 },
    { state: 'California', type: 'Tax Deed', redemption: 'None', frequency: 'Varies', pages: 89 },
    { state: 'Pennsylvania', type: 'Tax Deed', redemption: 'None', frequency: 'Varies', pages: 55 }
  ];

  const webinars = [
    {
      id: 1,
      title: 'Q4 2025 Market Opportunities',
      date: '2025-11-20',
      time: '7:00 PM EST',
      host: 'Expert Panel',
      attendees: 342,
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Title Issues & How to Resolve Them',
      date: '2025-11-25',
      time: '6:00 PM EST',
      host: 'Attorney Sarah Mills',
      attendees: 278,
      status: 'upcoming'
    },
    {
      id: 3,
      title: 'Finding Hidden Gem Properties',
      date: '2025-11-13',
      time: '7:00 PM EST',
      host: 'John Martinez',
      attendees: 512,
      status: 'recorded'
    }
  ];

  const resources = [
    {
      category: 'Checklists & Templates',
      items: [
        { name: 'Property Research Checklist', downloads: 5432, format: 'PDF' },
        { name: 'Due Diligence Worksheet', downloads: 4821, format: 'Excel' },
        { name: 'Auction Day Checklist', downloads: 3967, format: 'PDF' },
        { name: 'Assignment Contract Template', downloads: 2845, format: 'Word' }
      ]
    },
    {
      category: 'Legal Documents',
      items: [
        { name: 'Quiet Title Action Guide', downloads: 2134, format: 'PDF' },
        { name: 'Redemption Rights by State', downloads: 3456, format: 'PDF' },
        { name: 'Surplus Funds Recovery Guide', downloads: 1876, format: 'PDF' }
      ]
    },
    {
      category: 'Case Studies',
      items: [
        { name: '10 Profitable Tax Deed Deals Analyzed', downloads: 6543, format: 'PDF' },
        { name: 'Lessons from Failed Investments', downloads: 4321, format: 'PDF' },
        { name: 'From $10K to $1M Portfolio', downloads: 7865, format: 'PDF' }
      ]
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Education Center - Tax Deed Pro</title>
        <meta name="description" content="Comprehensive training library with courses, guides, webinars, and resources for tax deed investing." />
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
            <BookOpen className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-slate-900">Education Center</h1>
          </div>
          <p className="text-lg text-slate-600">
            Everything you need to master tax deed investing - from beginner fundamentals to advanced strategies.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">120+</div>
            <div className="text-sm text-slate-600">Video Lessons</div>
          </Card>
          <Card className="p-6 text-center">
            <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">50</div>
            <div className="text-sm text-slate-600">State Guides</div>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">15K+</div>
            <div className="text-sm text-slate-600">Students</div>
          </Card>
          <Card className="p-6 text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">40+</div>
            <div className="text-sm text-slate-600">Expert Instructors</div>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="courses">Video Courses</TabsTrigger>
            <TabsTrigger value="guides">State Guides</TabsTrigger>
            <TabsTrigger value="webinars">Webinars</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Video Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'beginner', 'intermediate', 'advanced'].map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="h-48 bg-slate-200 relative overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                        {course.category}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                      <p className="text-slate-600 mb-4">{course.description}</p>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          <span>{course.lessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{course.rating}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-slate-600 mb-2">Topics covered:</div>
                        <div className="flex flex-wrap gap-2">
                          {course.topics.map((topic, idx) => (
                            <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-slate-600">
                          by {course.instructor}
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <Play className="w-4 h-4 mr-2" />
                          Start Course
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* State Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Complete State-by-State Guides</h3>
              <p className="text-slate-600 mb-6">
                Comprehensive guides for every state covering laws, procedures, timelines, and strategies.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stateGuides.map((guide, index) => (
                  <motion.div
                    key={guide.state}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-bold text-slate-900">{guide.state}</h4>
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Type:</span>
                        <span className="font-semibold">{guide.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Redemption:</span>
                        <span className="font-semibold">{guide.redemption}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Frequency:</span>
                        <span className="font-semibold">{guide.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pages:</span>
                        <span className="font-semibold">{guide.pages}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Guide
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Webinars Tab */}
          <TabsContent value="webinars" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Upcoming Webinars</h3>
                <div className="space-y-4">
                  {webinars.filter(w => w.status === 'upcoming').map((webinar) => (
                    <div key={webinar.id} className="border-l-4 border-purple-600 pl-4 py-2">
                      <h4 className="font-bold text-slate-900 mb-2">{webinar.title}</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{new Date(webinar.date).toLocaleDateString()} at {webinar.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{webinar.attendees} registered</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Hosted by {webinar.host}</span>
                        </div>
                      </div>
                      <Button className="mt-3 bg-purple-600 hover:bg-purple-700">
                        Register Now
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Recorded Webinars</h3>
                <div className="space-y-4">
                  {webinars.filter(w => w.status === 'recorded').map((webinar) => (
                    <div key={webinar.id} className="border-l-4 border-slate-300 pl-4 py-2">
                      <h4 className="font-bold text-slate-900 mb-2">{webinar.title}</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Recorded {new Date(webinar.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{webinar.attendees} attendees</span>
                        </div>
                      </div>
                      <Button className="mt-3" variant="outline">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Recording
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            {resources.map((resourceCategory, catIndex) => (
              <Card key={catIndex} className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">{resourceCategory.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourceCategory.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.name}</h4>
                          <p className="text-sm text-slate-600">{item.downloads.toLocaleString()} downloads • {item.format}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EducationCenter;
