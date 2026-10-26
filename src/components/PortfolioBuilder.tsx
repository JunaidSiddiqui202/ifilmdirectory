// Portfolio Builder with Drag-and-Drop
// Allows users to create custom portfolio layouts

import { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

interface PortfolioSection {
    id: string;
    type: 'about' | 'experience' | 'showreel' | 'gallery' | 'testimonials' | 'skills' | 'awards';
    title: string;
    content: Record<string, unknown>;
    visible: boolean;
}

// Sortable Section Component
const SortableSection = ({ section, onEdit, onToggle, onDelete }: {
    section: PortfolioSection;
    onEdit: (id: string) => void;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${isDragging ? 'border-primary' : 'border-gray-200 dark:border-gray-700'
                } p-4 mb-3`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    {/* Drag handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <span className="material-symbols-outlined text-gray-400">drag_indicator</span>
                    </button>

                    {/* Section info */}
                    <div className="flex-1">
                        <h3 className="font-semibold">{section.title}</h3>
                        <p className="text-sm text-gray-500">{section.type}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(section.id)}
                        className={`p-2 rounded ${section.visible
                                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title={section.visible ? 'Visible' : 'Hidden'}
                    >
                        <span className="material-symbols-outlined">
                            {section.visible ? 'visibility' : 'visibility_off'}
                        </span>
                    </button>

                    <button
                        onClick={() => onEdit(section.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <span className="material-symbols-outlined">edit</span>
                    </button>

                    <button
                        onClick={() => onDelete(section.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Portfolio Builder Component
export const PortfolioBuilder = () => {
    const [sections, setSections] = useState<PortfolioSection[]>([
        {
            id: '1',
            type: 'about',
            title: 'About Me',
            content: {},
            visible: true,
        },
        {
            id: '2',
            type: 'showreel',
            title: 'Showreel',
            content: {},
            visible: true,
        },
        {
            id: '3',
            type: 'experience',
            title: 'Experience',
            content: {},
            visible: true,
        },
    ]);

    const [isAddingSection, setIsAddingSection] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleToggleVisibility = (id: string) => {
        setSections(sections.map(s =>
            s.id === id ? { ...s, visible: !s.visible } : s
        ));
    };

    const handleDeleteSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const handleEditSection = (id: string) => {
        // TODO: Open edit modal
        console.log('Edit section:', id);
    };

    const handleAddSection = (type: PortfolioSection['type']) => {
        const uniqueId = `section_${type}_${sections.length + 1}`;
        const newSection: PortfolioSection = {
            id: uniqueId,
            type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            content: {},
            visible: true,
        };
        setSections([...sections, newSection]);
        setIsAddingSection(false);
    };

    const handleSave = async () => {
        // Audit 2 (A2-06): Dormant unrouted component. Prevent false success alert without real persistence.
        alert('Portfolio layout preview updated locally. Cloud persistence for custom portfolio layouts is scheduled for the upcoming profile release.');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                <span><strong>Developer Notice:</strong> This Portfolio Builder layout tool is currently in staging preview and is not linked to public routing.</span>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Portfolio Builder</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Drag and drop to rearrange sections
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAddingSection(true)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add Section
                    </button>

                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Save Preview
                    </button>
                </div>
            </div>

            {/* Drag and drop area */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {sections.map((section) => (
                        <SortableSection
                            key={section.id}
                            section={section}
                            onEdit={handleEditSection}
                            onToggle={handleToggleVisibility}
                            onDelete={handleDeleteSection}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* Add section modal */}
            {isAddingSection && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsAddingSection(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4">Add Section</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Choose a section type to add to your portfolio
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {(['about', 'experience', 'showreel', 'gallery', 'testimonials', 'skills', 'awards'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleAddSection(type)}
                                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <span className="material-symbols-outlined text-primary mb-2 block">
                                        {type === 'about' && 'person'}
                                        {type === 'experience' && 'work'}
                                        {type === 'showreel' && 'movie'}
                                        {type === 'gallery' && 'photo_library'}
                                        {type === 'testimonials' && 'format_quote'}
                                        {type === 'skills' && 'psychology'}
                                        {type === 'awards' && 'emoji_events'}
                                    </span>
                                    <p className="font-semibold capitalize">{type}</p>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsAddingSection(false)}
                            className="w-full mt-4 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {/* Preview */}
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h2 className="text-xl font-bold mb-4">Preview</h2>
                <div className="space-y-4">
                    {sections.filter(s => s.visible).map(section => (
                        <div key={section.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <h3 className="font-semibold mb-2">{section.title}</h3>
                            <p className="text-sm text-gray-500">
                                {section.type} content will appear here
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PortfolioBuilder;
