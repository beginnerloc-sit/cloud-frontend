'use client';

import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiService, DataType, UploadResponse } from '@/lib/api';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

const dataTypes: { value: DataType; label: string }[] = [
  { value: 'infections', label: 'Infections' },
  { value: 'deaths', label: 'Deaths' },
  { value: 'icu', label: 'ICU' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'hospitalizations', label: 'Hospitalizations' },
  { value: 'clinics', label: 'Clinics' },
];

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [dataType, setDataType] = useState<DataType | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: UploadResponse } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!dataType) {
      setResult({ success: false, message: 'Please select a data type' });
      return;
    }

    if (!file) {
      setResult({ success: false, message: 'Please select a CSV file' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const response = await apiService.uploadData(dataType, file);
      setResult({
        success: true,
        message: 'Upload successful!',
        data: response,
      });
      
      // Reset form
      setFile(null);
      setDataType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Callback for refreshing data
      if (onUploadSuccess) {
        setTimeout(onUploadSuccess, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload CSV Data</h3>
      
      <div className="space-y-4">
        {/* Data Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select data type...</option>
            {dataTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            CSV File
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          {file && (
            <p className="mt-1 text-sm text-slate-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || !dataType || !file}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload Data
            </>
          )}
        </button>

        {/* Result Message */}
        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              ) : (
                <XCircle className="text-red-600 flex-shrink-0" size={20} />
              )}
              <div>
                <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                </p>
                {result.data && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Request ID: {result.data.request_id}</p>
                    <p>Records: {result.data.records_received}</p>
                    <p>Status: {result.data.status}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
