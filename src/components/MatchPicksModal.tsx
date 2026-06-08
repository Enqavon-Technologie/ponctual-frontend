import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    X, Video, Calendar, Mail, Phone, CheckCircle2, Clock, UserX,
    Link as LinkIcon, ClipboardList, Crown, Loader2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../i18n/LanguageContext';
import { api, ParentRequest } from '../services/api';

interface MatchPicksModalProps {
    request: ParentRequest;
    onClose: () => void;
    onUpdated: () => void;
}

const PHOTO_BASE = 'https://bloom-buddies.fr/uploads/profile_images/';
const GROSS_RATE = 13.22; // € / hour, gross

const fmtDate = (d?: string | null) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return d; }
};

const hoursBetween = (start?: string, end?: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return 0;
    return Math.max(0, (eh + em / 60) - (sh + sm / 60));
};

const ageFromDob = (dob?: string): number | null => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age >= 0 ? age : null;
};

export const MatchPicksModal: React.FC<MatchPicksModalProps> = ({ request, onClose, onUpdated }) => {
    const { language } = useLanguage();
    const fr = language === 'fr';

    const familyName = `${request.user?.first_name ?? ''} ${request.user?.last_name ?? ''}`.trim() || 'Family';
    const choices: any[] = (request.choices as any[]) ?? [];
    const selected = choices.filter(c => c.status === 'selected');
    const proposed = choices.filter(c => c.status === 'proposed');
    const rejected = choices.filter(c => c.status === 'rejected');

    const [confirmingFinal, setConfirmingFinal] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const copyLink = () => {
        const link = `${window.location.origin}/match/${request.id}`;
        navigator.clipboard.writeText(link);
        toast.success(fr ? 'Lien copié !' : 'Link copied!');
    };

    const copyDetails = () => {
        const children = request.children ?? [];
        const ages = children.map((c: any) => ageFromDob(c.child_dob)).filter((a) => a !== null);
        const lines: string[] = [];
        lines.push(`${fr ? 'Demande' : 'Request'} #${request.id} — ${familyName}`);
        if (request.parent_address) lines.push(`${fr ? 'Adresse' : 'Address'}: ${request.parent_address}`);
        lines.push(`${fr ? 'Enfants' : 'Children'}: ${children.length}${ages.length ? ` (${fr ? 'âges' : 'ages'}: ${ages.join(', ')})` : ''}`);
        lines.push('');
        lines.push(`${fr ? 'Planning' : 'Schedule'}:`);
        let totalHours = 0;
        (request.schedules ?? []).forEach((s: any) => {
            const slots = s.slots ?? [];
            const slotStrs = slots.map((sl: any) => {
                totalHours += hoursBetween(sl.start_time, sl.end_time);
                return `${(sl.start_time || '').slice(0, 5)}-${(sl.end_time || '').slice(0, 5)}`;
            });
            lines.push(`  ${fmtDate(s.schedule_date)}: ${slotStrs.join(', ') || '—'}`);
        });
        lines.push('');
        lines.push(`${fr ? 'Total heures' : 'Total hours'}: ${totalHours.toFixed(2)}h`);
        lines.push(`${fr ? 'Salaire brut' : 'Gross salary'}: ${(totalHours * GROSS_RATE).toFixed(2)} € (13,22 €/h ${fr ? 'brut' : 'gross'})`);
        navigator.clipboard.writeText(lines.join('\n'));
        toast.success(fr ? 'Détails copiés !' : 'Details copied!');
    };

    const confirmFinalChoice = async () => {
        if (!confirmingFinal) return;
        setSubmitting(true);
        try {
            const res = await api.selectFinalChoice(confirmingFinal.id);
            if (res.status) {
                toast.success(fr ? 'Choix final confirmé.' : 'Final choice confirmed.');
                setConfirmingFinal(null);
                onUpdated();
                onClose();
            } else {
                toast.error(res.message || (fr ? 'Échec.' : 'Failed.'));
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || (fr ? 'Échec.' : 'Failed.'));
        } finally {
            setSubmitting(false);
        }
    };

    const Avatar = ({ c }: { c: any }) => (
        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {c.babysitter_pic
                ? <img src={`${PHOTO_BASE}${c.babysitter_pic}`} alt={c.babysitter_first_name} onError={(e) => { (e.target as HTMLImageElement).src = `${PHOTO_BASE}default.jpg`; }} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-slate-400">{(c.babysitter_first_name || '?').charAt(0)}</span>}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
                className="relative z-10 w-full max-w-lg bg-white rounded-[24px] shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{fr ? 'Candidates & entretiens' : 'Candidates & interviews'}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{familyName} · {fr ? 'demande' : 'request'} #{request.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700"><X size={18} /></button>
                </div>

                {/* Toolbar: copy link / copy details */}
                <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2">
                    <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        <LinkIcon size={14} /> {fr ? 'Copier le lien' : 'Copy link'}
                    </button>
                    <button onClick={copyDetails} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        <ClipboardList size={14} /> {fr ? 'Copier les détails' : 'Copy details'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Selected by family */}
                    <section>
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 mb-3">
                            <CheckCircle2 size={13} /> {fr ? 'Sélectionnées par la famille' : 'Selected by family'} ({selected.length})
                        </p>
                        {selected.length === 0 ? (
                            <p className="text-xs text-slate-400">{fr ? 'La famille n’a pas encore choisi.' : 'The family hasn’t made their picks yet.'}</p>
                        ) : (
                            <div className="space-y-3">
                                {selected.map(c => {
                                    const date = fmtDate(c.interview_date);
                                    const time = (c.interview_time || '').slice(0, 5);
                                    const isFinal = Number(c.final_choice) === 1;
                                    return (
                                        <div key={c.id} className={`rounded-2xl p-4 border ${isFinal ? 'bg-brand-accent/5 border-brand-accent/30' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <Avatar c={c} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-800 truncate flex items-center gap-2">
                                                        {c.babysitter_first_name} {c.babysitter_last_name}
                                                        {isFinal && <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full"><Crown size={10} /> {fr ? 'Choix final' : 'Final'}</span>}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-400">
                                                        {c.babysitter_email && <span className="inline-flex items-center gap-1 min-w-0"><Mail size={10} /><span className="truncate">{c.babysitter_email}</span></span>}
                                                        {c.babysitter_phone && <span className="inline-flex items-center gap-1"><Phone size={10} />{c.babysitter_phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                                                {date ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
                                                        <Calendar size={13} /> {date} @ {time}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                        <Clock size={13} /> {fr ? 'Pas d’entretien' : 'No interview scheduled'}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {c.zoom_meeting_link && (
                                                        <a href={c.zoom_meeting_link} target="_blank" rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                                                            <Video size={13} /> {fr ? 'Rejoindre' : 'Join'}
                                                        </a>
                                                    )}
                                                    {!isFinal && (
                                                        <button onClick={() => setConfirmingFinal(c)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent text-white text-xs font-bold rounded-lg hover:bg-[#66B2AC] transition-colors">
                                                            <Crown size={13} /> {fr ? 'Choix final' : 'Make final choice'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Proposed, awaiting family */}
                    {proposed.length > 0 && (
                        <section>
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-blue-600 mb-3">
                                <Clock size={13} /> {fr ? 'Proposées — en attente' : 'Proposed — awaiting family'} ({proposed.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {proposed.map(c => (
                                    <div key={c.id} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full pl-1 pr-3 py-1">
                                        <Avatar c={c} />
                                        <span className="text-xs font-semibold text-slate-600">{c.babysitter_first_name} {c.babysitter_last_name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Declined */}
                    {rejected.length > 0 && (
                        <section>
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3">
                                <UserX size={13} /> {fr ? 'Refusées' : 'Declined'} ({rejected.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {rejected.map(c => (
                                    <span key={c.id} className="text-xs text-slate-400 line-through">{c.babysitter_first_name} {c.babysitter_last_name}</span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>

            {/* Final-choice confirmation */}
            {confirmingFinal && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submitting && setConfirmingFinal(null)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 w-full max-w-sm bg-white rounded-[24px] shadow-2xl p-7 text-center"
                    >
                        <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{fr ? 'Confirmer le choix final' : 'Confirm Final Choice'}</h3>
                        <p className="text-sm text-slate-500 mb-2">
                            {confirmingFinal.babysitter_first_name} {confirmingFinal.babysitter_last_name}
                        </p>
                        <p className="text-sm text-slate-500 mb-6">{fr ? 'Êtes-vous sûr ? Cette décision est irréversible.' : 'Are you sure? This decision cannot be undone.'}</p>
                        <div className="flex gap-3">
                            <button onClick={() => !submitting && setConfirmingFinal(null)} disabled={submitting}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
                                {fr ? 'Retour' : 'Back'}
                            </button>
                            <button onClick={confirmFinalChoice} disabled={submitting}
                                className="flex-1 py-3 rounded-xl bg-brand-accent text-white font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-[#66B2AC] transition-colors disabled:opacity-60">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {fr ? 'Oui, confirmer' : 'Yes, confirm'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
