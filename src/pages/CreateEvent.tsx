import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateText } from '../services/groqService';
import { uploadFile } from '../services/storageService';
import { blogService, type ContentBlock } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import PostMedia from '../components/PostMedia';

export default function CreateEvent() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Basic Info
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Events');

    // Event Details
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [location, setLocation] = useState('');
    const [ticketLink, setTicketLink] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [organizer, setOrganizer] = useState(currentUser?.displayName || '');

    // Content
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
        { id: '1', type: 'text', content: '' }
    ]);
    const [language] = useState('English');

    // UI States
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = ['Events', 'Workshops', 'Screenings', 'Networking', 'Auditions', 'Festivals'];

    // Generate unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // AI Write Event Description
    const handleAIWriteEvent = async () => {
        const topic = aiTopic.trim() || title.trim();
        if (!topic) {
            alert('Please enter an event title or topic');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await generateText(
                `Write a compelling event description for a film industry event titled: "${topic}"

                Type: ${category}
                Location: ${location || 'TBD'}
                Date: ${eventDate || 'TBD'}

                Requirements:
                - Professional and exciting tone
                - Highlight key benefits of attending
                - Include a schedule or agenda section if appropriate
                - Call to action for registration
                - NO markdown headings (#)
                - Separate paragraphs with double newlines
                - Length: 300-500 words`,
                'Event Description'
            );

            if (response.text) {
                if (!title) setTitle(topic);

                // Parse text into blocks
                const cleanText = response.text.replace(/^#+\s*/gm, '').trim();
                const paragraphs = cleanText.split('\n\n').filter(p => p.trim());

                const newBlocks: ContentBlock[] = [];

                // Add a placeholder image from Picsum
                const seed = topic.replace(/[^a-z0-9]/gi, '-');
                // Use random number to prevent caching/duplicates
                const random = Math.floor(Math.random() * 10000);
                const headerImage = `https://picsum.photos/seed/${seed}-${random}/1200/600`;

                newBlocks.push({ id: generateId(), type: 'image', content: headerImage });

                paragraphs.forEach(p => {
                    newBlocks.push({ id: generateId(), type: 'text', content: p });
                });

                setContentBlocks(newBlocks);
                setShowAIPanel(false);
            }
        } catch (error) {
            console.error('AI Error:', error);
            alert('Failed to generate event description');
        } finally {
            setIsGenerating(false);
        }
    };

    // Save Event
    const handlePublish = async () => {
        if (!title.trim() || !eventDate || !location) {
            alert('Please fill in Title, Date, and Location');
            return;
        }
        if (!currentUser) return;

        setIsSaving(true);
        try {
            const result = await blogService.createBlog({
                title: title.trim(),
                contentBlocks,
                category,
                language,
                authorId: currentUser.uid,
                author: currentUser.displayName || 'Organizer',
                authorPhoto: currentUser.photoURL || undefined,
                eventDetails: {
                    eventDate,
                    eventTime,
                    location,
                    ticketLink,
                    ticketPrice,
                    organizer
                }
            });

            if (result.success) {
                alert('🎉 Event published successfully!');
                navigate('/blogs-events');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to publish event');
        } finally {
            setIsSaving(false);
        }
    };

    // Update text block
    const updateTextBlock = (id: string, content: string) => {
        setContentBlocks(prev => prev.map(block => block.id === id ? { ...block, content } : block));
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="font-bold text-lg">Create Event</h1>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isSaving}
                    className="px-6 py-2 bg-fuchsia-600 text-white font-bold rounded-full hover:bg-fuchsia-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">rocket_launch</span>}
                    Publish Event
                </button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">

                {/* AI Assistant Banner */}
                <div className="bg-gradient-to-r from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-fuchsia-900 dark:text-fuchsia-100 flex items-center gap-2">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            Need help writing?
                        </h3>
                        <p className="text-sm text-fuchsia-700 dark:text-fuchsia-300">Let AI create a professional event description for you.</p>
                    </div>
                    <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className="px-4 py-2 bg-white dark:bg-zinc-800 text-fuchsia-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                        {showAIPanel ? 'Close AI' : 'Open AI Assistant'}
                    </button>
                </div>

                {/* AI Panel */}
                {showAIPanel && (
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-top-4">
                        <input
                            type="text"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="What is your event about? (e.g. 'Networking Mixer for Cinematographers')"
                            className="w-full mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                        <button
                            onClick={handleAIWriteEvent}
                            disabled={isGenerating}
                            className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {isGenerating ? 'Writing...' : 'Generate Description & Cover Image'}
                        </button>
                    </div>
                )}

                {/* Main Event Info */}
                <section className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">Event Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Annual Film Festival 2024"
                            className="w-full text-3xl font-bold bg-transparent border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-fuchsia-500 rounded-none px-0 py-2 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:ring-0"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-none focus:ring-2 focus:ring-fuchsia-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-none focus:ring-2 focus:ring-fuchsia-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Location / Venue</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-zinc-400">location_on</span>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Mumbai Film Center or Online Link"
                                        className="w-full pl-10 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border-none focus:ring-2 focus:ring-fuchsia-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Ticket Information</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={ticketPrice}
                                    onChange={(e) => setTicketPrice(e.target.value)}
                                    placeholder="Price (e.g. Free, ₹500)"
                                    className="w-1/3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-fuchsia-500"
                                />
                                <input
                                    type="text"
                                    value={ticketLink}
                                    onChange={(e) => setTicketLink(e.target.value)}
                                    placeholder="Booking URL (BookMyShow, Insider, etc.)"
                                    className="flex-1 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-fuchsia-500"
                                />
                            </div>
                            <p className="text-xs text-zinc-400">Leave blank if not applicable</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">Organizer Name</label>
                            <input
                                type="text"
                                value={organizer}
                                onChange={(e) => setOrganizer(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-fuchsia-500"
                            />
                        </div>
                    </div>
                </section>

                <hr className="border-zinc-100 dark:border-zinc-800" />

                {/* Content Editor */}
                <section>
                    <h3 className="text-xl font-bold mb-4">Event Description</h3>
                    <div className="space-y-4">
                        {contentBlocks.map(block => (
                            <div key={block.id} className="relative group">
                                {block.type === 'image' ? (
                                    <div className="relative rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all">
                                        <PostMedia
                                            src={block.content}
                                            fallbackType="GENERAL"
                                            className="w-full h-auto"
                                        />
                                        <button
                                            onClick={() => setContentBlocks(prev => prev.filter(b => b.id !== block.id))}
                                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => updateTextBlock(block.id, e.currentTarget.innerHTML)}
                                            className="min-h-[100px] p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-transparent focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 outline-none text-lg leading-relaxed whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: block.content }}
                                        />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setContentBlocks(prev => prev.filter(b => b.id !== block.id))}
                                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-red-500"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2 justify-center py-4 text-sm text-zinc-500">
                            <button
                                onClick={() => setContentBlocks(prev => [...prev, { id: generateId(), type: 'text', content: '' }])}
                                className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add</span> Add Text Paragraph
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">image</span> Add Image
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        const res = await uploadFile(e.target.files[0]);
                                        if (res.url) {
                                            setContentBlocks(prev => [...prev, { id: generateId(), type: 'image', content: res.url! }]);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
