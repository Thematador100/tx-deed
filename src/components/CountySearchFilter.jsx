import React, { useState } from 'react';
import { Search, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from '@/components/ui/card';

// Texas counties - can be expanded to other states
const TEXAS_COUNTIES = [
  'Harris', 'Dallas', 'Tarrant', 'Bexar', 'Travis', 'Collin', 'Denton',
  'Fort Bend', 'Hidalgo', 'El Paso', 'Montgomery', 'Williamson', 'Cameron',
  'Nueces', 'Brazoria', 'Bell', 'Galveston', 'Lubbock', 'Webb', 'Jefferson',
  'McLennan', 'Brazos', 'Smith', 'Hays', 'Ellis', 'Johnson', 'Midland',
  'Ector', 'Comal', 'Grayson', 'Taylor', 'Tom Green', 'Wichita', 'Gregg',
  'Potter', 'Guadalupe', 'Kaufman', 'Randall', 'Victoria', 'Rockwall'
].sort();

const CountySearchFilter = ({ onSearch, loading = false }) => {
  const [state, setState] = useState('TX');
  const [county, setCounty] = useState('');
  const [customCounty, setCustomCounty] = useState('');
  const [searchType, setSearchType] = useState('tax-delinquent');

  const handleSearch = () => {
    const selectedCounty = county === 'custom' ? customCounty : county;

    if (!selectedCounty) {
      return;
    }

    onSearch({
      state,
      county: selectedCounty,
      searchType,
    });
  };

  const handleReset = () => {
    setCounty('');
    setCustomCounty('');
  };

  return (
    <Card className="p-6 bg-white border-2 border-slate-200 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">County Search</h3>
          <p className="text-sm text-slate-600">Select a county to scrape deed records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TX">Texas (TX)</SelectItem>
              <SelectItem value="FL">Florida (FL)</SelectItem>
              <SelectItem value="GA">Georgia (GA)</SelectItem>
              <SelectItem value="AZ">Arizona (AZ)</SelectItem>
              <SelectItem value="IL">Illinois (IL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger id="county">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {state === 'TX' && TEXAS_COUNTIES.map(c => (
                <SelectItem key={c} value={c}>{c} County</SelectItem>
              ))}
              <SelectItem value="custom">Custom / Other...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {county === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="customCounty">Custom County Name</Label>
            <Input
              id="customCounty"
              value={customCounty}
              onChange={(e) => setCustomCounty(e.target.value)}
              placeholder="Enter county name"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="searchType">Search Type</Label>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger id="searchType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tax-delinquent">Tax Delinquent</SelectItem>
              <SelectItem value="redeemable-deeds">Redeemable Deeds</SelectItem>
              <SelectItem value="upcoming-auctions">Upcoming Auctions</SelectItem>
              <SelectItem value="sold-properties">Sold Properties</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSearch}
          disabled={loading || !county}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search County Records
            </>
          )}
        </Button>
      </div>

      {county && !loading && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-800">
            <strong>Ready to search:</strong> {county === 'custom' ? customCounty : county} County, {state} - {searchType.replace('-', ' ')}
          </p>
        </div>
      )}
    </Card>
  );
};

export default CountySearchFilter;
