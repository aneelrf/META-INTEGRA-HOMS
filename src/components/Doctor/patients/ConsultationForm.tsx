import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { auth } from '../../../firebase';
import {
    addConsultation, CONSULTATION_TYPES, type ConsultationInput,
} from '../../../services/consultationsService';
import { calcIMC } from '../../../services/patientsService';

interface Props {
    patientId: string;
    patientCedula: string;
    patientEstatura?: unknown;
    onClose: () => void;
    onSaved: () => void;
}

export default function ConsultationForm({ patientId, patientCedula, patientEstatura, onClose, onSaved }: Props) {
    const today = new Date().toISOString().split('T')[0];

    const [date,        setDate]        = useState(today);
    const [type,        setType]        = useState(CONSULTATION_TYPES[0]);
    const [weight,      setWeight]      = useState('');
    const [systolicBP,  setSystolicBP]  = useState('');
    const [diastolicBP, setDiastolicBP] = useState('');
    const [notes,       setNotes]       = useState('');
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState<string | null>(null);

    const weightNum = weight ? Number(weight) : undefined;
    const imc = weightNum && patientEstatura
        ? calcIMC({ value: String(weightNum), unit: 'kg' }, patientEstatura)
        : undefined;

    const handleSubmit = async () => {
        if (!date || !notes.trim()) {
            setError('La fecha y las notas son obligatorias.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const now = new Date().toISOString();
            const data: ConsultationInput = {
                patientId,
                patientCedula,
                appointmentId: '',
                doctorUid: auth.currentUser?.uid || '',
                date,
                type,
                reason: '',
                diagnosis: '',
                treatmentPlan: '',
                recommendations: '',
                nextAppointmentDate: '',
                notes: notes.trim(),
                createdAt: now,
                updatedAt: now,
            };
            if (weightNum)   data.weight      = weightNum;
            if (imc)         data.imc         = parseFloat(imc.toFixed(1));
            if (systolicBP)  data.systolicBP  = Number(systolicBP);
            if (diastolicBP) data.diastolicBP = Number(diastolicBP);
            await addConsultation(data);
            onSaved();
        } catch (err) {
            console.error('[ConsultationForm]', err);
            setError('Error al guardar. Por favor intente de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Nueva nota de consulta</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Fecha *</label>
                            <input
                                type="date" value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tipo</label>
                            <select
                                value={type} onChange={e => setType(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            >
                                {CONSULTATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Peso (kg)</label>
                            <input
                                type="number" min="0" step="0.1" value={weight}
                                onChange={e => setWeight(e.target.value)}
                                placeholder="85.5"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">PA sistólica</label>
                            <input
                                type="number" min="0" value={systolicBP}
                                onChange={e => setSystolicBP(e.target.value)}
                                placeholder="120"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">PA diastólica</label>
                            <input
                                type="number" min="0" value={diastolicBP}
                                onChange={e => setDiastolicBP(e.target.value)}
                                placeholder="80"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                            />
                        </div>
                    </div>

                    {imc && (
                        <p className="text-xs text-brand-primary font-semibold bg-brand-primary/5 px-3 py-2 rounded-lg">
                            IMC calculado: {imc.toFixed(1)}
                        </p>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Notas *</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Evolución del paciente, indicaciones, observaciones..."
                            rows={5}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
                        />
                    </div>

                    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        Guardar nota
                    </button>
                </div>
            </div>
        </div>
    );
}
