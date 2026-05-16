import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '../../../store/PatientContext';
import { TIPO_SHORT } from '../../../services/patientsService';
import {
    Search, AlertTriangle, User, Loader2, ChevronLeft, ChevronRight,
    Calendar, History
} from 'lucide-react';

function Initials({ name }: { name: string }) {
    const parts = name.trim().split(/\s+/);
    const letters = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return (
        <div className="w-9 h-9 rounded-full bg-medical-blue/10 flex items-center justify-center flex-shrink-0">
            <span className="text-medical-blue text-xs font-bold">{letters}</span>
        </div>
    );
}

function toLocalDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-CA');
}

function today(): string {
    return new Date().toLocaleDateString('en-CA');
}

function addDays(dateStr: string, n: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('en-CA');
}

function formatDayLabel(dateStr: string): string {
    const t = today();
    if (dateStr === t) return 'Hoy';
    if (dateStr === addDays(t, -1)) return 'Ayer';
    return new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function PatientList() {
    const { patientsV2, loading } = usePatients();
    const { id: selectedId }      = useParams<{ id: string }>();
    const navigate                = useNavigate();

    const [searchTerm,    setSearchTerm]    = useState('');
    const [selectedDate,  setSelectedDate]  = useState(today);
    const [showHistorial, setShowHistorial] = useState(false);

    const isSearching = searchTerm.trim().length > 0;

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        if (isSearching) {
            return patientsV2.filter(p =>
                p.nombre.toLowerCase().includes(term) ||
                p.cedula_pasaporte.toLowerCase().includes(term) ||
                p.telefono.toLowerCase().includes(term) ||
                p.celular.toLowerCase().includes(term)
            );
        }

        if (showHistorial) {
            return patientsV2;
        }

        return patientsV2.filter(p =>
            toLocalDate(p.lastVisitAt) === selectedDate
        );
    }, [patientsV2, searchTerm, selectedDate, showHistorial, isSearching]);

    const isToday = selectedDate === today();

    return (
        <div className="w-80 flex-shrink-0 bg-card border-r border-bd2 flex flex-col overflow-hidden">

            {/* Day navigator */}
            {!isSearching && !showHistorial && (
                <div className="px-4 pt-4 pb-3 border-b border-bd">
                    <div className="flex items-center justify-between gap-1">
                        <button
                            onClick={() => setSelectedDate(d => addDays(d, -1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                            aria-label="Día anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex-1 flex flex-col items-center gap-0.5">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                                Pacientes del día
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Calendar size={11} className="text-medical-blue flex-shrink-0" />
                                <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatDayLabel(selectedDate)}</span>
                            </div>
                            {!isToday && (
                                <button
                                    onClick={() => setSelectedDate(today())}
                                    className="text-[9px] text-medical-blue font-bold hover:underline mt-0.5"
                                >
                                    Volver a hoy
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedDate(d => {
                                const next = addDays(d, 1);
                                return next > today() ? d : next;
                            })}
                            disabled={isToday}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            aria-label="Día siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Search + historial toggle */}
            <div className="p-4 pb-3 border-b border-bd space-y-2.5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
                    <input
                        type="text"
                        placeholder="Buscar en historial..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border border-bd2 rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-medical-blue/20 focus:border-medical-blue transition-all"
                    />
                </div>

                <div className="flex items-center justify-between">
                    {isSearching ? (
                        <span className="text-[10px] font-bold text-medical-blue flex items-center gap-1 bg-medical-blue/5 px-2 py-1 rounded-full">
                            <History size={9} /> Buscando en historial completo
                        </span>
                    ) : (
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium px-1">
                            {filtered.length} paciente{filtered.length !== 1 ? 's' : ''}
                            {showHistorial ? ' en total' : ' encontrados'}
                        </p>
                    )}

                    {!isSearching && (
                        <button
                            onClick={() => setShowHistorial(h => !h)}
                            className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                                showHistorial
                                    ? 'bg-gold/15 text-amber-700'
                                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                            }`}
                        >
                            <History size={9} />
                            {showHistorial ? 'Ver solo hoy' : 'Ver historial'}
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-brand-primary" size={28} />
                        <p className="text-gray-400 dark:text-slate-500 text-xs animate-pulse">Sincronizando con la nube...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-500 flex flex-col items-center gap-3 px-4">
                        <User size={28} strokeWidth={1} />
                        {isSearching ? (
                            <p className="text-sm">Sin resultados para "{searchTerm}"</p>
                        ) : (
                            <>
                                <p className="text-sm">
                                    {isToday
                                        ? 'No hay pacientes registrados para hoy'
                                        : `No hay pacientes para ${formatDayLabel(selectedDate)}`}
                                </p>
                                <button
                                    onClick={() => setShowHistorial(true)}
                                    className="text-xs text-medical-blue font-semibold hover:underline"
                                >
                                    Ver historial completo
                                </button>
                            </>
                        )}
                    </div>
                ) : filtered.map(p => {
                    const selected    = selectedId === p.id;
                    const tipoShort   = p.lastVisitType ? TIPO_SHORT[p.lastVisitType] : null;
                    const date        = new Date(p.lastVisitAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                    const motivoShort = p.lastMotivo
                        ? p.lastMotivo.replace('Cirugía ', '').replace('Metabolic Surgery', 'Metabólica').replace('General Surgery', 'General')
                        : null;

                    return (
                        <div
                            key={p.id}
                            onClick={() => navigate(`/doctor/pacientes/${p.id}`)}
                            className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                                selected
                                    ? 'bg-medical-blue/5 border-medical-blue/25 shadow-sm'
                                    : 'bg-card border-transparent hover:border-bd2 hover:bg-gray-50/80 dark:hover:bg-white/5'
                            }`}
                        >
                            <div className="flex items-start gap-2.5">
                                <Initials name={p.nombre} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <h4 className={`font-semibold text-sm truncate leading-tight ${
                                            selected ? 'text-medical-blue' : 'text-gray-800 dark:text-slate-200'
                                        }`}>
                                            {p.nombre}
                                        </h4>
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">{date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {p.hasAlertFlag && (
                                            <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                                        )}
                                        {p.cedula_pasaporte && (
                                            <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                                                {p.cedula_pasaporte.substring(0, 12)}
                                            </span>
                                        )}
                                        {tipoShort && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                                                selected
                                                    ? 'bg-medical-blue/15 text-medical-blue'
                                                    : 'bg-brand-primary/10 text-brand-primary'
                                            }`}>
                                                {tipoShort}
                                            </span>
                                        )}
                                        {p.totalVisits > 1 && (
                                            <span className="text-[9px] font-bold bg-gray-100 dark:bg-[#1e2640] text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                                                {p.totalVisits} consultas
                                            </span>
                                        )}
                                        {motivoShort && !tipoShort && (
                                            <span className="text-[9px] font-medium text-gray-400 dark:text-slate-500 truncate">{motivoShort}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
