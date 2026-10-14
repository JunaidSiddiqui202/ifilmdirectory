import { useState } from 'react';

interface CalendarProps {
    isEditable?: boolean;
}

type AvailabilityStatus = 'available' | 'busy' | 'tentative';

interface DayStatus {
    date: string; // YYYY-MM-DD
    status: AvailabilityStatus;
    note?: string;
}

export default function Calendar({ isEditable = false }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [availability, setAvailability] = useState<Record<string, DayStatus>>({
        '2025-12-15': { date: '2025-12-15', status: 'busy', note: 'Shoot Day' },
        '2025-12-16': { date: '2025-12-16', status: 'busy', note: 'Shoot Day' },
        '2025-12-20': { date: '2025-12-20', status: 'tentative', note: 'Audition' },
    });

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const toggleStatus = (day: number) => {
        if (!isEditable) return;

        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        setAvailability(prev => {
            const currentStatus = prev[dateStr]?.status;
            const newAvailability = { ...prev };

            if (!currentStatus) {
                newAvailability[dateStr] = { date: dateStr, status: 'busy' };
            } else if (currentStatus === 'busy') {
                newAvailability[dateStr] = { date: dateStr, status: 'tentative' };
            } else if (currentStatus === 'tentative') {
                delete newAvailability[dateStr]; // Back to available (default)
            }

            return newAvailability;
        });
    };

    const getStatusColor = (status?: AvailabilityStatus) => {
        switch (status) {
            case 'busy': return 'bg-red-500 text-white';
            case 'tentative': return 'bg-yellow-500 text-white';
            default: return 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300';
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-1">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">chevron_left</span>
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-xs font-medium text-zinc-400 py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty slots for previous month */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = availability[dateStr]?.status;

                    return (
                        <button
                            key={day}
                            onClick={() => toggleStatus(day)}
                            disabled={!isEditable}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                ${getStatusColor(status)}
                                ${isEditable ? 'cursor-pointer' : 'cursor-default'}
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs text-zinc-500 justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Busy</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Tentative</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border border-zinc-300"></div>
                    <span>Available</span>
                </div>
            </div>
        </div>
    );
}
