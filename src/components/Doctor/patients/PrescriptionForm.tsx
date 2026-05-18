import { useState } from 'react';
import { X, Plus, Trash2, Save, FileText } from 'lucide-react';
import type { PrescriptionMedication } from '../../../utils/generatePrescriptionPdf';
import { auth } from '../../../firebase';
import {
    addPrescription, updatePrescription,
    type Prescription,
} from '../../../services/prescriptionsService';

interface Props {
    patientId:     string;
    patientName:   string;
    patientCedula: string;
    initialData?:  Prescription;
    onClose:       () => void;
    onSaved?:      () => void;
}

const EMPTY_MED = (): PrescriptionMedication => ({
    nombre: '', dosis: '', frecuencia: '', duracion: '',
});

export default function PrescriptionForm({
    patientId, patientName, patientCedula, initialData, onClose, onSaved,
}: Props) {
    const today   = new Date().toISOString().split('T')[0];
    const isEdit  = !!initialData;

    const [date,         setDate]         = useState(initialData?.date         ?? today);
    const [diagnostico,  setDiagnostico]  = useState(initialData?.diagnostico  ?? '');
    const [medications,  setMedications]  = useState<PrescriptionMedication[]>(
        initialData?.medications?.length ? initialData.medications : [EMPTY_MED()],
    );
    const [indicaciones, setIndicaciones] = useState(initialData?.indicaciones ?? '');
    const [saving,       setSaving]       = useState(false);

    const updateMed = (i: number, field: keyof PrescriptionMedication, val: string) =>
        setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

    const addMed    = () => setMedications(prev => [...prev, EMPTY_MED()]);
    const removeMed = (i: number) =>
        setMedications(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

    const handleSave = async () => {
        setSaving(true);
        try {
            const meds = medications.filter(m => m.nombre.trim());
            if (isEdit && initialData) {
                await updatePrescription(initialData.id, {
                    date, diagnostico, medications: meds, indicaciones,
                });
            } else {
                await addPrescription({
                    patientId, patientCedula, patientName,
                    doctorUid: auth.currentUser?.uid || '',
                    date, diagnostico, medications: meds, indicaciones,
                    createdAt: new Date().toISOString(),
                });
            }
            onSaved?.();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const hasContent = diagnostico.trim() || medications.some(m => m.nombre.trim()) || indicaciones.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-bd flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FileText size={18} className="text-brand-primary" />
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-50">
                                {isEdit ? 'Editar receta' : 'Generar receta médica'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{patientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Date */}
                    <div className="w-48">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Fecha</label>
                        <input
                            type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        />
                    </div>

                    {/* Diagnóstico */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Diagnóstico</label>
                        <textarea
                            value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                            placeholder="Describa el diagnóstico..." rows={2}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* Medications */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Medicamentos</label>
                            <button onClick={addMed} className="flex items-center gap-1 text-xs text-brand-primary font-semibold hover:underline">
                                <Plus size={12} /> Agregar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {medications.map((med, i) => (
                                <div key={i} className="bg-surface rounded-xl p-4 border border-bd relative group">
                                    {medications.length > 1 && (
                                        <button
                                            onClick={() => removeMed(i)}
                                            className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">
                                                Nombre del medicamento *
                                            </label>
                                            <input type="text" value={med.nombre}
                                                onChange={e => updateMed(i, 'nombre', e.target.value)}
                                                placeholder="ej. Metformina 500mg"
                                                className="w-full bg-card border border-bd2 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Dosis</label>
                                            <input type="text" value={med.dosis}
                                                onChange={e => updateMed(i, 'dosis', e.target.value)}
                                                placeholder="ej. 1 tableta"
                                                className="w-full bg-card border border-bd2 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Frecuencia</label>
                                            <input type="text" value={med.frecuencia}
                                                onChange={e => updateMed(i, 'frecuencia', e.target.value)}
                                                placeholder="ej. Cada 12 horas"
                                                className="w-full bg-card border border-bd2 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Duración</label>
                                            <input type="text" value={med.duracion}
                                                onChange={e => updateMed(i, 'duracion', e.target.value)}
                                                placeholder="ej. 30 días"
                                                className="w-full bg-card border border-bd2 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Indicaciones generales */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
                            Indicaciones generales
                        </label>
                        <textarea
                            value={indicaciones} onChange={e => setIndicaciones(e.target.value)}
                            placeholder="Dieta, restricciones, actividad física, próxima consulta..." rows={3}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-bd flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-surface rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={!hasContent || saving}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
                        <Save size={15} /> {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar receta'}
                    </button>
                </div>
            </div>
        </div>
    );
}
