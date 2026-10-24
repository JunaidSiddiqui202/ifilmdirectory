import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SubTab = 'calendar' | 'availability' | 'bookings';
type AvailabilityStatus = 'available' | 'busy' | 'tentative';

interface CalendarAndAvailabilityProps {
    isEditable?: boolean;
    showHeader?: boolean;
}

export default function CalendarAndAvailability({ isEditable = false, showHeader = true }: CalendarAndAvailabilityProps) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SubTab>('calendar');

    const today = new Date(); // Actual today: Dec 27, 2025
    const [viewDate, setViewDate] = useState(new Date()); // Date for month switching
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [status, setStatus] = useState<AvailabilityStatus>('available');
    const [isPublic, setIsPublic] = useState(false);
    const [showAddBooking, setShowAddBooking] = useState(false);
    const [showSyncCalendars, setShowSyncCalendars] = useState(false);
    const [showDateActions, setShowDateActions] = useState(false);

    // Mock Data
    const events = [
        {
            id: 1,
            title: 'Production: Midnight Run',
            start: 'Sunday, November 30, 2025 at 1:58:01 PM India Standard Time',
            end: 'Monday, December 15, 2025 at 1:58:01 PM India Standard Time',
            location: 'Los Angeles, CA',
            description: '15-day shoot with 5 locations',
            type: 'production',
            color: 'bg-blue-500'
        },
        {
            id: 2,
            title: 'Post-Production',
            start: 'Tuesday, December 16, 2025 at 1:58:01 PM India Standard Time',
            end: 'Wednesday, January 14, 2026 at 1:58:01 PM India Standard Time',
            location: 'Remote',
            description: 'Editing and color grading',
            type: 'post-production',
            color: 'bg-purple-500'
        }
    ];

    const bookings = [
        {
            id: 1,
            title: 'Commercial Shoot',
            date: 'Dec 20 - Dec 22, 2025',
            status: 'Confirmed',
            client: 'Nike'
        },
        {
            id: 2,
            title: 'Voice Over',
            date: 'Dec 25, 2025',
            status: 'Pending',
            client: 'Audible'
        }
    ];

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getEventsForDate = (date: Date) => {
        // Return events that occur on this date
        // For demo, return event 1 for Dec 27-30
        if (date.getDate() >= 27 && date.getDate() <= 31 && date.getMonth() === 11) {
            return [events[0]];
        }
        return [];
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const renderCalendarTab = () => (
        <div className="flex flex-col gap-6">
            {/* Calendar Widget */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </h3>
                        <span className="material-symbols-outlined text-primary">chevron_right</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handlePrevMonth} className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button onClick={handleNextMonth} className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4 text-center">
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                        <div key={day} className="text-xs font-bold text-zinc-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-6 gap-x-2 text-center">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                        const isSelected = isSameDay(date, selectedDate);
                        const isTodayDate = isSameDay(date, today);

                        return (
                            <button
                                key={day}
                                onClick={() => {
                                    setSelectedDate(date);
                                    setShowDateActions(true);
                                }}
                                className={`
                                    relative h-10 w-10 mx-auto flex items-center justify-center rounded-full text-lg font-medium transition-all
                                    ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                                    ${isTodayDate && !isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900' : ''}
                                `}
                            >
                                {day}
                                {isTodayDate && !isSelected && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Events List */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    Events on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long' })}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </h3>
                    <button className="text-purple-500 text-sm font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">near_me</span>
                        All Locations
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    {getEventsForDate(selectedDate).length > 0 ? getEventsForDate(selectedDate).map((event) => (
                        <div key={event.id} className={`p-4 rounded-xl ${event.type === 'production' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-purple-50 dark:bg-purple-900/20'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`material-symbols-outlined ${event.type === 'production' ? 'text-blue-500' : 'text-purple-500'}`}>
                                    {event.type === 'production' ? 'videocam' : 'auto_fix_high'}
                                </span>
                                <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{event.title}</h4>
                            </div>
                            <div className="flex flex-col gap-1 pl-9">
                                <div className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                    <span className="material-symbols-outlined text-base mt-0.5">calendar_today</span>
                                    <p>{event.start} - {event.end}</p>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                                    <span className="material-symbols-outlined text-base">location_on</span>
                                    <p>{event.location}</p>
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{event.description}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="py-10 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">event_busy</span>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No events for this date</p>
                            <button
                                onClick={() => setShowAddBooking(true)}
                                className="mt-2 text-primary font-bold hover:underline"
                            >
                                + Add Booking
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderAvailabilityTab = () => (
        <div className="flex flex-col gap-6">
            {/* Current Status */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Current Status</h3>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => isEditable && setStatus('available')}
                        className={`
                            flex flex-col items-center justify-center w-32 h-24 rounded-xl border-2 transition-all
                            ${status === 'available'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-green-200'}
                        `}
                    >
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                            <span className="material-symbols-outlined text-lg">check</span>
                        </div>
                        <span className="font-bold text-sm">Available</span>
                    </button>

                    {/* Placeholder slots for other statuses if needed, or just visual balance */}
                    <div className="w-32 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                    <div className="w-32 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
                </div>
            </div>

            {/* Visibility */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Visibility</h3>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-base font-medium text-zinc-900 dark:text-white">Hide from Public</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Only show availability to your connections</p>
                    </div>
                    <button
                        onClick={() => isEditable && setIsPublic(!isPublic)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${!isPublic ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-primary'}`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${!isPublic ? 'translate-x-1' : 'translate-x-7'}`} />
                    </button>
                </div>
            </div>

            {/* Geo-Availability Filter */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Geo-Availability Filter</h3>
                    <button className="text-purple-500 font-bold text-sm">Change</button>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                    Show crew members available in:<br />
                    <span className="text-zinc-900 dark:text-white font-medium">All Locations</span>
                </p>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl flex gap-3 items-start">
                    <span className="material-symbols-outlined text-orange-400 text-xl mt-0.5">lightbulb</span>
                    <p className="text-orange-600 dark:text-orange-300 text-sm font-medium">
                        Tip: Use geo-filtering to find crew members available in specific cities for your next shoot
                    </p>
                </div>
            </div>

            {/* Your Schedule */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Your Schedule</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-blue-500">2</span>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bookings</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-green-500">3</span>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Events</span>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex flex-col items-center justify-center gap-1">
                        <span className="text-3xl font-bold text-orange-500">3</span>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Free Days</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBookingsTab = () => (
        <div className="flex flex-col gap-4">
            {bookings.map((booking) => (
                <div key={booking.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{booking.title}</h4>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{booking.client}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                            <span>{booking.date}</span>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'Confirmed' ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                        {booking.status}
                    </span>
                </div>
            ))}
        </div>
    );

    const renderAddBookingModal = () => (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setShowAddBooking(false)}
        >
            <div
                className="bg-white dark:bg-zinc-900 w-full max-w-sm sm:max-w-md max-h-[88vh] flex flex-col rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
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
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Start Date</label>
                            <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                                Nov 30, 2025
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">End Date</label>
                            <div className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                                Dec 1, 2025
                            </div>
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowSyncCalendars(false)}
        >
            <div
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center flex-1 ml-12">Sync Calendars</h2>
                    <button
                        onClick={() => setShowSyncCalendars(false)}
                        className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                        Done
                    </button>
                </div>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                        <span className="material-symbols-outlined text-white text-3xl">sync</span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sync Calendars</h3>
                    <p className="text-center text-zinc-500 dark:text-zinc-400 px-8">
                        Connect your calendars to keep everything in sync
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                <span className="material-symbols-outlined">calendar_month</span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white">Apple Calendar</p>
                                <p className="text-xs font-medium text-green-500">Connected</p>
                            </div>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition-transform" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                                <span className="material-symbols-outlined">event</span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white">Google Calendar</p>
                                <p className="text-xs text-zinc-500">Not connected</p>
                            </div>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-300 dark:bg-zinc-600">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                <span className="material-symbols-outlined">mail</span>
                            </div>
                            <div>
                                <p className="font-bold text-zinc-900 dark:text-white">Outlook</p>
                                <p className="text-xs text-zinc-500">Not connected</p>
                            </div>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-300 dark:bg-zinc-600">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                <button className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:opacity-90 transition-opacity">
                    Save Settings
                </button>
            </div>
        </div>
    );

    const renderDateActionsModal = () => (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => setShowDateActions(false)}
        >
            <div
                className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-1">Actions for</p>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowDateActions(false)}
                        className="size-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => {
                            setShowDateActions(false);
                            setShowAddBooking(true);
                        }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all text-left group"
                    >
                        <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">add_task</span>
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Create Booking</p>
                            <p className="text-xs text-zinc-500">Secure this professional for a project</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-primary">arrow_forward</span>
                    </button>

                    <button
                        onClick={() => navigate('/marketplace')}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all text-left group"
                    >
                        <div className="size-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">medical_services</span>
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Browse Services</p>
                            <p className="text-xs text-zinc-500">Find equipment, studios, or crew</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-emerald-500">arrow_forward</span>
                    </button>

                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 transition-all text-left group"
                    >
                        <div className="size-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">groups</span>
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Find Professionals</p>
                            <p className="text-xs text-zinc-500">Connect with other talent</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-blue-500">arrow_forward</span>
                    </button>

                    <button
                        onClick={() => navigate('/blogs-events')}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-fuchsia-500/5 hover:bg-fuchsia-500/10 border border-fuchsia-500/20 transition-all text-left group"
                    >
                        <div className="size-12 rounded-xl bg-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">event</span>
                        </div>
                        <div>
                            <p className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">Industry Events</p>
                            <p className="text-xs text-zinc-500">Workshops, screenings, and meetups</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-fuchsia-500">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col w-full">
            {/* Header */}
            {showHeader && (
                <>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                <span className="material-symbols-outlined text-zinc-900 dark:text-white">arrow_back</span>
                            </button>
                            <button
                                onClick={() => setShowSyncCalendars(true)}
                                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Sync Calendars"
                            >
                                <span className="material-symbols-outlined text-zinc-900 dark:text-white">refresh</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAddBooking(true)}
                            className="p-2 rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-sm"
                            title="Add Booking"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-6 px-2">
                        Calendar & Shoot Schedule
                    </h1>
                </>
            )}

            {/* Sub-Tabs */}
            <div className="flex items-center justify-between gap-4 mb-6 px-2 flex-wrap">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {(['calendar', 'availability', 'bookings'] as SubTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize whitespace-nowrap transition-all cursor-pointer
                                ${activeTab === tab
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10'}
                            `}
                        >
                            {tab === 'calendar' ? '📅 Shoot Calendar' : tab === 'availability' ? '⚙️ Shoot Status' : '📋 Bookings'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSyncCalendars(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10"
                    >
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Sync</span>
                    </button>
                    {isEditable && (
                        <button
                            onClick={() => setShowAddBooking(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Add Shoot</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-2">
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
