import { useState } from 'react';
import { migrateLegacyPatients, type MigrationReport } from '../../../services/migrationService';
import { Database, CheckCircle2, AlertTriangle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function MigrationPanel({ onClose }: { onClose: () => void }) {
    const [running,  setRunning]  = useState(false);
    const [log,      setLog]      = useState<string[]>([]);
    const [report,   setReport]   = useState<MigrationReport | null>(null);
    const [showLog,  setShowLog]  = useState(false);

    const run = async () => {
        setRunning(true);
        setLog([]);
        setReport(null);
        try {
            const result = await migrateLegacyPatients(msg =>
                setLog(prev => [...prev, msg])
            );
            setReport(result);
        } catch (err: any) {
            setLog(prev => [...prev, `ERROR FATAL: ${err?.message ?? err}`]);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-medical-blue/10 flex items-center justify-center">
                            <Database size={18} className="text-medical-blue" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Migración de base de datos</h3>
                            <p className="text-[11px] text-gray-400">Datos legacy → arquitectura V2</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">

                    {!report && !running && (
                        <>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <div className="flex items-start gap-2.5">
                                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-semibold text-amber-800">Antes de continuar</p>
                                        <ul className="text-xs text-amber-700 space-y-1 list-disc ml-4">
                                            <li>Esta operación lee los datos del formato antiguo y crea documentos en el nuevo formato V2.</li>
                                            <li>Los documentos originales <strong>no se eliminan</strong> — puedes repetir si hay errores.</li>
                                            <li>Se crean: pacientes, visitas, métricas clínicas e historial médico.</li>
                                            <li>Las encuestas se mueven a la colección <code>surveys</code>.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={run}
                                className="w-full flex items-center justify-center gap-2 bg-medical-blue hover:bg-medical-blue/90 text-white font-bold py-3 rounded-xl text-sm transition-all"
                            >
                                <Database size={16} /> Iniciar migración
                            </button>
                        </>
                    )}

                    {running && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 size={32} className="animate-spin text-medical-blue" />
                            <p className="text-sm font-semibold text-gray-700">Migrando datos...</p>
                            <p className="text-xs text-gray-400 text-center max-w-xs">
                                Este proceso puede tardar unos segundos dependiendo de la cantidad de registros.
                            </p>
                        </div>
                    )}

                    {/* Progress log */}
                    {log.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowLog(v => !v)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors mb-2"
                            >
                                {showLog ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                Ver log ({log.length} entradas)
                            </button>
                            {showLog && (
                                <div className="bg-gray-900 rounded-xl p-3 max-h-40 overflow-y-auto space-y-0.5">
                                    {log.map((line, i) => (
                                        <p key={i} className="text-[11px] text-gray-300 font-mono leading-relaxed">{line}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Report */}
                    {report && (
                        <div className="space-y-4">
                            <div className={`flex items-center gap-2.5 p-4 rounded-xl border ${
                                report.errors.length === 0
                                    ? 'bg-green-50 border-green-100'
                                    : 'bg-amber-50 border-amber-100'
                            }`}>
                                {report.errors.length === 0
                                    ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                                    : <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
                                }
                                <p className={`text-sm font-bold ${report.errors.length === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                                    {report.errors.length === 0
                                        ? 'Migración completada sin errores'
                                        : `Migración completada con ${report.errors.length} error${report.errors.length !== 1 ? 'es' : ''}`
                                    }
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { label: 'Pacientes creados',   value: report.patientsCreated },
                                    { label: 'Visitas creadas',     value: report.visitsCreated },
                                    { label: 'Métricas guardadas',  value: report.metricsCreated },
                                    { label: 'Historias médicas',   value: report.historiesCreated },
                                    { label: 'Encuestas migradas',  value: report.surveysMovedCount },
                                    { label: 'Errores',             value: report.errors.length, alert: report.errors.length > 0 },
                                ].map(({ label, value, alert }) => (
                                    <div key={label} className={`p-3 rounded-xl flex flex-col gap-0.5 ${alert ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${alert ? 'text-red-500' : 'text-gray-400'}`}>{label}</span>
                                        <span className={`text-xl font-extrabold leading-none ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            {report.errors.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-3 space-y-1">
                                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Errores</p>
                                    {report.errors.map((e, i) => (
                                        <p key={i} className="text-xs text-red-700 font-mono">{e}</p>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={run}
                                className="w-full flex items-center justify-center gap-2 border border-medical-blue text-medical-blue hover:bg-medical-blue/5 font-semibold py-2.5 rounded-xl text-sm transition-all"
                            >
                                Ejecutar de nuevo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
