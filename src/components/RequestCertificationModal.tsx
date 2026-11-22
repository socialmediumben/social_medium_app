'use client';

import React, { useState } from 'react';
import {
  X,
  Award,
  Wrench,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { MemberProfile, CertificationRequest } from '@/lib/types';
import SMCertifications from '../../public/shared/sm-certifications.js';
import { submitCertificationRequest } from '@/lib/certifications';

interface RequestCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfile | null | undefined;
  onRequestSubmitted?: (request: CertificationRequest) => void;
}

export const RequestCertificationModal: React.FC<RequestCertificationModalProps> = ({
  isOpen,
  onClose,
  member,
  onRequestSubmitted,
}) => {
  const toolsDict = (SMCertifications.TOOLS || {}) as Record<string, any>;
  const toolList = Object.values(toolsDict) as any[];

  const [selectedToolId, setSelectedToolId] = useState<string>(toolList[0]?.id || 'laser-cutting');
  const [customToolName, setCustomToolName] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Advanced'>('Beginner');
  const [memberNote, setMemberNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const currentMemberCerts = (member.certifications || []).map((c) => c.toLowerCase());
  const selectedTool = toolsDict[selectedToolId];

  // Helper to check if member already has this tool certified
  const isToolAlreadyCertified = (toolDef: any) => {
    if (!toolDef?.keywords) return false;
    return currentMemberCerts.some((cert) =>
      toolDef.keywords.some((kw: string) => cert.includes(kw.toLowerCase()))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isCustom = selectedToolId === 'custom';
    const finalToolName = isCustom ? customToolName.trim() : selectedTool?.name || 'Makerspace Tool';

    if (!finalToolName) {
      setErrorMessage('Please specify the tool or equipment name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCertificationRequest({
        accountId: member.accountId || member.tapCard || 'maker',
        memberName: member.preferredName || member.name || 'Maker',
        memberEmail: member.email,
        tapCard: member.tapCard,
        toolId: selectedToolId,
        toolName: finalToolName,
        category: isCustom ? 'Custom Machinery' : selectedTool?.category || 'Makerspace Tools',
        level,
        memberNote: memberNote.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit certification request.');
      } else {
        setSuccessMessage(`Certification request for ${finalToolName} submitted successfully!`);
        if (onRequestSubmitted && res.request) {
          onRequestSubmitted(res.request);
        }
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
          setMemberNote('');
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-fredoka text-lg sm:text-xl font-bold">
                Request Tool Certification
              </h3>
              <p className="text-xs text-stone-300">
                Apply for independent tool and equipment operating privileges
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* 1. Tool Selection Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              1. Select Tool or Machinery
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-stone-200 rounded-2xl bg-stone-50/50">
              {toolList.map((tool) => {
                const isSelected = selectedToolId === tool.id;
                const isAlreadyCertified = isToolAlreadyCertified(tool);

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      if (isAlreadyCertified) {
                        setLevel('Advanced');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer relative ${
                      isSelected
                        ? 'bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: `${tool.color}15`,
                          color: tool.color,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (tool.iconSvg || '')
                            .replace(/width="24" height="24"/g, 'width="16" height="16"'),
                        }}
                      />
                      {isAlreadyCertified && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Certified ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-fredoka text-xs font-bold text-stone-900 leading-tight">
                        {tool.name}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate mt-0.5">
                        {tool.category}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Custom Tool Option */}
              <button
                type="button"
                onClick={() => setSelectedToolId('custom')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  selectedToolId === 'custom'
                    ? 'bg-white border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center mb-1.5">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-fredoka text-xs font-bold text-stone-900">
                    Other Tool...
                  </div>
                  <div className="text-[10px] text-stone-500">Custom equipment</div>
                </div>
              </button>
            </div>

            {selectedToolId === 'custom' && (
              <div className="mt-2 animate-in fade-in">
                <input
                  type="text"
                  value={customToolName}
                  onChange={(e) => setCustomToolName(e.target.value)}
                  placeholder="Enter equipment or tool name..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. Level Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              2. Certification Level
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLevel('Beginner')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  level === 'Beginner'
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Beginner Level</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Safe, independent operation for standard materials and projects.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLevel('Advanced')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  level === 'Advanced'
                    ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
                  <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                    +
                  </span>
                  <span>Advanced (+) Level</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                  Rotary attachments, deep cuts, advanced feeds/speeds, or master shop lead.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Training Justification / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              3. Verification & Training Notes
            </label>
            <textarea
              rows={3}
              value={memberNote}
              onChange={(e) => setMemberNote(e.target.value)}
              placeholder="Tell staff how you completed your training (e.g. 'Completed safety walkthrough with Ben on Tuesday', 'Took 3D printing workshop on 11/15', 'Extensive experience with Bambu Lab FDM printers')..."
              className="w-full text-xs p-3 rounded-2xl border border-stone-300 focus:outline-none focus:border-teal-500 bg-white placeholder-stone-400 leading-relaxed"
            />
            <p className="text-[11px] text-stone-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>Shop staff will verify your walkthrough and approve your certificate.</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#344ea2] hover:bg-[#2a3f85] text-white shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
