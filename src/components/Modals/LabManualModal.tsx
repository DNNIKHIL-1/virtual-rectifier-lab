import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, CheckCircle2, Calculator } from 'lucide-react';
import { RectifierTopology } from '../../types/rectifier';

interface LabManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTopology: RectifierTopology;
}

export const LabManualModal: React.FC<LabManualModalProps> = ({
  isOpen,
  onClose,
  currentTopology
}) => {
  const [activeTab, setActiveTab] = useState<'theory' | 'formulas' | 'experiments'>('theory');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Power Electronics Lab Manual</h3>
              <p className="text-xs text-slate-400">
                Operating Principles, Analytical Equations & Practical Laboratory Procedures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('theory')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'theory'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Circuit Theory & Modes
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'formulas'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Analytical Derivations & Formulas
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'experiments'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Experiment Procedures
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
          {activeTab === 'theory' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">
                  1. Single-Phase Full-Bridge Rectifier (Diode Bridge)
                </h4>
                <p>
                  A full-bridge diode rectifier consists of four diodes arranged in a bridge network.
                  During the positive half-cycle of the AC input voltage (vs &gt; 0), diodes{' '}
                  <strong className="text-emerald-400">D1 and D4</strong> become forward-biased and
                  conduct, delivering current from the source to the load. During the negative
                  half-cycle (vs &lt; 0), diodes <strong className="text-emerald-400">D2 and D3</strong>{' '}
                  conduct. Because current enters the load in the same direction in both half-cycles,
                  the output voltage is rectified DC.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">
                  2. Controlled Rectifiers (SCR / Thyristor Bridge)
                </h4>
                <p>
                  In phase-controlled rectifiers, thyristors replace diodes. Conduction begins only
                  when the device is forward-biased and a gate trigger pulse is applied at the firing
                  angle <strong className="text-amber-400">α</strong>. By varying α from 0° to 180°,
                  the average DC output voltage can be smoothly regulated from maximum positive DC to
                  zero (or negative in inverter mode with an active source).
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">
                  3. Inductive (RL) Loads & Freewheeling Diode (FWD)
                </h4>
                <p>
                  When supplying an inductive load (e.g. DC motor winding or smoothing choke), the
                  inductor stores energy $W = \frac{1}{2} L i^2$. As the input voltage drops to zero
                  and reverses polarity, the inductor induces a counter-EMF ($-L di/dt$) that forces
                  the conducting devices to remain ON past 180° until the extinction angle{' '}
                  <strong className="text-cyan-400">β</strong>. This causes negative voltage spikes at
                  the output. Connecting a <strong className="text-emerald-400">Freewheeling Diode (Dm)</strong>{' '}
                  across the load provides a decay path for the inductive energy, clamping the output
                  voltage to zero during reverse bias and improving the power factor and ripple factor.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'formulas' && (
            <div className="space-y-4 font-mono text-[11px]">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold font-sans text-cyan-400">
                  Full-Bridge Diode Rectifier
                </div>
                <div>• Average Voltage: Vavg = (2 · Vm) / π ≈ 0.6366 · Vm</div>
                <div>• RMS Voltage: Vrms = Vm / √2 ≈ 0.7071 · Vm</div>
                <div>• Form Factor: FF = Vrms / Vavg = (π / 2√2) ≈ 1.1107</div>
                <div>• Ripple Factor: γ = √(FF² - 1) = √(1.1107² - 1) ≈ 0.482 (48.2%)</div>
                <div>• Peak Inverse Voltage (PIV): PIV = Vm</div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold font-sans text-amber-400">
                  Single-Phase Controlled Bridge Rectifier (SCR)
                </div>
                <div>• Average Voltage (Continuous CCM): Vavg = (2 · Vm / π) · cos(α)</div>
                <div>• RMS Output Voltage: Vrms = Vm · √[ 1/2 + (sin(2α) / 4π) ]</div>
                <div>• Discontinuous (DCM with extinction angle β):</div>
                <div className="pl-3 text-slate-400">
                  Vavg = (Vm / π) · [ cos(α) - cos(β) ]
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold font-sans text-purple-400">
                  Three-Phase Controlled Bridge Rectifier (6 SCRs)
                </div>
                <div>• Highly Inductive Load (Continuous CCM, all α):</div>
                <div className="pl-3 text-cyan-300 font-semibold">
                  Vavg = (3 · Vm,LL / π) · cos(α)  [Note: at α = 90°, cos(90°) = 0 ⇒ Vavg = 0 V]
                </div>
                <div>• Resistive Load (R load) / Discontinuous DCM:</div>
                <div className="pl-3 text-slate-300">
                  - For α ≤ 60°: Vavg = (3 · Vm,LL / π) · cos(α)
                </div>
                <div className="pl-3 text-amber-300">
                  - For 60° &lt; α &lt; 120°: Vavg = (3 · Vm,LL / π) · [1 + cos(α + 60°)]  [At α = 90°: Vavg ≈ 72.4 V, NOT 0 V]
                </div>
                <div className="pl-3 text-slate-400">
                  - For α ≥ 120°: Vavg = 0 V (conduction ceases completely)
                </div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold font-sans text-emerald-400">
                  Load Impedance & Time Constant
                </div>
                <div>• Impedance: Z = √(R² + (ωL)²)</div>
                <div>• Load Phase Angle: φ = arctan(ωL / R)</div>
                <div>• Time Constant: τ = L / R</div>
              </div>
            </div>
          )}

          {activeTab === 'experiments' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Experiment 1: Effect of Load Inductance on Diode Bridge Ripple</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Select Full-Bridge Rectifier (Diode Bridge).</li>
                  <li>Set Load to Pure R (20 Ω), observe pulsating output current io(t).</li>
                  <li>Switch Load to RL (L = 45 mH), observe current smoothing effect and reduced ripple.</li>
                  <li>Observe ripple factor γ decrease from 0.482 toward near-zero DC ripple.</li>
                </ol>
              </div>

              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <div className="font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Experiment 2: Controlled Rectifier Firing Angle Characteristics</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-400 text-[11px]">
                  <li>Select Full-Bridge Controlled Rectifier (SCR).</li>
                  <li>Vary firing angle α from 0° to 90° in steps of 15°.</li>
                  <li>Record Vavg and verify equation Vavg = (2Vm/π)·cos(α).</li>
                  <li>Enable Freewheeling Diode and observe prevention of negative output voltage excursions.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
};
