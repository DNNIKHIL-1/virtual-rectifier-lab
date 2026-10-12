import React, { useState } from 'react';
import { WaveformDataPoint } from '../../types/rectifier';
import { Download, Search } from 'lucide-react';

interface DataViewProps {
  waveforms: WaveformDataPoint[];
}

export const DataView: React.FC<DataViewProps> = ({ waveforms }) => {
  const [filterText, setFilterText] = useState('');
  const [sampleStep, setSampleStep] = useState(20); // show 1 out of 20 points for fast rendering

  if (!waveforms || waveforms.length === 0) {
    return <div className="p-4 text-slate-400">No waveform data available.</div>;
  }

  // Downsample for tabular presentation
  const sampledData = waveforms.filter((_, idx) => idx % sampleStep === 0);

  const filteredData = filterText
    ? sampledData.filter(
        (pt) =>
          pt.timeMs.toFixed(2).includes(filterText) ||
          pt.vs.toFixed(1).includes(filterText) ||
          pt.vo.toFixed(1).includes(filterText)
      )
    : sampledData;

  const exportCsv = () => {
    const headers = [
      'Time (ms)',
      'Phase (deg)',
      'Source Voltage Vs (V)',
      'Source Current Is (A)',
      'Output Voltage Vo (V)',
      'Load Current Io (A)',
      'Device 1 Current (A)',
      'Device 2 Current (A)',
      'Device 3 Current (A)',
      'Device 4 Current (A)'
    ];

    const rows = waveforms.map((p) => [
      p.timeMs.toFixed(3),
      p.phaseDeg.toFixed(1),
      p.vs.toFixed(2),
      p.is.toFixed(3),
      p.vo.toFixed(2),
      p.io.toFixed(3),
      p.iDevice1.toFixed(3),
      p.iDevice2.toFixed(3),
      p.iDevice3.toFixed(3),
      p.iDevice4.toFixed(3)
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rectifier_simulation_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3 h-[420px] bg-[#070d1d] border border-slate-800 rounded-lg p-3">
      {/* Table controls */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 w-64">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search voltage or time..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-transparent border-none text-slate-200 text-xs focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sampleStep}
            onChange={(e) => setSampleStep(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value={10}>Every 10 samples</option>
            <option value={20}>Every 20 samples</option>
            <option value={50}>Every 50 samples</option>
          </select>

          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-y-auto border border-slate-800/80 rounded font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900 text-slate-400 text-[11px] uppercase border-b border-slate-800 z-10">
            <tr>
              <th className="py-2 px-2.5">Time (ms)</th>
              <th className="py-2 px-2.5">Phase (°)</th>
              <th className="py-2 px-2.5 text-emerald-400">vs (V)</th>
              <th className="py-2 px-2.5 text-blue-400">is (A)</th>
              <th className="py-2 px-2.5 text-emerald-400">vo (V)</th>
              <th className="py-2 px-2.5 text-blue-400">io (A)</th>
              <th className="py-2 px-2.5 text-amber-400">ID1 (A)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300 text-[11px]">
            {filteredData.map((pt, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-slate-950/40' : 'bg-transparent'}
              >
                <td className="py-1.5 px-2.5 font-medium">{pt.timeMs.toFixed(2)}</td>
                <td className="py-1.5 px-2.5 text-slate-400">{pt.phaseDeg.toFixed(0)}°</td>
                <td className="py-1.5 px-2.5 text-emerald-300">{pt.vs.toFixed(1)}</td>
                <td className="py-1.5 px-2.5 text-blue-300">{pt.is.toFixed(2)}</td>
                <td className="py-1.5 px-2.5 text-emerald-300 font-semibold">{pt.vo.toFixed(1)}</td>
                <td className="py-1.5 px-2.5 text-blue-300 font-semibold">{pt.io.toFixed(2)}</td>
                <td className="py-1.5 px-2.5 text-amber-300">{pt.iDevice1.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
