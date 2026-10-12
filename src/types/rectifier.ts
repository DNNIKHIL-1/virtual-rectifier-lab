/**
 * Power Electronics Virtual Lab - Type Definitions
 * Grounded in Prof. Arpan Hota's Courseware (IIT Kharagpur) and Academic Literature
 */

export type RectifierTopology =
  | 'half-wave-diode'
  | 'full-bridge-diode'
  | 'half-wave-scr'
  | 'full-bridge-scr'
  | 'semi-converter'
  | 'three-phase-diode'
  | 'three-phase-scr';

export type LoadType = 'R' | 'RL' | 'RLE';

export interface CircuitParameters {
  // Source
  vRms: number; // RMS Voltage (V), e.g. 230
  frequency: number; // Frequency (Hz), e.g. 50
  sourceInductance: number; // Ls (mH) for commutation overlap study (Slides 34-37)
  
  // Load
  loadType: LoadType;
  resistance: number; // Resistance (Ohms), e.g. 20
  inductance: number; // Inductance (mH), e.g. 45
  backEmf: number; // DC Back-EMF / Battery (V), e.g. 0 (cases 100V, 250V, 300V in slide 12)
  filterCapacitor: number; // Capacitor (uF), e.g. 0 (disabled) or 100
  freewheelingDiode: boolean; // Has FWD across load
  
  // SCR
  firingAngle: number; // Firing angle alpha in degrees (0 - 180)
  
  // Device
  forwardVoltage: number; // Diode/SCR forward voltage drop (V), e.g. 0.7 or 0 (ideal)
}

export interface InstantaneousValues {
  timeMs: number; // Milliseconds
  phaseDeg: number; // Electrical angle (0 - 360 deg)
  vs: number; // AC Source voltage (V)
  is: number; // AC Source current (A)
  vo: number; // DC Output load voltage (V)
  io: number; // DC Output load current (A)
  van: number; // 3-phase Van
  vbn: number; // 3-phase Vbn
  vcn: number; // 3-phase Vcn
  gateTriggered: boolean; // Whether gate pulse is active
  
  // Device states and currents
  activePathText: string;
  conductionCycle: 'positive' | 'negative' | 'freewheeling' | 'blocking';
  conductingDevices: string[];
  deviceCurrents: Record<string, number>;
  deviceVoltages: Record<string, number>;
  fwdCurrent: number;
}

export interface CalculatedResults {
  vPeak: number;
  vAvg: number; // Numerical integrated Vavg
  vAvgTheory: number; // Exact analytical theoretical Vavg from textbook formula
  vRms: number; // Numerical integrated Vrms
  vRmsTheory: number; // Exact analytical theoretical Vrms
  iAvg: number;
  iRms: number;
  isRms: number; // AC side RMS current
  isFundRms: number; // Fundamental component of input current I_1,rms
  rippleFactor: number;
  formFactor: number;
  pDc: number; // DC component output power: Vavg * Iavg (W)
  pAc: number; // Legacy alias for pLoad (W)
  pLoad: number; // Actual average instantaneous load power: (1/T) integral v_o(t)*i_o(t) dt (W)
  pIn: number; // Actual average AC source input power: (1/T) integral v_s(t)*i_s(t) dt (W)
  efficiency: number; // Conversion efficiency: (pLoad / pIn) * 100 (%)
  powerFactor: number; // True Power Factor (TPF)
  displacementFactor: number; // cos(phi_1) (DPF)
  distortionFactor: number; // I_1,rms / I_total,rms (DF)
  thdPercent: number; // Output voltage THD %
  thdCurrentPercent: number; // Input current THD %
  overlapAngleDeg: number; // Commutation overlap angle mu (deg) due to source inductance Ls
  conductionMode: 'Continuous (CCM)' | 'Discontinuous (DCM)';
  extinctionAngleDeg: number; // beta in degrees
  conductionAngleDeg: number; // gamma in degrees
}

export interface WaveformDataPoint {
  timeMs: number;
  timeSec: number;
  phaseDeg: number;
  vs: number;
  is: number; // AC side current
  vo: number; // DC side voltage
  io: number; // DC side current
  van: number; // Phase A voltage
  vbn: number; // Phase B voltage
  vcn: number; // Phase C voltage
  vab: number; // Line AB voltage
  vbc: number; // Line BC voltage
  vca: number; // Line CA voltage
  iDevice1: number;
  iDevice2: number;
  iDevice3: number;
  iDevice4: number;
  iDevice5: number;
  iDevice6: number;
  iFwd: number;
  vDevice1: number;
  gatePulse: number;
  gatePulses: Record<string, number>; // Individual firing pulses for T1..T6
}

export interface HarmonicPoint {
  harmonicNumber: number;
  frequencyHz: number;
  amplitude: number;
  percentageOfFund: number;
}

export interface StudentProfile {
  name: string;
  rollNo: string;
  department: string;
  institution: string;
}
