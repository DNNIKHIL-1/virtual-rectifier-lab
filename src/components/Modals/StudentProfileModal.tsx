import React, { useState } from 'react';
import { StudentProfile } from '../../types/rectifier';
import { X, User, Check } from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSave: (p: StudentProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave
}) => {
  const [formData, setFormData] = useState<StudentProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Student Profile</h3>
            <p className="text-xs text-slate-400">
              Customize affiliation shown on lab workspace and reports
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Student Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Roll Number / Student ID</label>
            <input
              type="text"
              required
              value={formData.rollNo}
              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Department</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Institution / University</label>
            <input
              type="text"
              required
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg"
            >
              <Check className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
