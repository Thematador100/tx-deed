import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, FileClock, ListFilter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { mockTaxSaleProperties, mockRedeemableDeeds } from '@/lib/mockData';

const Calendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulating fetching data. In a real app, this would come from your backend.
    const taxSaleEvents = mockTaxSaleProperties.map(p => ({
      id: p.id,
      title: `Auction: ${p.address}`,
      date: p.auction_date ? parseISO(p.auction_date) : new Date(), // Fallback for missing dates
      type: 'auction',
      link: `/tax-delinquent-leads`
    }));

    const redeemableEvents = mockRedeemableDeeds.map(d => ({
      id: d.id,
      title: `Redemption Ends: ${d.address}`,
      date: parseISO(d.redemption_date),
      type: 'redemption',
      link: `/redeemable-deeds`
    }));

    setEvents([...taxSaleEvents, ...redeemableEvents]);
    setLoading(false);
  }, []);

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h2>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 text-center text-sm font-semibold text-slate-600">
        {days.map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = events.filter(event => isSameDay(event.date, day));
          return (
            <div
              key={i}
              className={`border border-slate-200 p-2 h-36 flex flex-col ${!isSameMonth(day, monthStart) ? 'bg-slate-50 text-slate-400' : 'bg-white'}`}
            >
              <span className={`font-semibold ${isSameDay(day, new Date()) ? 'text-white bg-purple-600 rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 overflow-y-auto text-xs space-y-1">
                {dayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className={`p-1 rounded truncate cursor-pointer flex items-center gap-1.5 ${event.type === 'auction' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}
                    onClick={() => event.link && navigate(event.link)}
                  >
                    {event.type === 'auction' ? <ListFilter className="w-3 h-3 flex-shrink-0" /> : <FileClock className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>My Calendar - Win With Deeds</title>
        <meta name="description" content="View your tracked auctions and important dates on your personal investment calendar." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center">
            <CalendarIcon className="w-10 h-10 mr-3 text-purple-600" /> My Calendar
          </h1>
          <p className="text-lg text-slate-600">Your central hub for all tracked auction dates and redemption deadlines.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
          {loading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-purple-600" /></div>
          ) : (
            <>
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Calendar;