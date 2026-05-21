import { useState, useEffect } from 'react';
import { X, Save, FileCheck } from 'lucide-react';
import { auth } from '../../../firebase';
import {
    addLicense, updateLicense,
    type MedicalLicense,
} from '../../../services/licensesService';

interface Props {
    patientId:     string;
    patientName:   string;
    patientCedula: string;
    initialData?:  MedicalLicense;
    onClose:       () => void;
    onSaved?:      () => void;
}

function addDays(iso: string, days: number): string {
    if (!iso) return '';
    try {
        const d = new Date(iso + 'T12:00:00');
        d.setDate(d.getDate() + days - 1);
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

export default function MedicalLicenseForm({
    patientId, patientName, patientCedula, initialData, onClose, onSaved,
}: Props) {
    const today  = new Date().toISOString().split('T')[0];
    const isEdit = !!initialData;

    const [date,         setDate]         = useState(initialData?.date        ?? today);
    const [fechaInicio,  setFechaInicio]  = useState(initialData?.fechaInicio ?? today);
    const [diasReposo,   setDiasReposo]   = useState<number>(initialData?.diasReposo ?? 1);
    const [fechaFin,     setFechaFin]     = useState(initialData?.fechaFin    ?? today);
    const [diagnostico,  setDiagnostico]  = useState(initialData?.diagnostico ?? '');
    const [indicaciones, setIndicaciones] = useState(initialData?.indicaciones ?? '');
    const [saving,       setSaving]       = useState(false);
    const [saveError,    setSaveError]    = useState('');

    useEffect(() => {
        if (fechaInicio && diasReposo > 0)
            setFechaFin(addDays(fechaInicio, diasReposo));
    }, [fechaInicio, diasReposo]);

    const handleSave = async () => {
        if (!diagnostico.trim()) return;
        setSaving(true);
        setSaveError('');
        try {
            const payload = {
                date, fechaInicio, diasReposo, fechaFin, diagnostico, indicaciones,
            };
            if (isEdit && initialData) {
                await updateLicense(initialData.id, payload);
            } else {
                await addLicense({
                    patientId, patientName, patientCedula,
                    doctorUid: auth.currentUser?.uid || '',
                    ...payload,
                    createdAt: new Date().toISOString(),
                });
            }
            onSaved?.();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-bd flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <FileCheck size={18} className="text-brand-primary" />
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-50">
                                {isEdit ? 'Editar licencia médica' : 'Nueva licencia médica'}
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

                    {/* Fecha de emisión */}
                    <div className="w-48">
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Fecha de emisión</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                    </div>

                    {/* Período de reposo */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-2">Período de reposo</label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Desde</label>
                                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                                    className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Días</label>
                                <input
                                    type="number" min={1} max={365} value={diasReposo}
                                    onChange={e => setDiasReposo(Math.max(1, Number(e.target.value)))}
                                    className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide block mb-1">Hasta</label>
                                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                                    className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
                            </div>
                        </div>
                        {fechaInicio && diasReposo > 0 && (
                            <p className="text-xs text-brand-primary font-semibold mt-1.5">
                                {diasReposo} {diasReposo === 1 ? 'día' : 'días'} de reposo
                            </p>
                        )}
                    </div>

                    {/* Diagnóstico */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">
                            Diagnóstico <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                            placeholder="Describa el diagnóstico que justifica el reposo..." rows={3}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>

                    {/* Indicaciones */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5">Indicaciones adicionales</label>
                        <textarea
                            value={indicaciones} onChange={e => setIndicaciones(e.target.value)}
                            placeholder="Restricciones de actividad, medicamentos, seguimiento..." rows={3}
                            className="w-full bg-surface border border-bd2 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Error */}
                {saveError && (
                    <div className="mx-6 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                        Error al guardar: {saveError}
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-bd flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-surface rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={!diagnostico.trim() || saving}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all">
                        <Save size={15} /> {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar licencia'}
                    </button>
                </div>
            </div>
        </div>
    );
}
