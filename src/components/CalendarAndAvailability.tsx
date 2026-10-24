import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type SubTab = 'calendar' | 'availability' | 'bookings';
export type AvailabilityStatus = 'available' | 'busy' | 'tentative';

interface CalendarAndAvailabilityProps {
    isEditable?: boolean;
    showHeader?: boolean;
    initialStatus?: AvailabilityStatus;
    userProfile?: {
        displayName?: string;
        location?: string;
        role?: string;
        statusMessage?: string;
        availabilityStatus?: string;
    };
    onUpdateStatus?: () => void;
}

interface ShootEvent {
    id: number;
    title: string;
    stage: string;
    role: string;
    callTime: string;
    location: string;
    productionHouse: string;
    status: 'Confirmed' | 'Tentative' | 'Completed';
    dates: number[]; // Day numbers in current month
    month: number;   // 0-indexed month
    year: number;
    color: string;
}

export default function CalendarAndAvailability({
    isEditable = false,
    showHeader = true,
    initialStatus = 'busy',
    userProfile,
    onUpdateStatus
}: CalendarAndAvailabilityProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SubTab>('calendar');

    // Default to the current demo timeline (October 2026 matching user's screen)
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(2026, 9, 24)); // Oct 24, 2026
    const [selectedDate, setSelectedDate] = useState(new Date(2026, 9, 24));
    const [status, setStatus] = useState<AvailabilityStatus>(initialStatus);
    const [isPublic, setIsPublic] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState(userProfile?.location || 'Hyderabad, Telangana');

    // Modals
    const [showAddBooking, setShowAddBooking] = useState(false);
    const [showSyncCalendars, setShowSyncCalendars] = useState(false);
    const [showDateActions, setShowDateActions] = useState(false);

    // Connected Calendars State
    const [syncState, setSyncState] = useState({
        google: true,
        apple: false,
        outlook: false
    });

    // Mock Shoot Events for October 2026
    const shootEvents: ShootEvent[] = [
        {
            id: 1,
            title: 'Feature: "Project Agni" (Climax Schedule)',
            stage: 'Action Schedule',
            role: 'Lead Editor & On-set DIT',
            callTime: '06:30 AM Call Sheet',
            location: 'Ramoji Film City, Stage 14',
            productionHouse: 'Mythri Movie Makers',
            status: 'Confirmed',
            dates: [12, 13, 14, 15, 16, 24, 25],
            month: 9, // Oct
            year: 2026,
            color: 'amber'
        },
        {
            id: 2,
            title: 'Commercial: "Aura Luxury Motors"',
            stage: 'Commercial Ad Film',
            role: 'Colorist & Finishing',
            callTime: '09:00 AM Call Sheet',
            location: 'Annapurna Studios, 4K DI Suite',
            productionHouse: 'Ogilvy Cinema India',
            status: 'Confirmed',
            dates: [28, 29],
            month: 9, // Oct
            year: 2026,
            color: 'emerald'
        },
        {
            id: 3,
            title: 'Indie Web Series: "Deccan Night"',
            stage: 'Pre-Production & Story Review',
            role: 'Supervising Editor',
            callTime: '02:00 PM Tech Recce',
            location: 'Jubilee Hills Production Office',
            productionHouse: 'Chai Bisket Originals',
            status: 'Tentative',
            dates: [30, 31],
            month: 9, // Oct
            year: 2026,
            color: 'cyan'
        }
    ];

    const bookings = [
        {
            id: 1,
            title: 'Project Agni - Feature Film',
            stage: 'Action Sequence Edit',
            client: 'Mythri Movie Makers',
            dates: 'Oct 12 – Oct 25, 2026',
            location: 'Ramoji Film City / Hyderabad',
            rate: 'Daily Rate • Standard Producer Pack',
            status: 'Confirmed',
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        },
        {
            id: 2,
            title: 'Aura Luxury Motors Commercial',
            stage: 'Color Grade & Master',
            client: 'Ogilvy Cinema India',
            dates: 'Oct 28 – Oct 29, 2026',
            location: 'Annapurna Studios',
            rate: 'Ad Package • 4K HDR DI Suite',
            status: 'Confirmed',
            badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        },
        {
            id: 3,
            title: 'Deccan Night Web Series',
            stage: 'Rough Cut & Recce',
            client: 'Chai Bisket Originals',
            dates: 'Oct 30 – Oct 31, 2026',
            location: 'Hyderabad, India',
            rate: 'Per Episode Contract',
            status: 'Tentative Hold',
            badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        }
    ];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getEventsForDate = (date: Date): ShootEvent[] => {
        return shootEvents.filter(e =>
            e.year === date.getFullYear() &&
            e.month === date.getMonth() &&
            e.dates.includes(date.getDate())
        );
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const handleTodayClick = () => {
        const now = new Date();
        setViewDate(now);
        setSelectedDate(now);
    };

    // Calculate free days vs shoot days for month
    const bookedDaysCount = Array.from(new Set(shootEvents.flatMap(e => e.dates))).length;
    const freeDaysCount = Math.max(0, daysInMonth - bookedDaysCount);

    // ==========================================
    // 1. SHOOT CALENDAR SUBPAGE
    // ==========================================
    const renderCalendarTab = () => {
        const eventsOnSelectedDate = getEventsForDate(selectedDate);

        return (
            <div className="flex flex-col gap-6">
                {/* Calendar Card */}
                <div className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-4 sm:p-6 border border-zinc-200/80 dark:border-white/5 shadow-xs">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-zinc-200/70 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                                <span className="material-symbols-outlined text-xl">calendar_month</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                    </h3>
                                    <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                        Production Schedule
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {bookedDaysCount} booked shoot days • {freeDaysCount} dates open for bookings
                                </p>
                            </div>
                        </div>

                        {/* Month Navigation & Today Shortcut */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <button
                                onClick={handleTodayClick}
                                className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10 cursor-pointer shadow-2xs"
                            >
                                Today
                            </button>
                            <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10">
                                <button
                                    onClick={handlePrevMonth}
                                    className="size-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Previous Month"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                <button
                                    onClick={handleNextMonth}
                                    className="size-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                    title="Next Month"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 mb-3 text-center">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                            <div
                                key={day}
                                className={`text-[11px] font-black tracking-wider uppercase py-1 ${
                                    idx === 0 || idx === 6
                                        ? 'text-zinc-400 dark:text-zinc-600'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-12 sm:h-16 rounded-xl bg-transparent" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                            const isSelected = isSameDay(cellDate, selectedDate);
                            const isTodayDate = isSameDay(cellDate, today);
                            const dayEvents = getEventsForDate(cellDate);
                            const hasShoot = dayEvents.length > 0;
                            const isConfirmed = dayEvents.some(e => e.status === 'Confirmed');

                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        setSelectedDate(cellDate);
                                        if (hasShoot || isEditable) {
                                            setShowDateActions(true);
                                        }
                                    }}
                                    className={`
                                        group relative h-12 sm:h-16 rounded-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 transition-all cursor-pointer border
                                        ${isSelected
                                            ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/50 scale-[1.02] z-10'
                                            : hasShoot
                                            ? isConfirmed
                                                ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:border-amber-500/60'
                                                : 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 text-cyan-900 dark:text-cyan-200 hover:border-cyan-500/60'
                                            : 'bg-white dark:bg-[#16181D] border-zinc-200/70 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10'
                                        }
                                    `}
                                >
                                    {/* Day Number + Today Marker */}
                                    <div className="w-full flex items-center justify-between">
                                        <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-black' : ''}`}>
                                            {day}
                                        </span>
                                        {isTodayDate && (
                                            <span
                                                className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                                                    isSelected ? 'bg-black text-white' : 'bg-amber-500 text-black'
                                                }`}
                                            >
                                                Now
                                            </span>
                                        )}
                                    </div>

                                    {/* Shoot Indicator Badges */}
                                    <div className="w-full flex items-center justify-center gap-1">
                                        {hasShoot ? (
                                            <div className="flex items-center gap-1">
                                                <span
                                                    className={`size-1.5 sm:size-2 rounded-full ${
                                                        isSelected
                                                            ? 'bg-black'
                                                            : isConfirmed
                                                            ? 'bg-amber-500 animate-pulse'
                                                            : 'bg-cyan-400'
                                                    }`}
                                                />
                                                <span
                                                    className={`hidden sm:inline-block text-[10px] font-bold truncate max-w-[50px] ${
                                                        isSelected ? 'text-black' : isConfirmed ? 'text-amber-600 dark:text-amber-300' : 'text-cyan-600 dark:text-cyan-300'
                                                    }`}
                                                >
                                                    {isConfirmed ? 'Shoot' : 'Hold'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className={`text-[10px] font-medium opacity-0 group-hover:opacity-60 transition-opacity ${
                                                    isSelected ? 'text-black' : 'text-zinc-400'
                                                }`}
                                            >
                                                Free
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Schedule Legend Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-3 mt-6 pt-4 border-t border-zinc-200/70 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-amber-500" />
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Confirmed Shoot Day</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-cyan-400" />
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Tentative Hold / Recce</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-emerald-500" />
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Available Date</span>
                            </div>
                        </div>

                        <div className="text-[11px] text-zinc-500">
                            Click any date to view call sheets or block schedules
                        </div>
                    </div>
                </div>

                {/* Day Details Call Sheet Section */}
                <div className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-200/60 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-amber-500 text-black flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-md shadow-amber-500/20">
                                <span className="text-sm uppercase tracking-wider">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                                <span className="text-base font-black">
                                    {selectedDate.getDate()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </h3>
                                <p className="text-xs text-zinc-500 font-medium">
                                    {eventsOnSelectedDate.length > 0
                                        ? `${eventsOnSelectedDate.length} production commitments scheduled`
                                        : 'No shoot booked on this date — Creator is available'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditable ? (
                                <button
                                    onClick={() => setShowAddBooking(true)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span>Lock This Date</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowDateActions(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-sm cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-base">event_available</span>
                                    <span>Book On This Date</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Events List for selected date */}
                    <div className="flex flex-col gap-3">
                        {eventsOnSelectedDate.length > 0 ? (
                            eventsOnSelectedDate.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#16181D] border border-zinc-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-amber-500/30 transition-all"
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white">
                                                    {event.title}
                                                </h4>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                                                    {event.status}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                                {event.role} • {event.productionHouse}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2 flex-wrap">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-sm text-zinc-400">schedule</span>
                                                    {event.callTime}
                                                </span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-sm text-zinc-400">location_on</span>
                                                    {event.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                        <button
                                            onClick={() => navigate('/messaging')}
                                            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all border border-zinc-200 dark:border-white/10 flex items-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat</span>
                                            <span>Production Room</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 px-4 text-center rounded-2xl bg-white dark:bg-[#16181D] border border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center">
                                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-2.5">
                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                </div>
                                <h4 className="text-sm font-black text-zinc-900 dark:text-white">
                                    Available for Production Shoots
                                </h4>
                                <p className="text-xs text-zinc-500 max-w-sm mt-0.5">
                                    No conflicts or film shoots are currently scheduled on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                                </p>
                                <button
                                    onClick={() => setShowAddBooking(true)}
                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-xs"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    <span>Lock or Hold This Date</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ==========================================
    // 2. SHOOT STATUS / AVAILABILITY SUBPAGE
    // ==========================================
    const renderAvailabilityTab = () => (
        <div className="flex flex-col gap-6">
            {/* Status Selection Cards */}
            <div className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-5 sm:p-7 border border-zinc-200/80 dark:border-white/5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200/60 dark:border-white/5">
                    <div>
                        <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                            Production Availability Mode
                        </h3>
                        <p className="text-xs text-zinc-500">
                            Controls how you appear in Search & Crew Discovery results
                        </p>
                    </div>
                    {onUpdateStatus && (
                        <button
                            onClick={onUpdateStatus}
                            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 font-bold text-xs border border-zinc-200 dark:border-white/10 cursor-pointer"
                        >
                            Edit Bio Tag
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                        {
                            id: 'available' as AvailabilityStatus,
                            title: 'Available for Shoots',
                            desc: 'Open for immediate calls, freelance projects, and full-length feature films.',
                            badge: '🟢 Immediate Booking',
                            accent: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                            icon: 'check_circle'
                        },
                        {
                            id: 'busy' as AvailabilityStatus,
                            title: 'Open to Upcoming Projects',
                            desc: 'Currently working on a film schedule, but actively considering future dates.',
                            badge: '🟡 Enquiries Active',
                            accent: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            icon: 'schedule'
                        },
                        {
                            id: 'tentative' as AvailabilityStatus,
                            title: 'Busy / Locked Schedule',
                            desc: 'Fully booked on shoot or traveling out of station. Inquiries held in queue.',
                            badge: '🔴 Schedule Locked',
                            accent: 'border-zinc-500 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
                            icon: 'block'
                        }
                    ].map((opt) => {
                        const isSelected = status === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => isEditable && setStatus(opt.id)}
                                disabled={!isEditable}
                                className={`
                                    p-4 sm:p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative
                                    ${isSelected
                                        ? 'bg-white dark:bg-[#16181D] border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                                        : 'bg-white/80 dark:bg-[#16181D]/60 border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15'
                                    }
                                `}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`size-10 rounded-xl flex items-center justify-center border ${opt.accent}`}>
                                            <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                                            {opt.badge}
                                        </span>
                                    </div>
                                    <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white mb-1">
                                        {opt.title}
                                    </h4>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        {opt.desc}
                                    </p>
                                </div>
                                <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-zinc-400">
                                        {isSelected ? 'Current Status' : 'Tap to switch'}
                                    </span>
                                    <div className={`size-5 rounded-full border flex items-center justify-center ${
                                        isSelected ? 'border-amber-500 bg-amber-500 text-black' : 'border-zinc-300 dark:border-zinc-700'
                                    }`}>
                                        {isSelected && <span className="material-symbols-outlined text-xs font-black">check</span>}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Geo & City Availability */}
            <div className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-xl">location_city</span>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                                Shooting Locations & Travel Radius
                            </h3>
                            <p className="text-xs text-zinc-500">
                                Available for on-location schedules across film industries
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    {[
                        { city: 'Hyderabad', state: 'Tollywood (Base)', active: true },
                        { city: 'Chennai', state: 'Kollywood', active: true },
                        { city: 'Bengaluru', state: 'Sandalwood', active: true },
                        { city: 'Mumbai', state: 'Bollywood / Ads', active: false }
                    ].map((loc) => (
                        <div
                            key={loc.city}
                            onClick={() => isEditable && setSelectedLocation(`${loc.city}, India`)}
                            className={`p-3 rounded-xl border flex flex-col cursor-pointer transition-all ${
                                loc.active
                                    ? 'bg-white dark:bg-[#16181D] border-amber-500/40 text-zinc-900 dark:text-white'
                                    : 'bg-white/50 dark:bg-white/5 border-zinc-200/70 dark:border-white/5 text-zinc-500'
                            }`}
                        >
                            <span className="text-xs font-black">{loc.city}</span>
                            <span className="text-[10px] text-zinc-400">{loc.state}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">info</span>
                    <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                        Production teams filtering by <strong>"{selectedLocation}"</strong> in Search will see your calendar dates highlighted.
                    </p>
                </div>
            </div>

            {/* Visibility Settings */}
            <div className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center font-bold shrink-0">
                        <span className="material-symbols-outlined text-xl">visibility</span>
                    </div>
                    <div>
                        <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                            Public Calendar Visibility
                        </h4>
                        <p className="text-xs text-zinc-500">
                            {isPublic ? 'Visible to verified directors, casting agents, and producers' : 'Only your approved connections can view dates'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => isEditable && setIsPublic(!isPublic)}
                    disabled={!isEditable}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                        isPublic ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                >
                    <span
                        className={`inline-block size-5 transform rounded-full bg-white transition-transform ${
                            isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
        </div>
    );

    // ==========================================
    // 3. BOOKINGS & INQUIRIES SUBPAGE
    // ==========================================
    const renderBookingsTab = () => (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                        Active Shoot Contracts & Holds
                    </h3>
                    <p className="text-xs text-zinc-500">All current feature schedules and production houses</p>
                </div>
                {isEditable && (
                    <button
                        onClick={() => setShowAddBooking(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs transition-all shadow-xs cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>New Booking</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3.5">
                {bookings.map((booking) => (
                    <div
                        key={booking.id}
                        className="bg-zinc-50 dark:bg-black/30 rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-amber-500/30 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="material-symbols-outlined text-2xl">theaters</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="text-base font-black text-zinc-900 dark:text-white">
                                        {booking.title}
                                    </h4>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${booking.badgeColor}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    {booking.client} • {booking.stage}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2 flex-wrap">
                                    <span className="flex items-center gap-1 font-medium">
                                        <span className="material-symbols-outlined text-sm text-zinc-400">event</span>
                                        {booking.dates}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                        <span className="material-symbols-outlined text-sm text-zinc-400">location_on</span>
                                        {booking.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <button
                                onClick={() => navigate('/messaging', { state: { startCall: true } })}
                                className="size-9 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center transition-all cursor-pointer"
                                title="Call Production"
                            >
                                <span className="material-symbols-outlined text-lg">call</span>
                            </button>
                            <button
                                onClick={() => navigate('/messaging')}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span>Message House</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ==========================================
    // 4. MODALS (Compacted, Responsive, Zoomed Out)
    // ==========================================
    const renderAddBookingModal = () => (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setShowAddBooking(false)}
        >
            <div
                className="bg-white dark:bg-[#14161B] w-full max-w-sm sm:max-w-md max-h-[88vh] flex flex-col rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/10 shrink-0">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">Add Booking / Shoot</h2>
                        <p className="text-[11px] text-zinc-500">Lock dates on your production calendar</p>
                    </div>
                    <button
                        onClick={() => setShowAddBooking(false)}
                        className="size-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-sm">
                    <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Booking Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'shoot', label: 'Feature Shoot', icon: 'videocam', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
                                { id: 'post', label: 'Post / Edit', icon: 'content_cut', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
                                { id: 'rehearsal', label: 'Rehearsal / Pre', icon: 'theater_comedy', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${type.color}`}
                                >
                                    <span className="material-symbols-outlined text-lg">{type.icon}</span>
                                    <span className="text-[11px] font-bold">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Production Title</label>
                        <input
                            type="text"
                            placeholder="e.g. Feature Film Shoot / Ad Film"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-amber-500 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Target Date</label>
                            <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Days</label>
                            <input
                                type="number"
                                defaultValue={1}
                                min={1}
                                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Location / Studio</label>
                        <input
                            type="text"
                            placeholder="e.g. Annapurna Studios / Hyderabad"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-amber-500 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Notes (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Call sheets, shoot timing, special requirements..."
                            className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 focus:outline-none focus:border-amber-500 text-xs sm:text-sm text-zinc-900 dark:text-white resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                            onClick={() => navigate('/messaging', { state: { startCall: true } })}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">call</span>
                            <span>Direct Call</span>
                        </button>
                        <button
                            onClick={() => navigate('/messaging')}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">chat</span>
                            <span>Direct Chat</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSyncCalendarsModal = () => (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setShowSyncCalendars(false)}
        >
            <div
                className="bg-white dark:bg-[#14161B] w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-xl">sync</span>
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">Sync Calendars</h2>
                            <p className="text-[11px] text-zinc-500">Auto-update dates across devices</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSyncCalendars(false)}
                        className="size-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="space-y-3 mb-5">
                    {[
                        {
                            key: 'google' as const,
                            name: 'Google Calendar',
                            desc: 'Sync confirmed shoot dates & call reminders',
                            icon: 'event',
                            color: 'text-red-500 bg-red-500/10 border-red-500/20'
                        },
                        {
                            key: 'apple' as const,
                            name: 'Apple iCal',
                            desc: 'Sync to iPhone & Mac calendar app',
                            icon: 'calendar_month',
                            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
                        },
                        {
                            key: 'outlook' as const,
                            name: 'Microsoft Outlook',
                            desc: 'Production house enterprise invites',
                            icon: 'mail',
                            color: 'text-sky-500 bg-sky-500/10 border-sky-500/20'
                        }
                    ].map((item) => {
                        const isConnected = syncState[item.key];
                        return (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-black/40 border border-zinc-200/80 dark:border-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white">{item.name}</h4>
                                        <p className="text-[11px] text-zinc-500">{item.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSyncState({ ...syncState, [item.key]: !isConnected })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                        isConnected ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
                                            isConnected ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => setShowSyncCalendars(false)}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                    Save Sync Preferences
                </button>
            </div>
        </div>
    );

    const renderDateActionsModal = () => (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setShowDateActions(false)}
        >
            <div
                className="bg-white dark:bg-[#14161B] w-full max-w-sm sm:max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-white/10">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                            Date Options
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowDateActions(false)}
                        className="size-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                    <button
                        onClick={() => {
                            setShowDateActions(false);
                            setShowAddBooking(true);
                        }}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all text-left cursor-pointer group"
                    >
                        <div className="size-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">event_available</span>
                        </div>
                        <div>
                            <p className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white">
                                {isEditable ? 'Lock Date for Production' : 'Book Creator on This Date'}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                                {isEditable ? 'Add to schedule and notify team' : 'Send inquiry for this specific shoot day'}
                            </p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-amber-500 text-sm">arrow_forward</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowDateActions(false);
                            navigate('/browse-profiles');
                        }}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-black/40 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200/80 dark:border-white/5 transition-all text-left cursor-pointer group"
                    >
                        <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">group</span>
                        </div>
                        <div>
                            <p className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white">Find Matching Crew</p>
                            <p className="text-[11px] text-zinc-500">Directors, cinematographers & editors free on this date</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-zinc-400 text-sm">arrow_forward</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowDateActions(false);
                            navigate('/marketplace');
                        }}
                        className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-black/40 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200/80 dark:border-white/5 transition-all text-left cursor-pointer group"
                    >
                        <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">camera</span>
                        </div>
                        <div>
                            <p className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white">Book Camera & Lighting Gear</p>
                            <p className="text-[11px] text-zinc-500">Reserve ARRI, RED, and sound equipment</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-zinc-400 text-sm">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col w-full">
            {/* Header (if enabled) */}
            {showHeader && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-zinc-900 dark:text-white">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                                Production Calendar & Availability
                            </h1>
                            <p className="text-xs text-zinc-500">Real-time schedule for film productions and shoots</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSyncCalendars(true)}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 transition-colors"
                            title="Sync Calendars"
                        >
                            <span className="material-symbols-outlined text-lg">sync</span>
                        </button>
                        {isEditable && (
                            <button
                                onClick={() => setShowAddBooking(true)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                                <span>Add Shoot</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Sub-Tabs: Shoot Calendar / Shoot Status / Bookings */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-black/40 border border-zinc-200/80 dark:border-white/5 overflow-x-auto no-scrollbar">
                    {(['calendar', 'availability', 'bookings'] as SubTab[]).map((tab) => {
                        const isActive = activeTab === tab;
                        const label = tab === 'calendar'
                            ? 'Shoot Calendar'
                            : tab === 'availability'
                            ? 'Shoot Status'
                            : 'Bookings';
                        const icon = tab === 'calendar'
                            ? 'calendar_month'
                            : tab === 'availability'
                            ? 'tune'
                            : 'assignment';

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer
                                    ${isActive
                                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }
                                `}
                            >
                                <span className="material-symbols-outlined text-base">{icon}</span>
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSyncCalendars(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10 cursor-pointer shadow-2xs"
                    >
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Sync</span>
                    </button>
                    {isEditable && (
                        <button
                            onClick={() => setShowAddBooking(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-black transition-all shadow-sm cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm font-black">add</span>
                            <span>Add Shoot</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Views */}
            <div>
                {activeTab === 'calendar' && renderCalendarTab()}
                {activeTab === 'availability' && renderAvailabilityTab()}
                {activeTab === 'bookings' && renderBookingsTab()}
            </div>

            {/* Modals */}
            {showAddBooking && renderAddBookingModal()}
            {showSyncCalendars && renderSyncCalendarsModal()}
            {showDateActions && renderDateActionsModal()}
        </div>
    );
}
