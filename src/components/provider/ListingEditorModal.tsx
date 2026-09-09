import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryId, ListingPackage } from '../../types';
import { X, Save, Plus, Trash2, Check, PackagePlus, Clock, DollarSign } from 'lucide-react';

export const ListingEditorModal: React.FC = () => {
  const { 
    editingListing, 
    setEditingListing, 
    isNewListingModalOpen, 
    setIsNewListingModalOpen, 
    activeProviderId, 
    saveListing, 
    categories 
  } = useApp();

  const isOpen = isNewListingModalOpen || editingListing !== null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('safari');
  const [priceTZS, setPriceTZS] = useState<number>(1200000);
  const [duration, setDuration] = useState('3 Days / 2 Nights');
  const [unit, setUnit] = useState('per person');
  const [maxGroupSize, setMaxGroupSize] = useState<number>(6);
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState<string[]>([
    '4x4 Pop-top safari Land Cruiser with English/Swahili driver guide',
    'All national park entry and concession conservation permits',
    'Packed hot picnic lunch and chilled bottled water'
  ]);
  const [newInclusionText, setNewInclusionText] = useState('');

  useEffect(() => {
    if (editingListing) {
      setTitle(editingListing.title);
      setCategory(editingListing.category);
      setPriceTZS(editingListing.priceTZS);
      setDuration(editingListing.duration);
      setUnit(editingListing.unit);
      setMaxGroupSize(editingListing.maxGroupSize || 6);
      setDescription(editingListing.description);
      setInclusions(editingListing.inclusions || []);
    } else {
      setTitle('');
      setCategory('safari');
      setPriceTZS(1200000);
      setDuration('3 Days / 2 Nights');
      setUnit('per person');
      setMaxGroupSize(6);
      setDescription('');
      setInclusions([
        '4x4 Pop-top safari Land Cruiser with English/Swahili driver guide',
        'All national park entry and concession conservation permits',
        'Packed hot picnic lunch and chilled bottled water'
      ]);
    }
  }, [editingListing, isNewListingModalOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setEditingListing(null);
    setIsNewListingModalOpen(false);
  };

  const handleAddInclusion = () => {
    if (!newInclusionText.trim()) return;
    setInclusions(prev => [...prev, newInclusionText.trim()]);
    setNewInclusionText('');
  };

  const handleRemoveInclusion = (idx: number) => {
    setInclusions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || priceTZS <= 0) return;

    saveListing({
      id: editingListing ? editingListing.id : undefined,
      providerId: activeProviderId,
      title,
      category,
      priceTZS: Number(priceTZS),
      duration,
      unit,
      description,
      inclusions,
      active: true,
      maxGroupSize: Number(maxGroupSize)
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8DFC9]">
        {/* Header */}
        <div className="bg-[#FAF7F2] p-5 sm:p-6 border-b border-[#E8DFC9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#284435] text-[#E8B94A] flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#284435]">
                {editingListing ? 'Edit Tour Package' : 'Create New Tour Package'}
              </h3>
              <p className="text-xs text-[#6B7A72]">
                Publish transparent packages denominated in legal Tanzanian Shillings (TZS)
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#EDE5D5] text-[#6B7A72] flex items-center justify-center border border-[#E8DFC9] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435]">Package Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3-Day Serengeti & Ngorongoro Big 5 Expedition"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden focus:border-[#284435]"
            />
          </div>

          {/* Category & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435]">Experience Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryId)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435]">Duration *</label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 4 Days / 3 Nights, or Half-day (5 Hours)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Price TZS, Unit, Max Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435]">Price in TZS *</label>
              <input
                type="number"
                min={10000}
                step={10000}
                required
                value={priceTZS}
                onChange={(e) => setPriceTZS(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden font-semibold text-[#284435]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435]">Pricing Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
              >
                <option value="per person">per person</option>
                <option value="per group">per group</option>
                <option value="per vehicle (up to 6)">per vehicle (up to 6)</option>
                <option value="per couple">per couple</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#284435]">Max Group Size</label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxGroupSize}
                onChange={(e) => setMaxGroupSize(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435]">Package Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Highlight the itinerary routes, animal sightings, lodging style, and key attractions..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden resize-none"
            />
          </div>

          {/* Inclusions Checklist */}
          <div className="space-y-2 pt-2 border-t border-[#F0EBE0]">
            <label className="text-xs font-bold text-[#284435] block">
              Package Inclusions (Transfers, Park Fees, Guides)
            </label>

            <div className="space-y-1.5">
              {inclusions.map((inc, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-[#FAF7F2] rounded-xl border border-[#E8DFC9] text-xs">
                  <span className="text-[#4D5E55] truncate">• {inc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(i)}
                    className="text-zinc-400 hover:text-red-500 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newInclusionText}
                onChange={(e) => setNewInclusionText(e.target.value)}
                placeholder="Add another inclusion (e.g. All TANAPA park fees included)"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[#DED5C6] bg-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddInclusion}
                className="px-3 py-1.5 bg-[#284435] text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#E8DFC9] flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#6B7A72] text-xs font-semibold border border-[#DED5C6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#284435] hover:bg-[#1E332A] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
