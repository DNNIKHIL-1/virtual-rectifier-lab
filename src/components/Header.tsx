import React from 'react';
import { StudentProfile } from '../types/rectifier';
import { Zap, BookOpen, FileText, Github } from 'lucide-react';

interface HeaderProps {
  profile: StudentProfile;
  onEditProfile: () => void;
  onOpenManual: () => void;
  onOpenReport: () => void;
  onOpenGitHub: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onEditProfile,
  onOpenManual,
  onOpenReport,
  onOpenGitHub
}) => {
  return (
    <header className="h-16 shrink-0 bg-[#070d1d] border-b border-slate-800 px-5 flex items-center justify-between select-none z-20">
      {/* App Branding (Left) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
            Power Electronics Virtual Lab
          </h1>
          <p className="text-xs text-slate-400 leading-tight">
            Rectifiers — Diode & Thyristor Controlled Rectifiers
          </p>
        </div>
      </div>

      {/* Action Buttons & Student Profile (Right) */}
      <div className="flex items-center gap-3">
        {/* Permanent Link / GitHub Action */}
        <button
          onClick={onOpenGitHub}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 text-xs font-semibold border border-emerald-600/50 transition-all shadow-sm hover:shadow-emerald-900/20"
          title="How to deploy a permanent link on GitHub / Vercel for your professor"
        >
          <Github className="w-3.5 h-3.5 text-emerald-400" />
          <span>Deploy / GitHub Link</span>
        </button>

        {/* Lab Manual Action */}
        <button
          onClick={onOpenManual}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lab Manual</span>
        </button>

        {/* Export Report Action */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700/80 hover:bg-cyan-600 text-white text-xs font-medium border border-cyan-500/50 transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export Report</span>
        </button>

        {/* Student Profile Card (Matching IIT Kharagpur from image) */}
        <div
          onClick={onEditProfile}
          className="flex items-center gap-3 pl-3 pr-2 py-1 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl cursor-pointer group transition-all"
          title="Click to edit student profile"
        >
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
              {profile.name}
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              Roll No: {profile.rollNo}
            </span>
            <span className="text-[10px] text-slate-400">
              {profile.department}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {profile.institution}
            </span>
          </div>

          {/* IIT Kharagpur Emblem SVG */}
          <div className="w-10 h-10 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center p-1 shrink-0 overflow-hidden group-hover:border-cyan-500 transition-colors">
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-200 fill-current">
              {/* Outer Chakra / Gear teeth */}
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
              {/* Sacred Temple / Torch shape */}
              <path d="M 50 16 L 62 38 L 38 38 Z" fill="currentColor" />
              <rect x="44" y="38" width="12" height="24" fill="currentColor" />
              {/* Pedestal / Open Book */}
              <path d="M 30 64 Q 50 58 70 64 L 74 76 Q 50 70 26 76 Z" fill="currentColor" opacity="0.9" />
              {/* Sanskrit motto banner */}
              <path d="M 22 80 Q 50 74 78 80 L 76 86 Q 50 80 24 86 Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};
