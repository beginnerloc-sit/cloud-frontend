'use client';

import { FileUpload } from '@/components';
import { FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const handleUploadSuccess = () => {
    console.log('Upload successful - data will be refreshed');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Data</h1>
        <p className="text-slate-500">Upload CSV files to update COVID-19 analytics data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={20} />
              Supported Data Types
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <p>Upload CSV files for the following data types:</p>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-slate-800">Infections:</p>
                  <p className="text-xs text-slate-500">COVID-19 infection case data</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Deaths:</p>
                  <p className="text-xs text-slate-500">COVID-19 mortality data</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Hospitalizations:</p>
                  <p className="text-xs text-slate-500">Hospitalization records</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">ICU Utilization:</p>
                  <p className="text-xs text-slate-500">ICU bed utilization statistics</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">New Admissions:</p>
                  <p className="text-xs text-slate-500">New hospitalization and ICU admission data</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Vaccination Progress:</p>
                  <p className="text-xs text-slate-500">Vaccination progress over time</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Vaccination by Age:</p>
                  <p className="text-xs text-slate-500">Vaccination status by age group</p>
                </div>
                
                <div>
                  <p className="font-medium text-slate-800">Clinics:</p>
                  <p className="text-xs text-slate-500">Public health clinic locations</p>
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
