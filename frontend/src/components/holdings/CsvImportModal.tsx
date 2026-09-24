'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  Download,
} from 'lucide-react';
import { parseAndValidateCsv, ValidatedHoldingRow } from '@/lib/utils/csv-parser';
import { formatCurrency } from '@/lib/utils/formatters';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  portfolioId?: string;
}

const SAMPLE_CSV = `Symbol,Company,Quantity,Buy_Price,Current_Price,Sector
GOOGL,Alphabet Inc.,15,165.20,182.40,Technology
AMD,Advanced Micro Devices,25,142.00,158.30,Technology
BRK.B,Berkshire Hathaway,10,410.50,452.10,Financial Services
UNH,UnitedHealth Group,8,520.00,580.40,Healthcare
XOM,Exxon Mobil Corp,30,105.00,118.20,Energy`;

export function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
  portfolioId = 'port-demo-001',
}: CsvImportModalProps) {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ValidatedHoldingRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    validCount: number;
    invalidCount: number;
    duplicates: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleParseCsv = (textToParse: string) => {
    const result = parseAndValidateCsv(textToParse);
    setParsedRows(result.rows);
    setImportSummary({
      validCount: result.validCount,
      invalidCount: result.invalidCount,
      duplicates: result.duplicateSymbols,
    });
    setHasParsed(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvText(text);
        handleParseCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateRow = (index: number, field: keyof ValidatedHoldingRow, val: any) => {
    const next = [...parsedRows];
    next[index] = { ...next[index], [field]: val };
    
    // Re-check validity
    const errs: string[] = [];
    if (!next[index].symbol) errs.push('Missing symbol');
    if (next[index].quantity <= 0) errs.push('Quantity must be > 0');
    if (next[index].buy_price < 0) errs.push('Buy price cannot be negative');

    next[index].errors = errs;
    next[index].isValid = errs.length === 0;

    setParsedRows(next);
    setImportSummary(prev => ({
      validCount: next.filter(r => r.isValid).length,
      invalidCount: next.filter(r => !r.isValid).length,
      duplicates: prev?.duplicates || [],
    }));
  };

  const handleDeleteRow = (index: number) => {
    const next = parsedRows.filter((_, idx) => idx !== index);
    setParsedRows(next);
    setImportSummary(prev => ({
      validCount: next.filter(r => r.isValid).length,
      invalidCount: next.filter(r => !r.isValid).length,
      duplicates: prev?.duplicates || [],
    }));
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/csv/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId,
          rows: validRows,
        }),
      });

      if (!res.ok) throw new Error('Failed to import CSV rows');
      onImportComplete();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="financial-card-header bg-slate-900 text-white shrink-0">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Import Portfolio CSV Data
            </h3>
            <p className="text-xs text-slate-400">
              Validate, preview, and normalize equity positions before ingestion
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {!hasParsed ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-800 transition-colors bg-slate-50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Select or drop a CSV file</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Expected headers: Symbol, Company, Quantity, Buy_Price, Current_Price, Sector
                </p>
                <label className="mt-3 inline-block px-4 py-1.5 rounded bg-slate-900 text-white font-semibold cursor-pointer hover:bg-slate-800">
                  Browse Files
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Or Paste Raw CSV Data:</label>
                  <button
                    onClick={() => {
                      setCsvText(SAMPLE_CSV);
                      handleParseCsv(SAMPLE_CSV);
                    }}
                    className="text-blue-600 hover:underline text-[11px] font-medium"
                  >
                    Load Sample Template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  className="w-full font-mono text-xs p-3 rounded border border-slate-300 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleParseCsv(csvText)}
                  className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Parse & Preview CSV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Validation Summary Bar */}
              {importSummary && (
                <div className="p-3 rounded border flex items-center justify-between bg-slate-50 border-slate-200">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {importSummary.validCount} Valid Positions
                    </span>
                    {importSummary.invalidCount > 0 && (
                      <span className="flex items-center gap-1.5 text-red-800 font-semibold">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        {importSummary.invalidCount} Issues to Review
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setHasParsed(false)}
                    className="text-slate-600 hover:underline text-[11px]"
                  >
                    ← Upload / Paste Different File
                  </button>
                </div>
              )}

              {/* Editable Preview Table */}
              <div className="border border-slate-200 rounded overflow-x-auto max-h-72">
                <table className="w-full text-left financial-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Buy Price</th>
                      <th className="text-right">Current Price</th>
                      <th>Sector</th>
                      <th className="text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'bg-white' : 'bg-red-50/50'}>
                        <td>
                          {r.isValid ? (
                            <span className="financial-badge-pos text-[10px]">READY</span>
                          ) : (
                            <span className="financial-badge-neg text-[10px]" title={r.errors.join(', ')}>
                              ERROR
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={r.symbol}
                            onChange={e => handleUpdateRow(idx, 'symbol', e.target.value.toUpperCase())}
                            className="w-20 px-1.5 py-1 rounded border border-slate-300 font-mono text-xs"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={r.company_name}
                            onChange={e => handleUpdateRow(idx, 'company_name', e.target.value)}
                            className="w-36 px-1.5 py-1 rounded border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="any"
                            value={r.quantity}
                            onChange={e => handleUpdateRow(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 rounded border border-slate-300 text-right font-mono text-xs"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="any"
                            value={r.buy_price}
                            onChange={e => handleUpdateRow(idx, 'buy_price', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right font-mono text-xs"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            step="any"
                            value={r.current_price}
                            onChange={e => handleUpdateRow(idx, 'current_price', parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 rounded border border-slate-300 text-right font-mono text-xs"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={r.sector}
                            onChange={e => handleUpdateRow(idx, 'sector', e.target.value)}
                            className="w-28 px-1.5 py-1 rounded border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            {hasParsed ? `${parsedRows.filter(r => r.isValid).length} ready for database commit` : 'Preview required before database write'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            {hasParsed && (
              <button
                onClick={handleCommitImport}
                disabled={isSubmitting || parsedRows.filter(r => r.isValid).length === 0}
                className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isSubmitting ? 'Importing...' : `Import ${parsedRows.filter(r => r.isValid).length} Holdings`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
