/**
 * ADMIN COUNTIES MANAGEMENT
 *
 * Comprehensive admin interface for managing all 3,000+ US counties
 * Features:
 * - View all counties with stats
 * - Filter by state, status, auction type
 * - Edit county configurations
 * - Manage scraper settings
 * - View scraper job history
 * - Monitor data quality
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { customSupabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Search,
    Filter,
    RefreshCw,
    Edit,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    BarChart3,
    Download,
    Play
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const AdminCounties = () => {
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stateFilter, setStateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingCounty, setEditingCounty] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchCounties();
        fetchStats();
    }, []);

    const fetchCounties = async () => {
        setLoading(true);
        const { data, error } = await customSupabase
            .from('counties')
            .select('*')
            .order('state_code')
            .order('county_name');

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch counties',
                variant: 'destructive'
            });
        } else {
            setCounties(data || []);
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        // Fetch aggregate statistics
        const { data, error } = await customSupabase
            .from('scraper_performance_metrics')
            .select('*');

        if (!error && data) {
            setStats(
                data.reduce((acc, state) => {
                    acc.totalCounties = (acc.totalCounties || 0) + state.total_counties;
                    acc.activeScrapers = (acc.activeScrapers || 0) + state.active_scrapers;
                    acc.totalProperties = (acc.totalProperties || 0) + state.total_properties_tracked;
                    return acc;
                }, {})
            );
        }
    };

    // Get unique states
    const states = useMemo(() => {
        const stateSet = new Set(counties.map(c => c.state_code));
        return Array.from(stateSet).sort();
    }, [counties]);

    // Filter counties
    const filteredCounties = useMemo(() => {
        return counties.filter(county => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    county.county_name.toLowerCase().includes(query) ||
                    county.state_name.toLowerCase().includes(query) ||
                    county.state_code.toLowerCase().includes(query) ||
                    county.fips_code.includes(query);

                if (!matchesSearch) return false;
            }

            // State filter
            if (stateFilter !== 'all' && county.state_code !== stateFilter) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all' && county.scraper_status !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [counties, searchQuery, stateFilter, statusFilter]);

    const handleEditCounty = (county) => {
        setEditingCounty(county);
        setIsEditDialogOpen(true);
    };

    const handleSaveCounty = async (updatedData) => {
        const { error } = await customSupabase
            .from('counties')
            .update(updatedData)
            .eq('id', editingCounty.id);

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to update county',
                variant: 'destructive'
            });
        } else {
            toast({ title: 'County updated successfully' });
            fetchCounties();
            setIsEditDialogOpen(false);
        }
    };

    const handleStartScraper = async (countyId) => {
        const { error } = await customSupabase.from('scraper_jobs').insert({
            county_id: countyId,
            job_type: 'full_scrape',
            status: 'queued',
            priority: 8
        });

        if (error) {
            toast({
                title: 'Error',
                description: 'Failed to start scraper',
                variant: 'destructive'
            });
        } else {
            toast({ title: 'Scraper job queued' });
        }
    };

    const exportCounties = () => {
        const csv = [
            ['FIPS', 'State', 'County', 'Status', 'Auction Type', 'Population', 'Data Score'].join(','),
            ...filteredCounties.map(c =>
                [
                    c.fips_code,
                    c.state_code,
                    c.county_name,
                    c.scraper_status,
                    c.auction_type,
                    c.population,
                    c.data_completeness_score
                ].join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'counties_export.csv';
        a.click();
    };

    const StatusBadge = ({ status }) => {
        const badges = {
            active: {
                icon: CheckCircle,
                className: 'bg-green-100 text-green-800',
                label: 'Active'
            },
            pending: {
                icon: Clock,
                className: 'bg-yellow-100 text-yellow-800',
                label: 'Pending'
            },
            failed: {
                icon: XCircle,
                className: 'bg-red-100 text-red-800',
                label: 'Failed'
            }
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Helmet>
                <title>Manage Counties - Admin Dashboard</title>
            </Helmet>

            <AdminSidebar />

            <div className="flex-1 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">County Management</h1>
                    <p className="text-slate-600">
                        Manage all {counties.length} US counties and their data sources
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total Counties</p>
                                <p className="text-2xl font-bold text-slate-900">{counties.length}</p>
                            </div>
                            <MapPin className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Active Scrapers</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {counties.filter(c => c.scraper_status === 'active').length}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Pending Setup</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {counties.filter(c => c.scraper_status === 'pending').length}
                                </p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500" />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Failed</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {counties.filter(c => c.scraper_status === 'failed').length}
                                </p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <Input
                                    placeholder="Search by county, state, or FIPS..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <select
                            value={stateFilter}
                            onChange={e => setStateFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All States</option>
                            {states.map(state => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>

                        <Button onClick={fetchCounties} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>

                        <Button onClick={exportCounties} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Counties Table */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            County
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            FIPS
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Population
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Auction Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Data Score
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Last Scraped
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredCounties.map(county => (
                                        <tr key={county.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {county.county_name} {county.county_type}
                                                        </div>
                                                        <div className="text-sm text-slate-500">
                                                            {county.state_name} ({county.state_code})
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {county.fips_code}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {county.population?.toLocaleString() || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {county.auction_type || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={county.scraper_status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{
                                                                width: `${county.data_completeness_score || 0}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-slate-600">
                                                        {county.data_completeness_score || 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {county.last_scraped_at
                                                    ? new Date(county.last_scraped_at).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleStartScraper(county.id)}
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditCounty(county)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Results Summary */}
                <div className="mt-4 text-sm text-slate-600">
                    Showing {filteredCounties.length} of {counties.length} counties
                </div>
            </div>

            {/* Edit County Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editingCounty?.county_name}, {editingCounty?.state_code}
                        </DialogTitle>
                        <DialogDescription>
                            Update county information and scraper configuration
                        </DialogDescription>
                    </DialogHeader>

                    {editingCounty && (
                        <CountyEditForm
                            county={editingCounty}
                            onSave={handleSaveCounty}
                            onCancel={() => setIsEditDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

const CountyEditForm = ({ county, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        tax_deed_website_url: county.tax_deed_website_url || '',
        auction_calendar_url: county.auction_calendar_url || '',
        scraper_status: county.scraper_status || 'pending',
        auction_type: county.auction_type || 'Tax Deed',
        is_active: county.is_active,
        is_premium: county.is_premium
    });

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Tax Deed Website URL</Label>
                <Input
                    value={formData.tax_deed_website_url}
                    onChange={e =>
                        setFormData({ ...formData, tax_deed_website_url: e.target.value })
                    }
                    placeholder="https://..."
                />
            </div>

            <div>
                <Label>Auction Calendar URL</Label>
                <Input
                    value={formData.auction_calendar_url}
                    onChange={e =>
                        setFormData({ ...formData, auction_calendar_url: e.target.value })
                    }
                    placeholder="https://..."
                />
            </div>

            <div>
                <Label>Scraper Status</Label>
                <select
                    value={formData.scraper_status}
                    onChange={e => setFormData({ ...formData, scraper_status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            <div>
                <Label>Auction Type</Label>
                <select
                    value={formData.auction_type}
                    onChange={e => setFormData({ ...formData, auction_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                    <option value="Tax Deed">Tax Deed</option>
                    <option value="Tax Lien">Tax Lien</option>
                    <option value="Redeemable Deed">Redeemable Deed</option>
                    <option value="Hybrid">Hybrid</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_premium"
                    checked={formData.is_premium}
                    onChange={e => setFormData({ ...formData, is_premium: e.target.checked })}
                />
                <Label htmlFor="is_premium">Premium County</Label>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit}>Save Changes</Button>
            </DialogFooter>
        </div>
    );
};

export default AdminCounties;
