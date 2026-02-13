'use client';

import { FileUpload } from '@/components';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const handleUploadSuccess = () => {
    // Could trigger a global refresh or show notification
    console.log('Upload successful - data will be refreshed');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Data</h1>
        <p className="text-slate-500">Upload CSV files to update health analytics data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={20} />
              CSV Format Guidelines
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <p>Each data type requires specific columns in your CSV file:</p>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-800">Infections:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    date, region, cases, recovered, active
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Deaths:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    date, region, deaths, cumulative_deaths
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">ICU:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    date, region, icu_patients, capacity, utilization_rate
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Vaccination:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    date, region, doses_administered, first_dose, second_dose, booster
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Hospitalizations:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    date, region, hospitalizations, discharged, current_patients
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Clinics:</p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    name, region, address, capacity, type
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <AlertCircle className="text-amber-600" size={20} />
              Important Notes
            </h3>
            <ul className="space-y-2 text-sm text-amber-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                Date format should be YYYY-MM-DD
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                First row must contain column headers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                Numeric fields should not contain commas
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                UTF-8 encoding is recommended
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                Maximum file size: 10MB
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
