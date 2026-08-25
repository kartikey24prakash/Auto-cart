import React, { useState, useEffect } from 'react';
import apiClient from '../../../shared/services/apiClient';

export default function ShippingProfileCard() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    addressLine1: '', city: '', state: '', postalCode: '', country: ''
  });

  const fetchShipping = async () => {
    try {
      const res = await apiClient.get('/api/dashboard/shipping');
      if (res.data.shippingProfiles?.length > 0) {
        const current = res.data.shippingProfiles[0];
        setProfile(current);
        setFormData(current);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShipping(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.put('/api/dashboard/shipping', formData);
      if (res.data.success) {
        setProfile(res.data.shippingProfiles[0]);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  if (loading) return null;

  return (
    <div className="glass-card p-6 md:p-8 mt-8 flex flex-col group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-400">Fulfillment</h3>
            <div className="text-lg font-bold tracking-tight text-white">Shipping Destination</div>
          </div>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium underline underline-offset-2">
            {profile ? 'Edit Address' : 'Add Address'}
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input required placeholder="Address Line 1" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
              <input required placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Postal Code" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
              <input required placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white">Cancel</button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">Save Profile</button>
          </div>
        </form>
      ) : (
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
          {profile ? (
            <div className="text-slate-300 space-y-1 font-mono text-sm">
              <div>{profile.addressLine1}</div>
              <div>{profile.city}, {profile.state} {profile.postalCode}</div>
              <div>{profile.country}</div>
            </div>
          ) : (
            <div className="text-slate-500 italic">No shipping profile configured. AI orders will be blocked until an address is set.</div>
          )}
        </div>
      )}
    </div>
  );
}
