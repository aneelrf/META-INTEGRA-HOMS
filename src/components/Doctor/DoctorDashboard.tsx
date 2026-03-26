import React, { useState } from 'react';
import { usePatients } from '../../store/PatientContext';
import { questions } from '../../config/questions';
import type { Category } from '../../config/questions';
import type { Language } from '../../config/i18n';
import { AlertTriangle, User, Calendar, FileText, Search, HeartPulse, Info, XCircle, Filter, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
    const { patients, loading } = usePatients();
    const navigate = useNavigate();
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [copied, setCopied] = useState(false);

    // Handle initial selection once patients load
    React.useEffect(() => {
        if (!selectedPatientId && patients.length > 0) {
            setSelectedPatientId(patients[0].id);
        }
    }, [patients, selectedPatientId]);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const displayLang: Language = (selectedPatient?.answers['_language'] as Language) || 'es';

    const filteredPatients = patients.filter(p => {
        const name = p.answers['nombre']?.toLowerCase() || '';
        const patientDate = new Date(p.createdAt);

        const matchesSearch = name.includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateStart) {
            const start = new Date(dateStart);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && patientDate >= start;
        }
        if (dateEnd) {
            const end = new Date(dateEnd);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && patientDate <= end;
        }

        return matchesSearch && matchesDate;
    });

    const getAnswersByCategory = (categories: Category[]) => {
        if (!selectedPatient) return [];
        return questions.filter(q => categories.includes(q.category as Category)).map(q => ({
            question: q,
            answer: selectedPatient.answers[q.id],
            specification: selectedPatient.answers[`${q.id}_spec`]
        }));
    };

    const calculateBMI = () => {
        if (!selectedPatient) return null;
        
        const pesoInfo = selectedPatient.answers['peso'];
        const estaturaInfo = selectedPatient.answers['estatura'];
        
        if (!pesoInfo || typeof pesoInfo !== 'object' || !pesoInfo.value || !estaturaInfo || typeof estaturaInfo !== 'object' || !estaturaInfo.value) {
            return null;
        }

        let pesoKg = Number(pesoInfo.value);
        if (pesoInfo.unit === 'lb') {
            pesoKg = pesoKg / 2.20462;
        }

        let estaturaCm = Number(estaturaInfo.value);
        if (estaturaInfo.unit === 'ft') {
            // Format can be feet like '5.9' or whatever they input, but based on the unit it's simply ft.
            estaturaCm = estaturaCm * 30.48;
        } else if (estaturaInfo.unit === 'm') {
            estaturaCm = estaturaCm * 100;
        }
        
        const estaturaM = estaturaCm / 100;
        
        if (estaturaM <= 0) return null;

        const bmi = pesoKg / (estaturaM * estaturaM);
        
        return {
            bmi: bmi.toFixed(2),
            pesoKg: pesoKg.toFixed(2),
            estaturaCm: estaturaCm.toFixed(2)
        };
    };

    const generateSummary = () => {
        if (!selectedPatient) return '';
        let text = `RESUMEN DE PACIENTE: ${selectedPatient.answers['nombre']?.toUpperCase()}\n`;
        text += `ID: ${selectedPatient.id}\n`;
        text += `Fecha de Registro: ${new Date(selectedPatient.createdAt).toLocaleString('es-ES')}\n`;
        text += `------------------------------------------\n\n`;

        questions.forEach(q => {
            if (q.type === 'welcome' || q.type === 'outro') return;
            const ans = selectedPatient.answers[q.id];
            if (ans === undefined) return;

            const title = q.title[displayLang] || q.title['es'];
            const displayVal = typeof ans === 'object' ? `${ans.value} ${ans.unit}` : ans;
            text += `${title}: ${displayVal}\n`;

            const spec = selectedPatient.answers[`${q.id}_spec`];
            if (spec) text += `Detalles: ${spec}\n`;
        });

        const bmiData = calculateBMI();
        if (bmiData) {
            text += `\n------------------------------------------\n`;
            text += `CÁLCULO DE IMC:\n`;
            text += `Peso (convertido a kg): ${bmiData.pesoKg} kg\n`;
            text += `Estatura (convertida a cm): ${bmiData.estaturaCm} cm\n`;
            text += `IMC: ${bmiData.bmi}\n`;
        }

        return text;
    };

    const handleCopy = () => {
        const text = generateSummary();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderCard = (
        title: string,
        icon: React.ReactNode,
        categories: Category[]
    ) => {
        const data = getAnswersByCategory(categories);
        if (data.length === 0) return null;

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="text-brand-primary">{icon}</div>
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.map(({ question, answer, specification }) => {
                        if (answer === undefined) return null;

                        const isYes = (v: string) => v?.toLowerCase() === 'sí' || v?.toLowerCase() === 'si' || v?.toLowerCase() === 'yes' || v?.toLowerCase() === 'oui' || v?.toLowerCase() === 'ja';
                        const isAlert =
                            (question.category === 'medical' && isYes(answer.toString())) ||
                            (question.triggerSpecificationOn && answer === question.triggerSpecificationOn);

                        const displayValue = typeof answer === 'object' && answer !== null
                            ? `${answer.value} ${answer.unit}`
                            : answer;

                        return (
                            <div
                                key={question.id}
                                className={`p-4 rounded-xl flex flex-col gap-1 transition-all ${isAlert
                                    ? 'bg-red-50 border border-red-100 shadow-sm'
                                    : 'bg-gray-50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`text-sm font-medium ${isAlert ? 'text-red-700' : 'text-gray-500'}`}>
                                        {question.title[displayLang]}
                                    </span>
                                    {isAlert && <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
                                </div>

                                <span className={`text-lg font-semibold ${isAlert ? 'text-red-900' : 'text-gray-900'} capitalize`}>
                                    {displayValue || '-'}
                                </span>

                                {specification && (
                                    <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${isAlert ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        <span className="opacity-70 text-xs block uppercase mb-1 tracking-wider">Detalles:</span>
                                        {specification}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-gray-900">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                            <img src="logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-0.5 leading-none">
                                <span className="text-brand-primary font-bold text-xs tracking-widest uppercase">META </span>
                                <span className="text-brand-primary font-serif font-bold text-xl tracking-tight">Integra</span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">Dr. Héctor Sánchez Navarro</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar paciente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        />
                    </div>
                    <div className="mt-4 flex flex-col gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Filter size={10} /> Filtrar por fecha
                            </span>
                            {(dateStart || dateEnd) && (
                                <button
                                    onClick={() => { setDateStart(''); setDateEnd(''); }}
                                    className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase flex items-center gap-0.5"
                                >
                                    <XCircle size={10} /> Limpiar
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-gray-400 font-bold uppercase">Desde</label>
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="text-[11px] bg-white border border-gray-200 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-gray-400 font-bold uppercase">Hasta</label>
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="text-[11px] bg-white border border-gray-200 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm animate-pulse">Sincronizando con la nube...</p>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-3">
                            <User size={32} strokeWidth={1} />
                            <p className="text-sm">No hay pacientes registrados</p>
                        </div>
                    ) : (
                        filteredPatients.map(p => {
                            const name = p.answers['nombre'] || 'Paciente sin nombre';
                            const date = new Date(p.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                            const isSelected = selectedPatientId === p.id;

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedPatientId(p.id)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${isSelected
                                        ? 'bg-blue-50/80 border-brand-primary/30 shadow-sm'
                                        : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-semibold truncate pr-2 ${isSelected ? 'text-brand-primary-dark' : 'text-gray-800'}`}>
                                            {name}
                                        </h4>
                                        <span className="text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-100">{date}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <AlertTriangle size={12} className={
                                            Object.keys(p.answers).some(k => {
                                                const val = p.answers[k]?.toString().toLowerCase();
                                                return (val === 'sí' || val === 'si' || val === 'yes' || val === 'oui' || val === 'ja') && k !== 'autorizacion_imagenes';
                                            })
                                                ? 'text-red-400'
                                                : 'text-gray-300'
                                        } />
                                        {p.answers['edad'] ? `${p.answers['edad']} años` : 'Edad no especificada'}
                                        <span className="ml-auto opacity-40 uppercase font-bold text-[8px]">{p.answers['_language'] || 'es'}</span>
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-[#f4f7fb]">
                {selectedPatient ? (
                    <div className="max-w-6xl mx-auto p-8 lg:p-12">
                        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">{selectedPatient.answers['nombre'] || 'Paciente Anónimo'}</h2>
                                <div className="flex flex-wrap items-center gap-4 text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm">
                                        <Calendar size={16} className="text-brand-primary" />
                                        Registrado el {new Date(selectedPatient.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm">
                                        <Info size={16} className="text-brand-primary" />
                                        ID: {selectedPatient.id.split('-')[0].toUpperCase()}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm uppercase">
                                        Idioma: {selectedPatient.answers['_language'] || 'es'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary/10'
                                    }`}
                            >
                                {copied ? (
                                    <><CheckCircle2 size={20} /> ¡Resumen Copiado!</>
                                ) : (
                                    <><Copy size={20} /> Copiar Resumen para Plataforma</>
                                )}
                            </button>
                        </header>

                        <div className="space-y-6">
                            <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 mb-8">
                                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText size={18} /> Resumen de Texto editable
                                </h4>
                                <textarea
                                    readOnly
                                    value={generateSummary()}
                                    className="w-full h-48 bg-white/50 border border-gray-200 rounded-xl p-4 text-sm font-mono text-gray-700 focus:outline-none"
                                />
                            </div>

                            {renderCard('Evaluación Inicial y Datos Personales', <User size={24} />, ['initial', 'personal'])}
                            {renderCard('Historial Médico', <HeartPulse size={24} />, ['medical'])}
                            {renderCard('Captación y Consentimiento', <FileText size={24} />, ['captation', 'consent'])}
                        </div>

                        <div className="mt-12 text-center text-sm text-gray-400 font-medium">
                            META Integra &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                            <img src="logo.jpg" alt="Doctor Logo" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xl font-medium text-gray-500">Selecciona un paciente para ver sus detalles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
