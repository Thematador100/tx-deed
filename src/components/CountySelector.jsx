/**
 * COUNTY SELECTOR COMPONENT
 *
 * Advanced multi-select component for choosing from all 3,000+ US counties
 * Features:
 * - Search by county name, state, or FIPS code
 * - Filter by state
 * - Group by state
 * - Show data availability indicators
 * - Bulk selection tools
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, X, MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { customSupabase } from '../lib/customSupabaseClient';

const CountySelector = ({ selectedCounties = [], onChange, maxSelections = 50 }) => {
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('all');
    const [isOpen, setIsOpen] = useState(false);

    // Fetch all counties from database
    useEffect(() => {
        fetchCounties();
    }, []);

    const fetchCounties = async () => {
        setLoading(true);

        const { data, error } = await customSupabase
            .from('counties')
            .select('*')
            .eq('is_active', true)
            .order('state_code')
            .order('county_name');

        if (error) {
            console.error('Error fetching counties:', error);
        } else {
            setCounties(data || []);
        }

        setLoading(false);
    };

    // Get unique states
    const states = useMemo(() => {
        const stateSet = new Set(counties.map(c => c.state_code));
        return Array.from(stateSet).sort();
    }, [counties]);

    // Filter counties based on search and state
    const filteredCounties = useMemo(() => {
        let filtered = counties;

        // Filter by state
        if (selectedState !== 'all') {
            filtered = filtered.filter(c => c.state_code === selectedState);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.county_name.toLowerCase().includes(query) ||
                c.state_name.toLowerCase().includes(query) ||
                c.state_code.toLowerCase().includes(query) ||
                c.fips_code.includes(query) ||
                (c.county_seat && c.county_seat.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [counties, searchQuery, selectedState]);

    // Group counties by state
    const groupedCounties = useMemo(() => {
        const groups = {};

        filteredCounties.forEach(county => {
            if (!groups[county.state_code]) {
                groups[county.state_code] = {
                    stateName: county.state_name,
                    stateCode: county.state_code,
                    counties: []
                };
            }
            groups[county.state_code].counties.push(county);
        });

        return Object.values(groups);
    }, [filteredCounties]);

    // Handle county selection
    const toggleCounty = (countyId) => {
        if (selectedCounties.includes(countyId)) {
            onChange(selectedCounties.filter(id => id !== countyId));
        } else {
            if (selectedCounties.length < maxSelections) {
                onChange([...selectedCounties, countyId]);
            } else {
                alert(`Maximum ${maxSelections} counties can be selected`);
            }
        }
    };

    // Bulk actions
    const selectAllInState = (stateCode) => {
        const stateCountyIds = counties
            .filter(c => c.state_code === stateCode)
            .map(c => c.id)
            .slice(0, maxSelections - selectedCounties.length);

        onChange([...new Set([...selectedCounties, ...stateCountyIds])]);
    };

    const clearAll = () => {
        onChange([]);
    };

    // Get selected county details
    const selectedCountyDetails = useMemo(() => {
        return counties.filter(c => selectedCounties.includes(c.id));
    }, [counties, selectedCounties]);

    // Data availability badge
    const DataAvailabilityBadge = ({ county }) => {
        if (county.scraper_status === 'active') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                </span>
            );
        } else if (county.scraper_status === 'pending') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Setup
                </span>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selected Counties Display */}
            {selectedCountyDetails.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-blue-900">
                            Selected Counties ({selectedCountyDetails.length}/{maxSelections})
                        </h4>
                        <button
                            onClick={clearAll}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear All
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedCountyDetails.map(county => (
                            <span
                                key={county.id}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-blue-200 text-blue-800"
                            >
                                <MapPin className="w-3 h-3 mr-1" />
                                {county.county_name}, {county.state_code}
                                <button
                                    onClick={() => toggleCounty(county.id)}
                                    className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search counties, states, or FIPS codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">All States</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            {/* County List */}
            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {groupedCounties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No counties found matching your search
                    </div>
                ) : (
                    groupedCounties.map(group => (
                        <div key={group.stateCode} className="border-b last:border-b-0">
                            {/* State Header */}
                            <div className="bg-gray-50 px-4 py-2 flex items-center justify-between sticky top-0">
                                <h5 className="font-semibold text-gray-700">
                                    {group.stateName} ({group.counties.length})
                                </h5>
                                <button
                                    onClick={() => selectAllInState(group.stateCode)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    Select All
                                </button>
                            </div>

                            {/* Counties in State */}
                            {group.counties.map(county => {
                                const isSelected = selectedCounties.includes(county.id);

                                return (
                                    <div
                                        key={county.id}
                                        onClick={() => toggleCounty(county.id)}
                                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                                            isSelected ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                            }`}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {county.county_name} {county.county_type}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {county.county_seat && `Seat: ${county.county_seat}`}
                                                    {county.population && ` · Pop: ${county.population.toLocaleString()}`}
                                                    {county.auction_type && ` · ${county.auction_type}`}
                                                </div>
                                            </div>
                                        </div>

                                        <DataAvailabilityBadge county={county} />
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>

            {/* Stats Footer */}
            <div className="text-sm text-gray-600 flex justify-between">
                <span>
                    Showing {filteredCounties.length} of {counties.length} counties
                </span>
                <span>
                    {counties.filter(c => c.scraper_status === 'active').length} with active data
                </span>
            </div>
        </div>
    );
};

export default CountySelector;
