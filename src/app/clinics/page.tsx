'use client';

import { useEffect, useState } from 'react';
import { Hospital, RefreshCw, Search } from 'lucide-react';
import { StatCard, DataTable } from '@/components';
import { apiService, Clinic } from '@/lib/api';

export default function ClinicsPage() {
  const [data, setData] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const result = await apiService.getClinics(searchQuery ? { search: searchQuery } : undefined);
      setData(result);
    } catch (error) {
      console.error('Error loading clinics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    loadData(search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalClinics = data.length;

  // Group by city
  const cityData = data.reduce((acc: Record<string, number>, r) => {
    const city = r.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});
  const cities = Object.keys(cityData).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vaccination Clinics</h1>
          <p className="text-slate-500">View and search vaccination clinic locations</p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={18} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard title="Total Clinics" value={totalClinics} icon={Hospital} color="blue" />
        <StatCard title="Cities" value={cities} icon={Hospital} color="green" />
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Search Clinics</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search by name, address, or city..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={18} />
            Search
          </button>
        </div>
      </div>

      <DataTable
        title="Clinic Directory"
        data={data}
        columns={[
          { key: 'name', header: 'Name', render: (item) => String(item.name || 'N/A') },
          { key: 'address', header: 'Address', render: (item) => String(item.address || 'N/A') },
          { key: 'city', header: 'City', render: (item) => String(item.city || 'N/A') },
          { key: 'phone', header: 'Phone', render: (item) => String(item.phone || 'N/A') },
        ]}
        loading={loading}
      />
    </div>
  );
}
