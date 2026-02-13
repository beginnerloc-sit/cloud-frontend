'use client';

import { useEffect, useState } from 'react';
import { Hospital, RefreshCw, Search, Syringe, MapPin } from 'lucide-react';
import { StatCard, DataTable } from '@/components';
import { apiService, Clinic, ClinicsResponse } from '@/lib/api';

export default function ClinicsPage() {
  const [data, setData] = useState<Clinic[]>([]);
  const [summary, setSummary] = useState<ClinicsResponse['summary']>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const result = await apiService.getClinics(searchQuery ? { search: searchQuery } : undefined);
      setData(result.data || []);
      setSummary(result.summary);
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

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const totalClinics = summary?.total_clinics || safeData.length;

  // Count vaccine types
  const vaccineTypes = new Set<string>();
  safeData.forEach(clinic => {
    const vaccines = clinic.vaccine || '';
    // Extract unique vaccine brand names
    if (vaccines.includes('Pfizer')) vaccineTypes.add('Pfizer/Comirnaty');
    if (vaccines.includes('Moderna')) vaccineTypes.add('Moderna/Spikevax');
    if (vaccines.includes('Novavax')) vaccineTypes.add('Novavax/Nuvaxovid');
  });

  // Count clinics with pediatric vaccines (for children)
  const pediatricClinics = safeData.filter(clinic => 
    (clinic.vaccine || '').includes('months') || 
    (clinic.vaccine || '').includes('5 to 11') ||
    (clinic.vaccine || '').includes('6 months')
  ).length;

  // Filter by search term locally
  const filteredData = search
    ? safeData.filter(clinic =>
        (clinic.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (clinic.address || '').toLowerCase().includes(search.toLowerCase()) ||
        (clinic.vaccine || '').toLowerCase().includes(search.toLowerCase())
      )
    : safeData;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vaccination Clinics</h1>
          <p className="text-slate-500">View and search vaccination clinic locations in Singapore</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Clinics" value={totalClinics} icon={Hospital} color="blue" />
        <StatCard title="Vaccine Types Available" value={vaccineTypes.size} icon={Syringe} color="green" />
        <StatCard title="Pediatric Clinics" value={pediatricClinics} icon={MapPin} color="purple" />
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
            placeholder="Search by name, address, or vaccine type..."
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
        {search && (
          <p className="text-sm text-slate-500 mt-2">
            Showing {filteredData.length} of {safeData.length} clinics
          </p>
        )}
      </div>

      {/* Vaccine Types Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Vaccine Types</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Pfizer/Comirnaty (JN.1)
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Moderna/Spikevax (JN.1)
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Novavax/Nuvaxovid (XBB.1.5)
          </span>
        </div>
      </div>

      <DataTable
        title="Clinic Directory"
        data={filteredData}
        columns={[
          { key: 'name', header: 'Clinic Name', render: (item) => (
            <span className="font-medium text-slate-900">{String(item.name || 'N/A')}</span>
          )},
          { key: 'address', header: 'Address', render: (item) => (
            <span className="text-slate-600 text-sm">{String(item.address || 'N/A')}</span>
          )},
          { key: 'vaccine', header: 'Available Vaccines', render: (item) => {
            const vaccines = String(item.vaccine || 'N/A');
            return (
              <div className="max-w-md">
                <span className="text-sm text-slate-700">{vaccines}</span>
              </div>
            );
          }},
        ]}
        loading={loading}
      />
    </div>
  );
}
