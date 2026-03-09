import React, { useState } from 'react';
import { usePatients } from '../../store/PatientContext';
import { questions } from '../../config/questions';
import { AlertTriangle, User, Calendar, FileText, Search, Activity, HeartPulse, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
    const { patients } = usePatients();
    const navigate = useNavigate();
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
        patients.length > 0 ? patients[0].id : null
    );
    const [searchTerm, setSearchTerm] = useState('');

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    const filteredPatients = patients.filter(p => {
        const name = p.answers['nombre']?.toLowerCase() || '';
        return name.includes(searchTerm.toLowerCase());
    });

    const getAnswersByCategory = (categoryTitles: string[]) => {
        if (!selectedPatient) return [];
        return questions.filter(q => categoryTitles.includes(q.category || '')).map(q => ({
            question: q,
            answer: selectedPatient.answers[q.id],
            specification: selectedPatient.answers[`${q.id}_spec`]
        }));
    };

    const renderCard = (
        title: string,
        icon: React.ReactNode,
        categoryTitles: string[]
    ) => {
        const data = getAnswersByCategory(categoryTitles);
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

                        // Lógica de resaltado (Riesgo Médico o Captación especial)
                        const isAlert =
                            (question.category === 'Historial Médico' && answer.toString().toLowerCase() === 'sí') ||
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
                                        {question.title}
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
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
                            <Activity size={22} />
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
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredPatients.length === 0 ? (
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
                                            Object.keys(p.answers).some(k => p.answers[k]?.toLowerCase?.() === 'sí' && k !== 'autorizacion_imagenes')
                                                ? 'text-red-400'
                                                : 'text-gray-300'
                                        } />
                                        {p.answers['edad'] ? `${p.answers['edad']} años` : 'Edad no especificada'}
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
                        <header className="mb-10 flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-bold text-gray-900 mb-2">{selectedPatient.answers['nombre'] || 'Paciente Anónimo'}</h2>
                                <div className="flex items-center gap-4 text-gray-500 font-medium">
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm">
                                        <Calendar size={16} className="text-brand-primary" />
                                        Registrado el {new Date(selectedPatient.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 text-sm">
                                        <Info size={16} className="text-brand-primary" />
                                        ID: {selectedPatient.id.split('-')[0].toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-6">
                            {renderCard('Evaluación Inicial y Datos Personales', <User size={24} />, ['Evaluación Inicial', 'Datos Personales'])}
                            {renderCard('Historial Médico', <HeartPulse size={24} />, ['Historial Médico'])}
                            {renderCard('Captación y Consentimiento', <FileText size={24} />, ['Captación', 'Consentimiento'])}
                        </div>

                        <div className="mt-12 text-center text-sm text-gray-400 font-medium">
                            Prototipo META Integra &copy; {new Date().getFullYear()}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <User size={48} className="text-gray-300" />
                        </div>
                        <p className="text-xl font-medium text-gray-500">Selecciona un paciente para ver sus detalles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
