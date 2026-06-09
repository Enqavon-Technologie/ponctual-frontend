import React, { useState, useEffect, useRef, useCallback } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import {
  Plus,
  Baby,
  Clock,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  User,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface AddNewActiveRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const calculateAge = (dob: string) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}${months > 0 ? ` ${months}m` : ''}`;
  }
  return `${months} ${months === 1 ? 'month' : 'months'}`;
};

export const AddNewActiveRequestModal: React.FC<AddNewActiveRequestModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_phone: '',
    parent_address: '',
    hourly_rate: '27.99',
    user_language: 'en' as 'en' | 'fr',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    children: [{ child_dob: '' }],
    schedules: [
      {
        schedule_date: '',
        slots: [{ start_time: '', end_time: '' }]
      }
    ]
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const parentAddressRef = useRef<HTMLInputElement>(null);

  // Google Places Autocomplete for Parent Address
  useEffect(() => {
    if (!parentAddressRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(parentAddressRef.current, {
      types: ['address'],
      fields: ['formatted_address', 'geometry']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || '';
        
        setFormData(prev => ({
          ...prev,
          parent_address: address,
          lat,
          lng
        }));
      }
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [window.google]);


  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddChild = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { child_dob: '' }]
    }));
  }, []);

  const handleChildDOBChange = useCallback((index: number, dob: string) => {
    setFormData(prev => {
      const newChildren = [...prev.children];
      if (newChildren[index]) {
        newChildren[index] = { ...newChildren[index], child_dob: dob };
      }
      return { ...prev, children: newChildren };
    });
  }, []);

  const handleRemoveChild = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  }, []);

  const handleAddSchedule = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          schedule_date: '',
          slots: [{ start_time: '', end_time: '' }]
        }
      ]
    }));
  }, []);

  const handleRemoveSchedule = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  }, []);

  const handleScheduleDateChange = useCallback((index: number, date: string) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      if (newSchedules[index]) {
        newSchedules[index] = { ...newSchedules[index], schedule_date: date };
      }
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const handleAddSlot = useCallback((scheduleIndex: number) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      if (newSchedules[scheduleIndex]) {
        newSchedules[scheduleIndex].slots = [
          ...newSchedules[scheduleIndex].slots,
          { start_time: '', end_time: '' }
        ];
      }
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const handleRemoveSlot = useCallback((scheduleIndex: number, slotIndex: number) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      if (newSchedules[scheduleIndex]) {
        newSchedules[scheduleIndex].slots = newSchedules[scheduleIndex].slots.filter((_, i) => i !== slotIndex);
      }
      return { ...prev, schedules: newSchedules };
    });
  }, []);

  const handleSlotChange = useCallback((scheduleIndex: number, slotIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setFormData(prev => {
      const newSchedules = [...prev.schedules];
      if (newSchedules[scheduleIndex] && newSchedules[scheduleIndex].slots[slotIndex]) {
        const formattedValue = value.length === 5 ? `${value}:00` : value;
        newSchedules[scheduleIndex].slots[slotIndex] = {
          ...newSchedules[scheduleIndex].slots[slotIndex],
          [field]: formattedValue
        };
      }
      return { ...prev, schedules: newSchedules };
    });
  }, []);


  const handleSubmit = async () => {
    // Validation
    const errors: string[] = [];
    if (!formData.first_name) errors.push('First Name');
    if (!formData.last_name) errors.push('Last Name');
    if (!formData.email) errors.push('Email');
    if (!formData.user_phone) errors.push('Phone Number');
    if (!formData.parent_address) errors.push('Address');
    if (!formData.hourly_rate) errors.push('Hourly Rate');

    if (errors.length > 0) {
      toast.error(`Please fill in required details: ${errors.join(', ')}`);
      return;
    }

    if (formData.children.length === 0) {
        toast.error('Please add at least one child');
        return;
    }
    if (formData.children.some(c => !c.child_dob)) {
        toast.error('Please fill in Date of Birth for all children');
        return;
    }

    if (formData.schedules.length === 0) {
        toast.error('Please add at least one schedule date');
        return;
    }
    if (formData.schedules.some(s => !s.schedule_date || s.slots.some(slot => !slot.start_time || !slot.end_time))) {
        toast.error('Please fill in all schedule dates and time slots');
        return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.createParentRequest({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        user_phone: formData.user_phone,
        parent_address: formData.parent_address,
        children: formData.children,
        schedules: formData.schedules,
        hourly_rate: formData.hourly_rate,
        user_language: formData.user_language,
        board_status: 'In Matching',
        from_admin: true,
        lat: formData.lat,
        lng: formData.lng,
        choices: [] // Manual selection removed
      });

      if (response.status) {
        setCreatedRequestId(response.data?.id || null);
        onSuccess();
        setShowSuccess(true);
      } else {
        toast.error(response.message || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('An error occurred while creating the request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex flex-col h-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Add New Active Request</h2>
              <p className="text-xs text-slate-400 font-medium">Create a request with automated matching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Parent Information */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Parent Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">First Name</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5 focus-within:z-10">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Phone Number</label>
                <PhoneInput
                    country={'fr'}
                    preferredCountries={['fr', 'be', 'ch', 'lu']}
                    value={formData.user_phone}
                    onChange={(phone) => handleChange('user_phone', phone)}
                    containerClass="!w-full"
                    inputClass="!w-full !h-[46px] !bg-slate-50 !border-slate-100 !rounded-xl focus:!bg-white focus:!ring-2 focus:!ring-slate-900/10 focus:!border-slate-900 !outline-none !transition-all !text-sm !font-medium"
                    buttonClass="!bg-slate-50 !border-slate-100 !rounded-l-xl"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Parent Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={parentAddressRef}
                    type="text"
                    required
                    placeholder="Enter full address"
                    value={formData.parent_address}
                    onChange={(e) => handleChange('parent_address', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Hourly Rate (€)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hourly_rate}
                  onChange={(e) => handleChange('hourly_rate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Preferred Language</label>
                <div className="flex items-center gap-2 p-1 bg-slate-50 border border-slate-100 rounded-xl">
                  <button
                    onClick={() => handleChange('user_language', 'en')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.user_language === 'en' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleChange('user_language', 'fr')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.user_language === 'fr' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Français
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 focus-within:z-10">
                {/* Bloom Buddies Babysitter ID field removed */}
              </div>
            </div>
          </section>

          {/* Children & Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Children Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Baby size={14} /> Children
                </h3>
                <button
                  onClick={handleAddChild}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Child
                </button>
              </div>
              <div className="space-y-3">
                {formData.children.map((child, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 relative group">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Child {idx + 1} DOB</label>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {calculateAge(child.child_dob) || 'Enter DOB'}
                        </span>
                      </div>
                      <input
                        type="date"
                        value={child.child_dob}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleChildDOBChange(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs font-medium"
                      />
                    </div>
                    {formData.children.length > 1 && (
                      <button
                        onClick={() => handleRemoveChild(idx)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Schedule Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Schedule
                </h3>
                <button
                  onClick={handleAddSchedule}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Date
                </button>
              </div>
              <div className="space-y-4">
                {formData.schedules.map((schedule, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <input
                        type="date"
                        value={schedule.schedule_date}
                        onChange={(e) => handleScheduleDateChange(sIdx, e.target.value)}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none text-xs font-bold"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddSlot(sIdx)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Add Slot"
                        >
                          <Plus size={14} />
                        </button>
                        {formData.schedules.length > 1 && (
                          <button
                            onClick={() => handleRemoveSchedule(sIdx)}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {schedule.slots.map((slot, tIdx) => (
                        <div key={tIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-100 group/slot">
                          <div className="flex-1 flex items-center gap-1">
                            <Clock size={10} className="text-slate-400" />
                            <input
                              type="time"
                              value={slot.start_time.substring(0, 5)}
                              onChange={(e) => handleSlotChange(sIdx, tIdx, 'start_time', e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-slate-900"
                            />
                            <span className="text-slate-300">-</span>
                            <input
                              type="time"
                              value={slot.end_time.substring(0, 5)}
                              onChange={(e) => handleSlotChange(sIdx, tIdx, 'end_time', e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-slate-900"
                            />
                          </div>
                          {schedule.slots.length > 1 && (
                            <button
                              onClick={() => handleRemoveSlot(sIdx, tIdx)}
                              className="p-1 text-slate-300 hover:text-red-500 transition-all"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-medium italic">All required fields must be filled to create a request.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </button>
          </div>
        </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-16 text-center space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center shadow-inner animate-in zoom-in duration-500">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900">Success!</h2>
                <p className="text-slate-600 font-bold text-lg">Price quote sent successfully</p>
              </div>
              <p className="text-slate-400 max-w-xs leading-relaxed font-medium">
                The request has been created and our automated matching system will now find the perfect babysitter.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <button
                  onClick={() => {
                    if (createdRequestId) {
                      const link = `https://ponctuel.bloom-buddies.fr/price/${createdRequestId}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Price Quote link copied!');
                    }
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-50 text-emerald-600 text-sm font-black rounded-2xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <LinkIcon size={18} />
                  Copy Price Quote
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-12 py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
