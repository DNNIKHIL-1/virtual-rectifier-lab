/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RectifierTopology,
  CircuitParameters,
  StudentProfile,
  CalculatedResults
} from './types/rectifier';
import { simulateRectifier, getInstantaneousState } from './utils/physics';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CircuitSchematic } from './components/Schematics/CircuitSchematic';
import { ParametersPanel } from './components/ParametersPanel';
import { Oscilloscope } from './components/Oscilloscope/Oscilloscope';
import { DataView } from './components/Oscilloscope/DataView';
import { HarmonicsView } from './components/Oscilloscope/HarmonicsView';
import { ResultsPanel } from './components/ResultsPanel';
import { StudentProfileModal } from './components/Modals/StudentProfileModal';
import { LabManualModal } from './components/Modals/LabManualModal';
import { LabReportModal } from './components/Modals/LabReportModal';
import { SourceModal } from './components/Modals/SourceModal';
import { DisplayModal } from './components/Modals/DisplayModal';
import { ComponentEditModal } from './components/Modals/ComponentEditModal';
import { GitHubDeployModal } from './components/Modals/GitHubDeployModal';
import {
  Columns,
  Zap,
  Activity,
  Rows,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // ------------------ Student Profile State ------------------
  const [profile, setProfile] = useState<StudentProfile>({
    name: 'D N Nikhil',
    rollNo: '24EE10048',
    department: 'Department of Electrical Engineering',
    institution: 'IIT Kharagpur'
  });

  // ------------------ Workspace Layout State ------------------
  // Solves screen interference: Allows student to switch between Dual Split, Circuit Focus, Scope Focus, and Stacked View
  const [layoutMode, setLayoutMode] = useState<'split' | 'circuit' | 'scope' | 'stacked'>('split');

  // ------------------ Topology & Parameters State ------------------
  const [topology, setTopology] = useState<RectifierTopology>('full-bridge-diode');

  const [params, setParams] = useState<CircuitParameters>({
    vRms: 230,
    frequency: 50,
    sourceInductance: 0,
    loadType: 'RL',
    resistance: 20,
    inductance: 45,
    backEmf: 0,
    filterCapacitor: 0,
    freewheelingDiode: false,
    firingAngle: 45,
    forwardVoltage: 0.7
  });

  // ------------------ Interactive Visual Flags ------------------
  const [animateCurrentFlow, setAnimateCurrentFlow] = useState(true);
  const [waveformTab, setWaveformTab] = useState<'scope' | 'data' | 'harmonics'>('scope');

  // ------------------ Playback & Time Engine ------------------
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(12.4);

  // ------------------ Modals State ------------------
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<
    'source' | 'resistor' | 'inductor' | 'thyristor' | 'load' | null
  >(null);

  // ------------------ Numerical Simulation Engine ------------------
  // Runs whenever topology or circuit parameters change
  const simResult = useMemo(() => {
    return simulateRectifier(topology, params);
  }, [topology, params]);

  const { waveforms, results, harmonics, isHarmonics } = simResult;

  // Max simulation time in ms (e.g. 40ms for 2 cycles at 50Hz)
  const maxTimeMs = waveforms.length > 0 ? waveforms[waveforms.length - 1].timeMs : 40;

  // ------------------ Animation Frame Loop ------------------
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current !== null && isRunning) {
        const deltaSec = (timestamp - lastTimeRef.current) / 1000;
        // In real-time: 1 real second = 1 second of simulation * simSpeed.
        // At 50Hz, 1 cycle is 20ms, which is very fast in real-time.
        // For educational observation, we scale the time advancement cleanly:
        const msAdvance = deltaSec * 1000 * simSpeed * 0.15; // smooth educational pace
        setCurrentTimeMs((prev) => (prev + msAdvance) % (maxTimeMs || 40));
      }
      lastTimeRef.current = timestamp;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, simSpeed, maxTimeMs]);

  // Instantaneous state at the current time
  const instantState = useMemo(() => {
    return getInstantaneousState(waveforms, currentTimeMs, topology);
  }, [waveforms, currentTimeMs, topology]);

  // Playback handlers
  const handleTogglePlay = () => setIsRunning(!isRunning);
  const handleReset = () => setCurrentTimeMs(0);
  const handleStepForward = () => {
    setIsRunning(false);
    setCurrentTimeMs((prev) => (prev + 0.5) % maxTimeMs);
  };

  // Topology Titles
  const topologyInfo = {
    'half-wave-diode': {
      title: '1-PHASE HALF-WAVE RECTIFIER (DIODE)',
      desc: 'Single diode configuration with R, RL, RL+FWD, and R-E loads (Slides 2-12).'
    },
    'full-bridge-diode': {
      title: '1-PHASE FULL-BRIDGE RECTIFIER (DIODE BRIDGE)',
      desc: 'Four diodes bridge configuration. Provides full-wave rectification (Slides 13-17).'
    },
    'half-wave-scr': {
      title: '1-PHASE HALF-WAVE CONTROLLED RECTIFIER (SCR)',
      desc: 'Single thyristor with phase angle control trigger and freewheeling diode (Slides 22-24).'
    },
    'full-bridge-scr': {
      title: '1-PHASE FULL-BRIDGE CONTROLLED RECTIFIER (SCR)',
      desc: 'Four thyristors fully-controlled bridge with variable firing angle α (Slides 25-28).'
    },
    'semi-converter': {
      title: '1-PHASE SEMI-CONTROLLED RECTIFIER (SEMI-CONVERTER)',
      desc: 'Two thyristors and two diodes with natural freewheeling capability (Slide 29).'
    },
    'three-phase-diode': {
      title: '3-PHASE DIODE BRIDGE RECTIFIER',
      desc: 'Six-pulse diode bridge with 0.955 Vm,L-L DC output voltage (Slides 18-21).'
    },
    'three-phase-scr': {
      title: '3-PHASE FULLY CONTROLLED RECTIFIER',
      desc: 'Six-thyristor bridge converter with phase angle control α (Slides 30-33).'
    }
  }[topology] || {
    title: 'RECTIFIER LAB EXPERIMENT',
    desc: 'Interactive virtual power electronics simulation.'
  };

  return (
    <div className="min-h-screen bg-[#060a16] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 1. Header Bar */}
      <Header
        profile={profile}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onOpenManual={() => setIsManualModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Sidebar Navigation */}
        <Sidebar
          currentTopology={topology}
          onSelectTopology={(t) => setTopology(t)}
          params={params}
          setParams={setParams}
          onOpenSourceModal={() => setIsSourceModalOpen(true)}
          onOpenDisplayModal={() => setIsDisplayModalOpen(true)}
        />

        {/* 3. Center and Right Content Area */}
        <main className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Top Title Banner & Workspace Mode Switcher (Solves Screen Interference) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0b1329] border border-slate-800 rounded-xl px-4 py-3 shadow-md">
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
                {topologyInfo.title}
              </h2>
              <p className="text-xs text-slate-400">
                {topologyInfo.desc}
              </p>
            </div>

            {/* Layout Viewport Switcher - 1-Click Organized Views */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs self-start lg:self-center shadow-inner">
              <button
                onClick={() => setLayoutMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  layoutMode === 'split'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Balanced 50/50 dual workspace without horizontal crowding"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Dual Split</span>
              </button>

              <button
                onClick={() => setLayoutMode('circuit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  layoutMode === 'circuit'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Focus on Circuit Schematic & Conduction loop"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Circuit Focus</span>
              </button>

              <button
                onClick={() => setLayoutMode('scope')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  layoutMode === 'scope'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Full-width Oscilloscope Waveforms"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Scope Focus</span>
              </button>

              <button
                onClick={() => setLayoutMode('stacked')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  layoutMode === 'stacked'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Stacked layout: full schematic on top, full oscilloscope below"
              >
                <Rows className="w-3.5 h-3.5" />
                <span>Stacked</span>
              </button>
            </div>

            {/* Quick Status Badges */}
            <div className="flex items-center gap-2 self-start lg:self-center">
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/40">
                Load: {params.loadType} {params.loadType !== 'R' ? `(${params.inductance}mH)` : ''}
              </span>
              {topology.includes('scr') && (
                <span className="text-[11px] font-mono text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-800/40">
                  α = {params.firingAngle}°
                </span>
              )}
              {params.freewheelingDiode && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800/50">
                  FWD Active
                </span>
              )}
            </div>
          </div>

          {/* ================= WORKSPACE LAYOUT MODES ================= */}

          {/* MODE 1: DUAL SPLIT (50/50 - Parameters placed below schematic so neither screen is squeezed!) */}
          {layoutMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left 6 Cols: Circuit Schematic + Parameters docked cleanly below */}
              <div className="lg:col-span-6 flex flex-col gap-3.5">
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/70">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                        Circuit Schematic & Conduction State
                      </span>
                    </div>
                    <button
                      onClick={() => setLayoutMode('circuit')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-medium px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
                      title="Maximize Circuit View"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  </div>
                  <CircuitSchematic
                    topology={topology}
                    params={params}
                    instantState={instantState}
                    animateCurrentFlow={animateCurrentFlow}
                    onSelectComponent={(comp) => setSelectedComponent(comp)}
                  />
                </div>

                {/* Circuit & Load Parameter Controls (Full width of the left container) */}
                <div className="w-full">
                  <ParametersPanel
                    params={params}
                    setParams={setParams}
                    topology={topology}
                    isRunning={isRunning}
                    onTogglePlay={handleTogglePlay}
                    onReset={handleReset}
                    onStepForward={handleStepForward}
                    simSpeed={simSpeed}
                    setSimSpeed={setSimSpeed}
                    animateCurrentFlow={animateCurrentFlow}
                    setAnimateCurrentFlow={setAnimateCurrentFlow}
                  />
                </div>
              </div>

              {/* Right 6 Cols: Oscilloscope / Waveforms Panel */}
              <div className="lg:col-span-6 bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Oscilloscope Waveforms
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setWaveformTab('scope')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          waveformTab === 'scope'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Scope View
                      </button>
                      <button
                        onClick={() => setWaveformTab('data')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          waveformTab === 'data'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Data View
                      </button>
                      <button
                        onClick={() => setWaveformTab('harmonics')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          waveformTab === 'harmonics'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Harmonics
                      </button>
                    </div>
                    <button
                      onClick={() => setLayoutMode('scope')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors"
                      title="Maximize Scope View"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  </div>
                </div>

                {waveformTab === 'scope' && (
                  <Oscilloscope
                    waveforms={waveforms}
                    currentTimeMs={currentTimeMs}
                    frequency={params.frequency}
                    vPeak={results.vPeak}
                    iPeak={results.iRms * 1.8 || 10}
                    topology={topology}
                    onSeekTime={(t) => {
                      setIsRunning(false);
                      setCurrentTimeMs(t);
                    }}
                  />
                )}
                {waveformTab === 'data' && <DataView waveforms={waveforms} />}
                {waveformTab === 'harmonics' && (
                  <HarmonicsView
                    harmonics={harmonics}
                    isHarmonics={isHarmonics}
                    thdPercent={results.thdPercent}
                    thdCurrentPercent={results.thdCurrentPercent}
                  />
                )}
              </div>
            </div>
          )}

          {/* MODE 2: CIRCUIT FOCUS (Large Circuit Schematic with Parameters alongside) */}
          {layoutMode === 'circuit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-8 flex flex-col gap-3.5">
                <div className="bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/70">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                        Full-Width Circuit Schematic & Live Particle Flow
                      </span>
                    </div>
                    <button
                      onClick={() => setLayoutMode('split')}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white font-medium px-2.5 py-1 rounded bg-slate-800/80 transition-colors"
                    >
                      <Minimize2 className="w-3 h-3" />
                      <span>Back to Split</span>
                    </button>
                  </div>
                  <CircuitSchematic
                    topology={topology}
                    params={params}
                    instantState={instantState}
                    animateCurrentFlow={animateCurrentFlow}
                    onSelectComponent={(comp) => setSelectedComponent(comp)}
                  />
                </div>

                {/* Live Mini Readout Bar */}
                <div className="bg-[#070d1d] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">Instantaneous:</span>
                    <span className="text-yellow-400 font-bold">vs = {instantState.vs.toFixed(1)}V</span>
                    <span className="text-cyan-400 font-bold">vo = {instantState.vo.toFixed(1)}V</span>
                    <span className="text-blue-400 font-bold">io = {instantState.io.toFixed(2)}A</span>
                    <span className="text-emerald-400">Mode: {instantState.conductionCycle}</span>
                  </div>
                  <button
                    onClick={() => setLayoutMode('scope')}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold px-3 py-1 rounded bg-blue-950/60 border border-blue-800/50 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>View Oscilloscope Waveforms →</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-4">
                <ParametersPanel
                  params={params}
                  setParams={setParams}
                  topology={topology}
                  isRunning={isRunning}
                  onTogglePlay={handleTogglePlay}
                  onReset={handleReset}
                  onStepForward={handleStepForward}
                  simSpeed={simSpeed}
                  setSimSpeed={setSimSpeed}
                  animateCurrentFlow={animateCurrentFlow}
                  setAnimateCurrentFlow={setAnimateCurrentFlow}
                />
              </div>
            </div>
          )}

          {/* MODE 3: SCOPE FOCUS (Full-Width High-Resolution Oscilloscope with Fast Control Deck) */}
          {layoutMode === 'scope' && (
            <div className="flex flex-col gap-4">
              {/* Quick interactive parameters bar for oscilloscope mode */}
              <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">Playback:</span>
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <button
                      onClick={handleTogglePlay}
                      className="p-1 text-slate-300 hover:text-white"
                      title={isRunning ? "Pause" : "Play"}
                    >
                      {isRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-1 text-slate-300 hover:text-white"
                      title="Reset to 0ms"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Firing Angle Presets if SCR */}
                {topology.includes('scr') && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-mono">Firing α:</span>
                    {[0, 30, 45, 60, 90, 120].map((val) => (
                      <button
                        key={val}
                        onClick={() => setParams(prev => ({ ...prev, firingAngle: val }))}
                        className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                          params.firingAngle === val
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {val}°
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Load Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Load:</span>
                  {(['R', 'RL', 'RLE'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setParams(prev => ({ ...prev, loadType: t }))}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border transition-colors ${
                        params.loadType === t
                          ? 'bg-cyan-600 text-white font-bold border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}

                  <button
                    onClick={() => setParams(prev => ({ ...prev, freewheelingDiode: !prev.freewheelingDiode }))}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                      params.freewheelingDiode
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    FWD: {params.freewheelingDiode ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setLayoutMode('split')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700 ml-2"
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Back to Split</span>
                  </button>
                </div>
              </div>

              {/* Full Width Oscilloscope Card */}
              <div className="w-full bg-[#0b1329] border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Full-Screen High-Resolution Oscilloscope (4 Channels)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setWaveformTab('scope')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'scope'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Scope View
                    </button>
                    <button
                      onClick={() => setWaveformTab('data')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'data'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Data View
                    </button>
                    <button
                      onClick={() => setWaveformTab('harmonics')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'harmonics'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Harmonics
                    </button>
                  </div>
                </div>

                {waveformTab === 'scope' && (
                  <Oscilloscope
                    waveforms={waveforms}
                    currentTimeMs={currentTimeMs}
                    frequency={params.frequency}
                    vPeak={results.vPeak}
                    iPeak={results.iRms * 1.8 || 10}
                    topology={topology}
                    onSeekTime={(t) => {
                      setIsRunning(false);
                      setCurrentTimeMs(t);
                    }}
                  />
                )}
                {waveformTab === 'data' && <DataView waveforms={waveforms} />}
                {waveformTab === 'harmonics' && (
                  <HarmonicsView
                    harmonics={harmonics}
                    isHarmonics={isHarmonics}
                    thdPercent={results.thdPercent}
                    thdCurrentPercent={results.thdCurrentPercent}
                  />
                )}
              </div>
            </div>
          )}

          {/* MODE 4: STACKED VIEW (Full width circuit on top, full width oscilloscope below) */}
          {layoutMode === 'stacked' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-8 bg-[#0b1329] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
                        Circuit Schematic & Live Dynamic Flow
                      </span>
                    </div>
                  </div>
                  <CircuitSchematic
                    topology={topology}
                    params={params}
                    instantState={instantState}
                    animateCurrentFlow={animateCurrentFlow}
                    onSelectComponent={(comp) => setSelectedComponent(comp)}
                  />
                </div>

                <div className="lg:col-span-4">
                  <ParametersPanel
                    params={params}
                    setParams={setParams}
                    topology={topology}
                    isRunning={isRunning}
                    onTogglePlay={handleTogglePlay}
                    onReset={handleReset}
                    onStepForward={handleStepForward}
                    simSpeed={simSpeed}
                    setSimSpeed={setSimSpeed}
                    animateCurrentFlow={animateCurrentFlow}
                    setAnimateCurrentFlow={setAnimateCurrentFlow}
                  />
                </div>
              </div>

              {/* Stacked Full-Width Scope */}
              <div className="w-full bg-[#0b1329] border border-slate-800 rounded-xl p-3.5 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Oscilloscope Waveforms (Full Stacked Trace View)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setWaveformTab('scope')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'scope'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Scope View
                    </button>
                    <button
                      onClick={() => setWaveformTab('data')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'data'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Data View
                    </button>
                    <button
                      onClick={() => setWaveformTab('harmonics')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        waveformTab === 'harmonics'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Harmonics
                    </button>
                  </div>
                </div>

                {waveformTab === 'scope' && (
                  <Oscilloscope
                    waveforms={waveforms}
                    currentTimeMs={currentTimeMs}
                    frequency={params.frequency}
                    vPeak={results.vPeak}
                    iPeak={results.iRms * 1.8 || 10}
                    topology={topology}
                    onSeekTime={(t) => {
                      setIsRunning(false);
                      setCurrentTimeMs(t);
                    }}
                  />
                )}
                {waveformTab === 'data' && <DataView waveforms={waveforms} />}
                {waveformTab === 'harmonics' && (
                  <HarmonicsView
                    harmonics={harmonics}
                    isHarmonics={isHarmonics}
                    thdPercent={results.thdPercent}
                    thdCurrentPercent={results.thdCurrentPercent}
                  />
                )}
              </div>
            </div>
          )}

          {/* Bottom Section: Instantaneous Readouts + Calculated Results + Conduction Status Table */}
          <ResultsPanel
            instantState={instantState}
            results={results}
            topology={topology}
          />
        </main>
      </div>

      {/* Modals & Dialogs */}
      <GitHubDeployModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        studentName={profile.name}
        rollNo={profile.rollNo}
      />

      {/* Modals & Dialogs */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={(p) => setProfile(p)}
      />

      <LabManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        currentTopology={topology}
      />

      <LabReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profile={profile}
        topology={topology}
        params={params}
        results={results}
      />

      <SourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        params={params}
        setParams={setParams}
      />

      <DisplayModal
        isOpen={isDisplayModalOpen}
        onClose={() => setIsDisplayModalOpen(false)}
        animateCurrentFlow={animateCurrentFlow}
        setAnimateCurrentFlow={setAnimateCurrentFlow}
        activeTab={waveformTab}
        setActiveTab={setWaveformTab}
      />

      <ComponentEditModal
        selectedComponent={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        params={params}
        setParams={setParams}
        topology={topology}
      />
    </div>
  );
}
