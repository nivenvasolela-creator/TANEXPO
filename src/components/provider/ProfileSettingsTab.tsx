import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Languages, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export const ProfileSettingsTab: React.FC = () => {
  const { activeProviderId, providers, updateProviderProfile } = useApp();

  const currentProvider = providers.find((p) => p.id === activeProviderId) || providers[0];

  const [name, setName] = useState(currentProvider.name);
  const [tagline, setTagline] = useState(currentProvider.tagline);
  const [location, setLocation] = useState(currentProvider.location);
  const [officeAddress, setOfficeAddress] = useState(currentProvider.officeAddress);
  const [talaLicense, setTalaLicense] = useState(currentProvider.talaLicense);
  const [phone, setPhone] = useState(currentProvider.phone);
  const [email, setEmail] = useState(currentProvider.email);
  const [fleetInfo, setFleetInfo] = useState(currentProvider.fleetInfo || '');
  const [about, setAbout] = useState(currentProvider.about);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProviderProfile({
      ...currentProvider,
      name,
      tagline,
      location,
      officeAddress,
      talaLicense,
      phone,
      email,
      fleetInfo,
      about
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#152019] p-6 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs transition-colors">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Operator Credentials
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Profile & Licensing Settings
          </h2>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
            Configure your public profile, TALA licensing details, office headquarters, and dispatch contacts.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Profile Updated!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#152019] p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs space-y-5 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">TALA Tourism License *</label>
            <input
              type="text"
              required
              value={talaLicense}
              onChange={(e) => setTalaLicense(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Company Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">City / Region Base *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Physical Office Address</label>
            <input
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Direct Dispatch Phone *</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Official Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Fleet & Safari Equipment Specs</label>
          <input
            type="text"
            value={fleetInfo}
            onChange={(e) => setFleetInfo(e.target.value)}
            placeholder="e.g. 6x Toyota Land Cruiser 4x4 with open pop-up roof and fridge"
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">About Company Narrative</label>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden resize-none"
          />
        </div>

        <div className="pt-4 border-t border-[#F0EBE0] dark:border-[#23352A] flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
};
