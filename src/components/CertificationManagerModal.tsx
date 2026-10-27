'use client';

import React, { useState, useEffect } from 'react';
import { X, Wrench, Plus, Check, Copy, Tag, RefreshCw, Sparkles, Sliders } from 'lucide-react';
import { useDevMode } from '@/context/DevModeContext';

// We import the universal client library
// @ts-ignore
import SMCertifications from '../../public/shared/sm-certifications.js';

interface ToolItem {
  id: string;
  name: string;
  category: string;
  color: string;
  keywords: string[];
  iconSvg: string;
}

export function CertificationManagerModal() {
  const { isIconManagerOpen, closeIconManager, isDevMode } = useDevMode();

  const [tools, setTools] = useState<Record<string, ToolItem>>(SMCertifications.TOOLS || {});
  const [selectedToolId, setSelectedToolId] = useState<string | null>('3d-printing');
  const [testInput, setTestInput] = useState('3D Printing (Advanced)');
  const [copied, setCopied] = useState(false);

  // Form edit states
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editKeywords, setEditKeywords] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newId, setNewId] = useState('');

  // Sync selection to form
  useEffect(() => {
    if (selectedToolId && tools[selectedToolId]) {
      const t = tools[selectedToolId];
      setEditName(t.name);
      setEditCategory(t.category);
      setEditColor(t.color);
      setEditKeywords((t.keywords || []).join(', '));
      setIsAddingNew(false);
    }
  }, [selectedToolId, tools]);

  if (!isIconManagerOpen || !isDevMode) return null;

  const handleSaveTool = (e: React.FormEvent) => {
    e.preventDefault();
    const id = isAddingNew ? newId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : selectedToolId;
    if (!id) return;

    const updated: ToolItem = {
      id,
      name: editName.trim(),
      category: editCategory.trim() || 'General',
      color: editColor.trim() || '#3bc0cd',
      keywords: editKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean),
      iconSvg: isAddingNew ? SMCertifications.SVG_ICONS['tool-generic'] : (tools[id]?.iconSvg || SMCertifications.SVG_ICONS['tool-generic'])
    };

    const newTools = { ...tools, [id]: updated };
    setTools(newTools);
    setSelectedToolId(id);
    setIsAddingNew(false);
    try {
      localStorage.setItem('sm_custom_tool_mappings', JSON.stringify(newTools));
    } catch (_) {}
  };

  const handleCopyJSON = () => {
    const jsonOutput = JSON.stringify({ tools }, null, 2);
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Test resolution preview
  const resolvedTest = SMCertifications.resolve(testInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f16622]/10 text-[#f16622] flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fredoka text-xl font-bold text-stone-900">
                  Certification & Icon Manager
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-mono font-bold text-xs border border-amber-500/30">
                  SSOT Registry
                </span>
              </div>
              <p className="text-xs text-stone-500 font-roboto">
                Single Source of Truth for Check-In Kiosk, Portal Door, and Companion App
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeIconManager}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Tool List (Left) + Editor & Live Tester (Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Tool List */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Registered Tools ({Object.keys(tools).length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setSelectedToolId(null);
                  setNewId('');
                  setEditName('');
                  setEditCategory('Digital Fabrication');
                  setEditColor('#3bc0cd');
                  setEditKeywords('');
                }}
                className="text-xs font-semibold text-[#344ea2] hover:text-[#f16622] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tool</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {Object.values(tools).map((tool) => {
                const isSelected = selectedToolId === tool.id && !isAddingNew;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      setIsAddingNew(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : `${tool.color}15`,
                          color: isSelected ? '#ffffff' : tool.color,
                        }}
                        dangerouslySetInnerHTML={{ __html: tool.iconSvg }}
                      />
                      <div>
                        <div className="font-bold text-sm leading-tight">{tool.name}</div>
                        <div className={`text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                          {tool.category}
                        </div>
                      </div>
                    </div>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: tool.color }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Test Resolver Card */}
            <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Test Text Resolution
              </span>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Type certification string..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white font-medium"
              />
              {resolvedTest && (
                <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 flex items-center justify-center shrink-0"
                      style={{ color: resolvedTest.color }}
                      dangerouslySetInnerHTML={{ __html: resolvedTest.iconSvg }}
                    />
                    <div>
                      <div className="text-xs font-bold text-stone-800">
                        {resolvedTest.name}
                        {resolvedTest.isAdvanced && (
                          <span
                            className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-black text-white"
                            style={{ backgroundColor: resolvedTest.color }}
                          >
                            +
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500">{resolvedTest.level}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Matches: {resolvedTest.toolId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Editor Form */}
          <div className="md:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-fredoka text-base font-bold text-stone-900">
                  {isAddingNew ? 'Add New Tool Mapping' : `Edit: ${editName || 'Tool'}`}
                </h3>
                {!isAddingNew && selectedToolId && (
                  <span className="font-mono text-xs text-stone-500">ID: {selectedToolId}</span>
                )}
              </div>

              <form onSubmit={handleSaveTool} className="space-y-3.5 text-xs">
                {isAddingNew && (
                  <div>
                    <label className="text-stone-700 font-semibold block mb-1">Tool ID (slug)</label>
                    <input
                      type="text"
                      required
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      placeholder="e.g. pottery-wheel"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-stone-700 font-semibold block mb-1">Tool Display Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. 3D Printing"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-medium text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-700 font-semibold block mb-1">Category</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="Digital Fabrication"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-semibold block mb-1">Brand Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editColor.startsWith('#') ? editColor : '#3bc0cd'}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-stone-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        placeholder="#3bc0cd"
                        className="flex-1 p-2 rounded-xl border border-stone-200 bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-stone-700 font-semibold block mb-1">
                    Matching Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editKeywords}
                    onChange={(e) => setEditKeywords(e.target.value)}
                    placeholder="3d printing, fdm, resin, 3d printer"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-xs"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Any Neon One certification string matching these keywords will use this icon.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#344ea2] hover:bg-[#2a3f85] text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isAddingNew ? 'Create Tool Mapping' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Export & Sync Actions */}
            <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-stone-800">Export Registry JSON</div>
                <div className="text-[11px] text-stone-500">Copy canonical schema for commit to repo</div>
              </div>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
