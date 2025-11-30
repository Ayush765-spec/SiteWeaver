import React, { useState, useEffect } from 'react';
import { X, Type, Palette, Layout, Check } from 'lucide-react';

interface SelectedElement {
    id: string; // Unique selector or ID
    tagName: string;
    text?: string;
    classes?: string;
}

interface PropertiesPanelProps {
    element: SelectedElement | null;
    onUpdate: (updates: { text?: string; classes?: string }) => void;
    onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdate, onClose }) => {
    const [text, setText] = useState('');
    const [classes, setClasses] = useState('');
    const [activeTab, setActiveTab] = useState<'content' | 'style'>('style');

    useEffect(() => {
        if (element) {
            setText(element.text || '');
            setClasses(element.classes || '');
        }
    }, [element]);

    if (!element) {
        return (
            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Layout className="text-slate-300" size={32} />
                </div>
                <h3 className="text-slate-800 font-medium mb-2">No Element Selected</h3>
                <p className="text-slate-500 text-sm">Click on any element in the preview to edit its properties.</p>
            </div>
        );
    }

    const handleUpdate = () => {
        onUpdate({ text, classes });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleUpdate();
        }
    };

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-20">
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-mono font-bold uppercase">
                        {element.tagName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                        {element.id}
                    </span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'style'
                            ? 'text-slate-900 border-b-2 border-slate-900'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Palette size={14} /> Styles
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'content'
                            ? 'text-slate-900 border-b-2 border-slate-900'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Type size={14} /> Content
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {activeTab === 'content' && (
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                            Text Content
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none text-slate-700 leading-relaxed"
                            placeholder="Enter text content..."
                        />
                        <p className="text-[10px] text-slate-400">
                            Tip: Press Cmd/Ctrl + Enter to apply changes
                        </p>
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex justify-between">
                                Tailwind Classes
                                <a
                                    href="https://tailwindcss.com/docs"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-500 hover:underline lowercase font-normal"
                                >
                                    docs ↗
                                </a>
                            </label>
                            <textarea
                                value={classes}
                                onChange={(e) => setClasses(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full h-48 p-3 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none text-slate-600 leading-relaxed"
                                placeholder="e.g. bg-blue-500 p-4 rounded-lg..."
                            />
                        </div>

                        {/* Quick Actions (Future enhancement) */}
                        {/* <div className="pt-4 border-t border-slate-100">
               <p className="text-xs font-semibold text-slate-900 mb-2">Quick Colors</p>
               <div className="flex gap-2 flex-wrap">
                 {['bg-red-500', 'bg-blue-500', 'bg-green-500', 'text-white', 'p-4'].map(c => (
                   <button 
                    key={c}
                    onClick={() => setClasses(prev => prev + ' ' + c)}
                    className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] rounded hover:bg-slate-200"
                   >
                     +{c}
                   </button>
                 ))}
               </div>
            </div> */}
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    onClick={handleUpdate}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <Check size={16} /> Apply Changes
                </button>
            </div>
        </div>
    );
};
