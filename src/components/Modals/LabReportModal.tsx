import React from 'react';
import {
  StudentProfile,
  CircuitParameters,
  CalculatedResults,
  RectifierTopology
} from '../../types/rectifier';
import { X, Printer, Download, Award, Zap } from 'lucide-react';

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  topology: RectifierTopology;
  params: CircuitParameters;
  results: CalculatedResults;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  topology,
  params,
  results
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const topologyTitle = {
    'half-wave-diode': 'Single-Phase Half-Wave Diode Rectifier',
    'full-bridge-diode': 'Single-Phase Full-Bridge Diode Rectifier',
    'half-wave-scr': 'Single-Phase Half-Wave Controlled Rectifier (SCR)',
    'full-bridge-scr': 'Single-Phase Full-Bridge Controlled Rectifier (SCR)',
    'semi-converter': 'Single-Phase Semi-Controlled Rectifier (Semi-Converter)',
    'three-phase-diode': 'Three-Phase Six-Pulse Diode Bridge Rectifier',
    'three-phase-scr': 'Three-Phase Six-Pulse Controlled Rectifier (SCR)'
  }[topology] || 'Power Electronics Rectifier Experiment';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
        {/* Modal Top Actions */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Laboratory Experiment Report</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 bg-[#070d1d] font-sans print:p-0 print:bg-white print:text-black">
          {/* Institution Header */}
          <div className="border-b-2 border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white print:text-black">
                {profile.institution}
              </h2>
              <p className="text-xs text-slate-400 print:text-gray-600">
                {profile.department} • Power Electronics Virtual Laboratory
              </p>
              <div className="text-xs font-mono text-cyan-400 print:text-blue-700 font-semibold mt-1">
                Experiment Record: Single-Phase Rectifier Characterization
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-white print:text-black">{profile.name}</div>
              <div className="font-mono text-slate-400 print:text-gray-600">
                Roll: {profile.rollNo}
              </div>
              <div className="text-[10px] text-slate-500 print:text-gray-500 mt-0.5">
                Date: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Circuit Identification */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-1">
              Circuit Topology
            </h3>
            <div className="p-3 bg-slate-900 print:bg-gray-100 rounded-lg font-semibold text-sm text-cyan-300 print:text-black border border-slate-800 print:border-gray-300">
              {topologyTitle}
            </div>
          </div>

          {/* Input & Load Parameters Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-2">
              Tested Operating Parameters
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                <span className="text-slate-400 print:text-gray-500 font-sans">Source RMS:</span>{' '}
                <strong>{params.vRms} V</strong>
              </div>
              <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                <span className="text-slate-400 print:text-gray-500 font-sans">Frequency:</span>{' '}
                <strong>{params.frequency} Hz</strong>
              </div>
              <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                <span className="text-slate-400 print:text-gray-500 font-sans">Load Resistance R:</span>{' '}
                <strong>{params.resistance} Ω</strong>
              </div>
              <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                <span className="text-slate-400 print:text-gray-500 font-sans">Load Inductance L:</span>{' '}
                <strong>{params.loadType === 'R' ? 0 : params.inductance} mH</strong>
              </div>
              {topology.includes('scr') && (
                <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                  <span className="text-slate-400 print:text-gray-500 font-sans">Firing Angle α:</span>{' '}
                  <strong className="text-amber-400 print:text-amber-700">{params.firingAngle}°</strong>
                </div>
              )}
              <div className="p-2.5 bg-slate-900 print:bg-gray-50 rounded border border-slate-800 print:border-gray-300">
                <span className="text-slate-400 print:text-gray-500 font-sans">Freewheeling Diode:</span>{' '}
                <strong>{params.freewheelingDiode ? 'Enabled' : 'Disabled'}</strong>
              </div>
            </div>
          </div>

          {/* Measured / Calculated Performance Results */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 mb-2">
              Calculated Performance Characteristics
            </h3>
            <table className="w-full text-xs border border-slate-800 print:border-gray-300">
              <thead className="bg-slate-900 print:bg-gray-100 text-slate-400 print:text-gray-700 text-left">
                <tr>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Metric</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Symbol</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200 font-mono">
                <tr>
                  <td className="p-2 font-sans">Average Output Voltage</td>
                  <td className="p-2">Vavg</td>
                  <td className="p-2 text-right font-bold text-cyan-300 print:text-black">
                    {results.vAvg.toFixed(2)} V
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">RMS Output Voltage</td>
                  <td className="p-2">Vrms</td>
                  <td className="p-2 text-right font-bold text-cyan-300 print:text-black">
                    {results.vRms.toFixed(2)} V
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Average Load Current</td>
                  <td className="p-2">Iavg</td>
                  <td className="p-2 text-right font-bold text-emerald-300 print:text-black">
                    {results.iAvg.toFixed(2)} A
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">RMS Load Current</td>
                  <td className="p-2">Irms</td>
                  <td className="p-2 text-right font-bold text-emerald-300 print:text-black">
                    {results.iRms.toFixed(2)} A
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Voltage Ripple Factor</td>
                  <td className="p-2">γ</td>
                  <td className="p-2 text-right font-bold text-amber-300 print:text-black">
                    {results.rippleFactor.toFixed(3)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Form Factor</td>
                  <td className="p-2">FF</td>
                  <td className="p-2 text-right font-bold">
                    {results.formFactor.toFixed(3)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">DC Output Power (Vavg × Iavg)</td>
                  <td className="p-2">Pdc</td>
                  <td className="p-2 text-right font-bold">
                    {results.pDc.toFixed(2)} W
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Total Average Load Power</td>
                  <td className="p-2">Pload</td>
                  <td className="p-2 text-right font-bold text-amber-300 print:text-black">
                    {results.pLoad.toFixed(2)} W
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">AC Source Input Power</td>
                  <td className="p-2">Pin</td>
                  <td className="p-2 text-right font-bold text-blue-300 print:text-black">
                    {results.pIn.toFixed(2)} W
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Rectification Efficiency (Pload / Pin)</td>
                  <td className="p-2">η</td>
                  <td className="p-2 text-right font-bold text-emerald-300 print:text-black">
                    {results.efficiency.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Total Harmonic Distortion</td>
                  <td className="p-2">THD</td>
                  <td className="p-2 text-right font-bold">
                    {results.thdPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-sans">Conduction Mode</td>
                  <td className="p-2">Mode</td>
                  <td className="p-2 text-right font-bold text-cyan-300 print:text-black">
                    {results.conductionMode}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Student Observations & Signature Block */}
          <div className="pt-6 border-t border-slate-800 print:border-gray-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold text-slate-400 print:text-gray-600 block mb-1">
                Student Remarks / Conclusion:
              </span>
              <p className="text-[11px] text-slate-400 print:text-gray-700 italic">
                Verified full-wave rectification action, measured harmonic contents and validated
                theoretical formulas against virtual simulation results.
              </p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <div className="border-t border-dashed border-slate-600 print:border-gray-400 pt-2 inline-block ml-auto w-48 text-center text-slate-400 print:text-gray-600">
                Student Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
