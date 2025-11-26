import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { Calendar, MapPin, DollarSign, Clock, TrendingUp, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function UpcomingTaxDeedSales() {
  const navigate = useNavigate();
  const [upcomingSales, setUpcomingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('all');
  const [timeframe, setTimeframe] = useState('30'); // days

  useEffect(() => {
    fetchUpcomingSales();
  }, [selectedState, timeframe]);

  async function fetchUpcomingSales() {
    try {
      setLoading(true);

      // Get counties with upcoming auctions
      const { data: counties, error } = await supabase
        .from('county_info')
        .select('*')
        .not('next_auction_date', 'is', null)
        .order('next_auction_date', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Filter by state if selected
      let filtered = counties || [];
      if (selectedState !== 'all') {
        filtered = filtered.filter(c => c.state_code === selectedState);
      }

      // Filter by timeframe
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + parseInt(timeframe));

      filtered = filtered.filter(c => {
        const auctionDate = new Date(c.next_auction_date);
        return auctionDate >= now && auctionDate <= futureDate;
      });

      // Enrich with property counts
      const enriched = await Promise.all(
        filtered.map(async (county) => {
          const { count } = await supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('county', county.county_name)
            .eq('state', county.state_code);

          return {
            ...county,
            property_count: count || 0,
            days_until: Math.ceil((new Date(county.next_auction_date) - now) / (1000 * 60 * 60 * 24))
          };
        })
      );

      setUpcomingSales(enriched);

    } catch (error) {
      console.error('Error fetching upcoming sales:', error);
      toast({
        title: 'Error',
        description: 'Failed to load upcoming sales',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function getUrgencyColor(daysUntil) {
    if (daysUntil <= 7) return 'bg-red-100 text-red-800 border-red-300';
    if (daysUntil <= 14) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (daysUntil <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Upcoming Tax Deed Sales
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {upcomingSales.length} auctions in the next {timeframe} days
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All States</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="CA">California</option>
            <option value="AZ">Arizona</option>
            <option value="NV">Nevada</option>
            <option value="MI">Michigan</option>
            <option value="OH">Ohio</option>
            <option value="PA">Pennsylvania</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">Next 7 Days</option>
            <option value="14">Next 2 Weeks</option>
            <option value="30">Next Month</option>
            <option value="60">Next 2 Months</option>
            <option value="90">Next 3 Months</option>
          </select>
        </div>
      </div>

      {/* Sales Grid */}
      {upcomingSales.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No upcoming auctions in the selected timeframe</p>
          <button
            onClick={() => setTimeframe('90')}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Expand timeframe →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingSales.map((sale) => (
            <div
              key={sale.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/tax-delinquent-leads?county=${sale.county_name}&state=${sale.state_code}`)}
            >
              {/* Urgency Badge */}
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${getUrgencyColor(sale.days_until)}`}>
                <Clock className="w-3 h-3" />
                {sale.days_until} {sale.days_until === 1 ? 'day' : 'days'}
              </div>

              {/* Location */}
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                {sale.county_name} County, {sale.state_code}
              </h3>

              {/* Auction Date */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">{formatDate(sale.next_auction_date)}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">Properties</div>
                  <div className="text-lg font-bold text-gray-900">{sale.property_count || sale.average_properties_per_auction || '?'}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-xs text-gray-500">Type</div>
                  <div className="text-sm font-semibold text-gray-700">{sale.auction_schedule || 'Auction'}</div>
                </div>
              </div>

              {/* Contact Info */}
              {sale.contact_phone && (
                <div className="text-xs text-gray-500 mb-2">
                  📞 {sale.contact_phone}
                </div>
              )}

              {/* Auction Website Link */}
              {sale.auction_website && (
                <a
                  href={sale.auction_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Auction Info
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/tax-delinquent-leads?county=${sale.county_name}&state=${sale.state_code}`);
                  }}
                  className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                >
                  View Properties
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/scout-agent?county=${sale.county_name}&state=${sale.state_code}`);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                >
                  Set Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      {upcomingSales.length > 0 && (
        <div className="mt-6 pt-6 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Updated daily from county sources
          </div>
          <button
            onClick={() => navigate('/county-scraper')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1"
          >
            Refresh All Data
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
