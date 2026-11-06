import { useState } from 'react';
import { Check, X } from 'lucide-react';

export type ToothStatus = 'Normal' | 'Caries' | 'Pulpitis' | 'Extracted' | 'Filled' | 'Crown' | 'Treating';

export interface ToothData {
    id: number;
    status: ToothStatus;
}

export interface ToothChartProps {
    teethData: ToothData[];
    onToothUpdate: (toothId: number, status: ToothStatus) => void;
    readonly?: boolean;
}

const statusColors: Record<ToothStatus, { bg: string, border: string, label: string }> = {
    Normal: { bg: 'bg-white', border: 'border-slate-300', label: 'Bình thường' },
    Caries: { bg: 'bg-amber-500', border: 'border-amber-600', label: 'Sâu răng' },
    Pulpitis: { bg: 'bg-rose-500', border: 'border-rose-600', label: 'Viêm tủy' },
    Extracted: { bg: 'bg-slate-800', border: 'border-slate-900', label: 'Đã nhổ' },
    Filled: { bg: 'bg-blue-500', border: 'border-blue-600', label: 'Đã trám' },
    Crown: { bg: 'bg-emerald-500', border: 'border-emerald-600', label: 'Bọc sứ' },
    Treating: { bg: 'bg-purple-500', border: 'border-purple-600', label: 'Đang điều trị' },
};

const upperTeethRight = [18, 17, 16, 15, 14, 13, 12, 11];
const upperTeethLeft = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeethRight = [48, 47, 46, 45, 44, 43, 42, 41];
const lowerTeethLeft = [31, 32, 33, 34, 35, 36, 37, 38];

export function ToothChart({ teethData, onToothUpdate, readonly = false }: ToothChartProps) {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    const getToothStatus = (id: number): ToothStatus => {
        const tooth = teethData.find(t => t.id === id);
        return tooth?.status || 'Normal';
    };

    const handleToothClick = (id: number) => {
        if (readonly) return;
        setSelectedTooth(id);
    };

    const handleStatusSelect = (status: ToothStatus) => {
        if (selectedTooth) {
            onToothUpdate(selectedTooth, status);
            setSelectedTooth(null);
        }
    };

    const renderTooth = (id: number) => {
        const status = getToothStatus(id);
        const color = statusColors[status];
        const isSelected = selectedTooth === id;

        return (
            <div key={id} className="flex flex-col items-center gap-1 group">
                <span className="text-xs font-semibold text-slate-500">{id}</span>
                <button
                    onClick={() => handleToothClick(id)}
                    className={`
                        w-8 h-10 md:w-10 md:h-12 rounded-t-sm rounded-b-xl border-2 transition-all duration-200
                        ${color.bg} ${color.border}
                        ${status === 'Normal' && !readonly ? 'hover:bg-slate-100' : ''}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-md' : 'shadow-sm'}
                        ${readonly ? 'cursor-default' : 'cursor-pointer hover:-translate-y-1'}
                    `}
                    title={`Răng ${id} - ${color.label}`}
                >
                    {status === 'Extracted' && <X className="w-full h-full text-slate-400 opacity-50 p-1" />}
                </button>
            </div>
        );
    };

    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
            <h4 className="text-sm font-semibold text-slate-700 mb-6 flex items-center justify-between">
                <span>Sơ đồ răng (Odontogram)</span>
                {readonly && <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs">Chỉ xem</span>}
            </h4>

            {/* Jaw Layout */}
            <div className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
                {/* Upper Jaw */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Hàm trên</span>
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 sm:gap-x-4 md:gap-x-6">
                        <div className="flex gap-1 sm:gap-2">
                            {upperTeethRight.map(renderTooth)}
                        </div>
                        <div className="w-0.5 bg-slate-300 rounded-full mx-1 sm:mx-2 hidden sm:block"></div>
                        <div className="flex gap-1 sm:gap-2">
                            {upperTeethLeft.map(renderTooth)}
                        </div>
                    </div>
                </div>

                <div className="w-3/4 h-px bg-slate-200"></div>

                {/* Lower Jaw */}
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 sm:gap-x-4 md:gap-x-6">
                        <div className="flex gap-1 sm:gap-2">
                            {lowerTeethRight.map(renderTooth)}
                        </div>
                        <div className="w-0.5 bg-slate-300 rounded-full mx-1 sm:mx-2 hidden sm:block"></div>
                        <div className="flex gap-1 sm:gap-2">
                            {lowerTeethLeft.map(renderTooth)}
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-2">Hàm dưới</span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                {(Object.entries(statusColors) as [ToothStatus, typeof statusColors[ToothStatus]][]).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border ${color.bg} ${color.border}`}></div>
                        <span className="text-xs text-slate-600 font-medium">{color.label}</span>
                    </div>
                ))}
            </div>

            {/* Selection Popover */}
            {selectedTooth && !readonly && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 w-full max-w-sm transform animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-lg">Tình trạng răng {selectedTooth}</h5>
                            <button onClick={() => setSelectedTooth(null)} className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.entries(statusColors) as [ToothStatus, typeof statusColors[ToothStatus]][]).map(([key, color]) => {
                                const isCurrent = getToothStatus(selectedTooth) === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusSelect(key)}
                                        className={`
                                            flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-medium transition-all
                                            ${isCurrent ? 'bg-slate-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-sm border ${color.bg} ${color.border}`}></div>
                                            <span>{color.label}</span>
                                        </div>
                                        {isCurrent && <Check className="w-4 h-4 text-blue-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
