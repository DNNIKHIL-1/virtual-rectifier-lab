import React, { useState } from 'react';
import {
  X,
  Github,
  Globe,
  Download,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import JSZip from 'jszip';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  rollNo: string;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({
  isOpen,
  onClose,
  studentName,
  rollNo
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'github-pages' | 'vercel' | 'commands'>('overview');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Collect project source files using Vite's eager raw glob
      const modules = import.meta.glob(
        [
          '/src/**/*.{ts,tsx,css,json}',
          '/index.html',
          '/package.json',
          '/tsconfig.json',
          '/vite.config.ts',
          '/.github/**/*.yml'
        ],
        { query: '?raw', import: 'default', eager: true }
      );

      for (const [path, content] of Object.entries(modules)) {
        // Strip leading slash
        const cleanPath = path.startsWith('/') ? path.slice(1) : path;
        zip.file(cleanPath, content as string);
      }

      // Add a helpful README.md for the professor and student
      zip.file(
        'README.md',
        `# Power Electronics Virtual Lab - Rectifiers Simulation

**Student:** ${studentName}  
**Roll No:** ${rollNo}  
**Institution:** IIT Kharagpur  

Interactive web simulation covering:
- 1-Phase Half-Wave & Full-Bridge Diode Rectifiers (R, RL, RL+FWD, R-E)
- 1-Phase Half-Wave & Full-Bridge Controlled SCR Converters
- 1-Phase Semi-Converter (Semi-Controlled Bridge)
- 3-Phase 6-Pulse Diode Bridge Rectifier
- 3-Phase 6-Pulse SCR Controlled Converter with FWD Diode Option

## Quick Start (Run Locally)
\`\`\`bash
npm install
npm run dev
\`\`\`

## Build for Production
\`\`\`bash
npm run build
\`\`\`
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `power-electronics-rectifier-lab-${rollNo || 'project'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const gitCommands = [
    'git init',
    'git add .',
    'git commit -m "feat: Power Electronics Virtual Lab Rectifiers Simulation"',
    'git branch -M main',
    'git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rectifier-lab.git',
    'git push -u origin main'
  ].join('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
      <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Permanent Deployment & GitHub Guide
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Reliable for Professor
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                How to get a permanent 24/7 online link that never disconnects or expires.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why GitHub / Permanent Links?</span>
          </button>
          <button
            onClick={() => setActiveTab('github-pages')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'github-pages'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Option 1: GitHub Pages (Free)</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Option 2: Vercel (Easiest & Fastest)</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'commands'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Git Commands</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
                <h4 className="text-amber-300 font-bold text-sm mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Why is the temporary preview link showing "Not Working"?
                </h4>
                <p className="text-slate-300 text-xs">
                  The temporary link (<code className="text-amber-300 font-mono">ais-dev-...run.app</code>) is a development environment container. When idle or after cloud instance recycling, it pauses and requires a refresh. For submitting to your professor or grading portal, you should have a <strong>permanent production static link</strong> that is hosted 24/7 on GitHub Pages or Vercel with 100% uptime!
                </p>
              </div>

              {/* 1-Click Download Button Card */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/40 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Download Complete Source Code (.ZIP)
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Get all files (<code className="text-cyan-300 font-mono">src</code>, <code className="text-cyan-300 font-mono">package.json</code>, Vite configs, GitHub Pages Action) in one ready-to-run package.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-700/30 shrink-0"
                >
                  {isZipping ? (
                    <span>Packaging Zip...</span>
                  ) : zipSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Project Zip</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary of Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div
                  onClick={() => setActiveTab('github-pages')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-white group-hover:text-emerald-400">
                      <Github className="w-4 h-4 text-slate-300" />
                      GitHub Pages
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Free static website hosted directly by GitHub. URL will be: <code className="text-emerald-300 font-mono">username.github.io/rectifier-lab</code>.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('vercel')}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-white group-hover:text-cyan-400">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Vercel (Recommended)
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Takes 30 seconds. Connect your GitHub account, click Deploy, and get <code className="text-cyan-300 font-mono">rectifier-lab.vercel.app</code> with 100% uptime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB PAGES */}
          {activeTab === 'github-pages' && (
            <div className="space-y-4">
              <h4 className="text-white font-bold text-sm">
                Deploying to GitHub Pages (Step-by-Step)
              </h4>

              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Create a GitHub Repository</strong>
                    <p className="text-slate-400 text-xs">
                      Go to <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">github.com/new <ExternalLink className="w-3 h-3" /></a>, name your repository (e.g. <code className="text-cyan-300 font-mono">virtual-rectifier-lab</code>), set it to <strong>Public</strong>, and click <strong>Create repository</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Upload Code / Push Repository</strong>
                    <p className="text-slate-400 text-xs mb-2">
                      Click the "Download Project Zip" button above, extract it, and either drag & drop the files into GitHub’s "uploading an existing file", or run the standard Git push commands.
                    </p>
                    <button
                      onClick={handleDownloadZip}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Project Zip Now</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Enable GitHub Pages (Automated!)</strong>
                    <p className="text-slate-400 text-xs">
                      In your GitHub repo:
                      <br />
                      Go to <strong>Settings</strong> → <strong>Pages</strong> (on the left menu).
                      <br />
                      Under <strong>Build and deployment → Source</strong>, select <strong>"GitHub Actions"</strong>.
                      <br />
                      <em>We already included the <code className="text-cyan-300 font-mono">.github/workflows/deploy.yml</code> file in this project, so GitHub will automatically build and publish your site!</em>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-emerald-950/30 border border-emerald-800/50 p-3.5 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-300 block mb-0.5">Your Permanent Live Link</strong>
                    <p className="text-slate-300 text-xs">
                      Your link will be: <code className="text-white font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">https://&lt;your-username&gt;.github.io/virtual-rectifier-lab/</code>.
                      <br />
                      This link never expires, never sleeps, and works 100% of the time for your professor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-xl p-4">
                <h4 className="text-cyan-300 font-bold text-sm mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Why Vercel is the Easiest & Most Recommended
                </h4>
                <p className="text-slate-300 text-xs">
                  Vercel is built specifically for modern React/Vite apps. It takes literally 30 seconds, requires zero build configuration, provides a free permanent SSL domain (<code className="text-cyan-300 font-mono">.vercel.app</code>), and automatically rebuilds whenever you push an update.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Push code to GitHub</strong>
                    <p className="text-slate-400 text-xs">
                      Make sure your code is inside a repository on your GitHub account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Sign in to Vercel</strong>
                    <p className="text-slate-400 text-xs">
                      Go to <a href="https://vercel.com/signup" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">vercel.com <ExternalLink className="w-3 h-3" /></a> and sign in with your GitHub account (100% free).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-white block mb-0.5">Import and Deploy</strong>
                    <p className="text-slate-400 text-xs">
                      Click <strong>"Add New..." → "Project"</strong>, find your <code className="text-white font-mono">virtual-rectifier-lab</code> repository, and click <strong>"Deploy"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 bg-cyan-950/40 border border-cyan-800/60 p-3.5 rounded-xl">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-cyan-300 block mb-0.5">Instant Permanent URL</strong>
                    <p className="text-slate-300 text-xs">
                      You will instantly get a link like: <code className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-cyan-700">https://virtual-rectifier-lab.vercel.app</code>.
                      <br />
                      Send this link directly to your professor!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GIT COMMANDS */}
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Terminal Commands to Push to GitHub
                </h4>
                <button
                  onClick={() => handleCopy(gitCommands, 99)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedIndex === 99 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied All</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#050811] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                <div className="text-slate-500"># 1. Initialize git in your unzipped project folder</div>
                <div className="text-emerald-400">git init</div>
                <div className="text-emerald-400">git add .</div>
                <div className="text-emerald-400">git commit -m "Power Electronics Virtual Lab submission"</div>
                <div className="pt-2 text-slate-500"># 2. Point to your newly created GitHub repository</div>
                <div className="text-cyan-300">git branch -M main</div>
                <div className="text-cyan-300">git remote add origin https://github.com/&lt;YOUR_USERNAME&gt;/virtual-rectifier-lab.git</div>
                <div className="pt-2 text-slate-500"># 3. Push code to GitHub (GitHub Pages / Vercel auto-deploys!)</div>
                <div className="text-amber-300">git push -u origin main</div>
              </div>

              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Tip:</strong> If you don't use the Git terminal, you can simply download the project zip, go to your new repository on <a href="https://github.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">github.com</a>, and click <strong>"uploading an existing file"</strong> to upload all files directly through your web browser!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Student: <strong className="text-white">{studentName}</strong> ({rollNo})</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
