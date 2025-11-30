import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Smartphone, Tablet, Monitor, Code, Eye,
  Save, Download, RotateCw, Sparkles, Database, ArrowUp, Upload, MessageSquare,
  Copy, Check
} from 'lucide-react';
import { Project, ViewMode, EditorTab, ChatMessage } from '../types';
import { getProjectById, saveProject } from '../services/storage';
import { generateWebsiteDesign } from '../services/gemini';
import { PropertiesPanel } from '../components/PropertiesPanel';

interface SelectedElement {
  id: string;
  tagName: string;
  text?: string;
  classes?: string;
}

interface PlaygroundProps {
  projectId: string;
  onBack: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTab, setActiveTab] = useState<EditorTab>('preview');
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [showProperties, setShowProperties] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle initial load and generation
  useEffect(() => {
    const p = getProjectById(projectId);
    if (p) {
      setProject(p);
      setMessages(p.history);

      // If new project, trigger initial generation
      if (p.history.length === 1 && p.htmlCode.includes('Generating your design')) {
        generateInitialDesign(p, p.history[0].text);
      }
    }
  }, [projectId]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showMobileChat]);

  // Handle selection messages (stable, no dependencies)
  useEffect(() => {
    const handleSelectionMessage = (event: MessageEvent) => {
      // Debug log
      console.log("Parent received message:", event.data);

      if (event.data.type === 'ELEMENT_SELECTED') {
        console.log('Parent: Element Selected', event.data.payload);
        setSelectedElement(event.data.payload);
        setShowProperties(true);
        setActiveTab('preview');
      }
    };

    window.addEventListener('message', handleSelectionMessage);
    return () => window.removeEventListener('message', handleSelectionMessage);
  }, []);

  // Handle HTML updates (depends on project)
  useEffect(() => {
    const handleHtmlUpdate = (event: MessageEvent) => {
      if (event.data.type === 'HTML_UPDATED') {
        const newHtml = event.data.payload;
        if (project && newHtml !== project.htmlCode) {
          const updatedProject = { ...project, htmlCode: newHtml, synced: false };
          setProject(updatedProject);
        }
      }
    };

    window.addEventListener('message', handleHtmlUpdate);
    return () => window.removeEventListener('message', handleHtmlUpdate);
  }, [project]);

  // Inject script into iframe content
  const getPreviewContent = (html: string) => {
    const script = `
      <script>
        console.log("SiteWeaver: Script initializing...");
        
        window.onerror = function(msg, url, line) {
           console.error("SiteWeaver Iframe Error:", msg, line);
        };

        // 1. Visual Indicator
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.top = '0';
        indicator.style.left = '0';
        indicator.style.width = '100%';
        indicator.style.height = '4px';
        indicator.style.backgroundColor = '#3b82f6';
        indicator.style.zIndex = '999999';
        indicator.style.pointerEvents = 'none';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 1000);

        // 2. Add Styles for the Highlighter
        const style = document.createElement('style');
        style.innerHTML = '.sw-highlight { outline: 2px solid #3b82f6 !important; cursor: pointer !important; }';
        document.head.appendChild(style);

        // 3. The Click Handler
        document.addEventListener('mousedown', (e) => {
          // Allow left click only
          if (e.button !== 0) return;
          
          e.preventDefault();
          e.stopPropagation();
          
          const target = e.target;
          
          console.log("SiteWeaver: Clicked", target.tagName);

          // Remove previous highlights
          document.querySelectorAll('.sw-highlight').forEach(el => {
            el.classList.remove('sw-highlight');
          });

          // Add highlight
          target.classList.add('sw-highlight');

          // Generate ID if missing
          let id = target.id;
          if (!id) {
            id = 'sw-' + Math.random().toString(36).substr(2, 9);
            target.id = id;
          }

          // Send message
          window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            payload: {
              id: id,
              tagName: target.tagName.toLowerCase(),
              text: target.innerText?.substring(0, 50), // Truncate text for safety
              classes: target.className.replace('sw-highlight', '').trim()
            }
          }, '*');
        }, true); // Use Capture phase

        // Disable link navigation and form submission
        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);

        window.addEventListener('message', (e) => {
          if (e.data.type === 'UPDATE_ELEMENT') {
            const { id, text, classes } = e.data.payload;
            const el = document.getElementById(id);
            if (el) {
              if (text !== undefined) el.innerText = text;
              if (classes !== undefined) {
                 // Remove highlight class from old classes string if present to avoid duplication
                 const cleanClasses = classes.replace('sw-highlight', '').trim();
                 el.className = cleanClasses + ' sw-highlight';
              }
              
              // Send back updated HTML
              // We need to clean up highlights before sending back
              const clone = document.documentElement.cloneNode(true);
              clone.querySelectorAll('.sw-highlight').forEach(el => {
                 el.classList.remove('sw-highlight');
              });
              
              window.parent.postMessage({
                type: 'HTML_UPDATED',
                payload: document.documentElement.outerHTML
              }, '*');
            }
          }
        });
      </script>
    `;
    // More robust injection
    if (html.includes('</body>')) {
      return html.replace('</body>', `${script}</body>`);
    } else if (html.includes('</html>')) {
      return html.replace('</html>', `${script}</html>`);
    } else {
      return html + script;
    }
  };

  const handleElementUpdate = (updates: { text?: string; classes?: string }) => {
    if (!selectedElement || !iframeRef.current?.contentWindow) return;

    // Optimistically update local state
    setSelectedElement(prev => prev ? ({ ...prev, ...updates }) : null);

    // Send update to iframe
    iframeRef.current.contentWindow.postMessage({
      type: 'UPDATE_ELEMENT',
      payload: {
        id: selectedElement.id,
        ...updates
      }
    }, '*');
  };

  const generateInitialDesign = async (p: Project, prompt: string) => {
    setIsGenerating(true);
    try {
      const generatedCode = await generateWebsiteDesign(prompt, '', []);
      const modelMsg: ChatMessage = { role: 'model', text: 'Here is your initial design!', timestamp: Date.now() };

      const updatedProject = {
        ...p,
        htmlCode: generatedCode,
        history: [...p.history, modelMsg],
        synced: false
      };

      setProject(updatedProject);
      setMessages(updatedProject.history);
      await saveProject(updatedProject);
      setProject(curr => curr ? ({ ...curr, synced: true }) : undefined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !project) return;

    setIsGenerating(true);
    setChatInput('');

    const userMsg: ChatMessage = { role: 'user', text, timestamp: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    try {
      const generatedCode = await generateWebsiteDesign(
        text,
        project.htmlCode,
        messages
      );

      const modelMsg: ChatMessage = {
        role: 'model',
        text: 'Design updated successfully.',
        timestamp: Date.now()
      };

      const updatedProject = {
        ...project,
        htmlCode: generatedCode,
        history: [...newHistory, modelMsg],
        synced: false
      };

      setProject(updatedProject);
      setMessages(updatedProject.history);

      // Auto-save
      setIsSaving(true);
      await saveProject(updatedProject);
      setIsSaving(false);
      setProject(p => p ? ({ ...p, synced: true }) : undefined);

    } catch (error) {
      const errorMsg: ChatMessage = {
        role: 'model',
        text: 'Sorry, I encountered an error generating the design. Please try again.',
        timestamp: Date.now()
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    if (!project) return;
    setIsSaving(true);
    await saveProject(project);
    setIsSaving(false);
    setProject(p => p ? ({ ...p, synced: true }) : undefined);
  };

  const handleExport = () => {
    if (!project) return;
    const blob = new Blob([project.htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopyCode = async () => {
    if (!project?.htmlCode) return;
    try {
      await navigator.clipboard.writeText(project.htmlCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const updatedProject = {
          ...project,
          htmlCode: content,
          synced: false
        };
        setProject(updatedProject);
        await saveProject(updatedProject);
        setProject(curr => curr ? ({ ...curr, synced: true }) : undefined);

        // Add a system message indicating import
        const sysMsg: ChatMessage = { role: 'model', text: 'Successfully imported your design code. You can now edit it with AI.', timestamp: Date.now() };
        setMessages(prev => [...prev, sysMsg]);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  if (!project) return <div className="flex items-center justify-center h-full text-slate-500">Loading project...</div>;

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      {/* Header */}
      <div className="h-14 border-b border-orange-100 bg-white px-2 md:px-4 flex items-center justify-between shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors shrink-0">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-6 w-px bg-slate-200 shrink-0"></div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-slate-800 text-sm truncate">{project.name}</h2>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 hidden sm:inline">AI Website Builder</span>
              {isSaving ? (
                <span className="text-[10px] text-orange-500 flex items-center gap-1"><RotateCw size={8} className="animate-spin" /> Syncing</span>
              ) : (
                <span className="text-[10px] text-green-600 flex items-center gap-1"><Database size={8} /> Saved</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".html,.htm"
          />
          {/* Mobile View Toggle for Chat */}
          <button
            onClick={() => setShowMobileChat(!showMobileChat)}
            className={`md:hidden p-2 rounded-md ${showMobileChat ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
          >
            <MessageSquare size={18} />
          </button>

          <button
            onClick={handleImportClick}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 text-xs hover:bg-slate-50 transition-colors"
            title="Import HTML file"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={handleManualSave}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-md text-slate-600 text-xs hover:bg-slate-50 transition-colors"
          >
            <Save size={14} /> Save
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Download size={14} /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">

        {/* Chat Sidebar - Responsive */}
        <div className={`
          absolute md:relative inset-0 md:inset-auto z-30 md:z-10
          w-full md:w-80 bg-white border-r border-orange-100 flex flex-col
          shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          transition-transform duration-300 ease-in-out
          ${showMobileChat ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}>
          <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              AI Assistant
            </h3>
            {/* Close button for mobile */}
            <button onClick={() => setShowMobileChat(false)} className="md:hidden text-slate-400">
              <ArrowLeft size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className={`
                  max-w-[90%] p-3 rounded-xl text-sm shadow-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'}
`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl rounded-bl-none flex items-center gap-2 border border-slate-200 shadow-sm">
                  <RotateCw size={14} className="animate-spin text-orange-500" />
                  <span className="text-xs text-slate-500">Generating code...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                placeholder="Ask for changes (e.g. 'Make the button blue')..."
                disabled={isGenerating}
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder:text-slate-400 shadow-sm transition-all"
                style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
              />
              <button
                onClick={() => handleSendMessage(chatInput)}
                disabled={!chatInput.trim() || isGenerating}
                className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-slate-100/50 relative overflow-hidden w-full">
          {/* Toolbar */}
          <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-2 md:px-4 z-10 shrink-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
              {['desktop', 'tablet', 'mobile'].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m as ViewMode)}
                  className={`p-1.5 rounded transition-all ${viewMode === m ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {m === 'desktop' && <Monitor size={16} />}
                  {m === 'tablet' && <Tablet size={16} />}
                  {m === 'mobile' && <Smartphone size={16} />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'code' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Code size={14} /> <span className="hidden sm:inline">Code</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Eye size={14} /> <span className="hidden sm:inline">Preview</span>
              </button>

              {activeTab === 'code' && (
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
              )}

              {activeTab === 'code' && (
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copyFeedback ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  title="Copy code to clipboard"
                >
                  {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
                  <span className="hidden sm:inline">{copyFeedback ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center relative">
            {activeTab === 'preview' ? (
              <div
                className="bg-white shadow-2xl transition-all duration-300 ease-in-out origin-top overflow-hidden relative animate-fade-in"
                style={{
                  width: getViewWidth(),
                  height: '100%',
                  maxHeight: '100%',
                  borderRadius: viewMode === 'desktop' ? '0.5rem' : '2rem',
                  border: viewMode !== 'desktop' ? '12px solid #1e293b' : '1px solid #e2e8f0'
                }}
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={getPreviewContent(project.htmlCode)}
                  title="Preview"
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                />
              </div>
            ) : (
              <div className="w-full max-w-4xl bg-[#1e293b] rounded-xl shadow-xl overflow-hidden flex flex-col h-full border border-slate-700 animate-fade-in">
                <div className="bg-[#0f172a] px-4 py-3 flex items-center gap-2 shrink-0 border-b border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-4 text-xs text-slate-400 font-mono">index.html</span>
                </div>
                <pre className="flex-1 p-4 md:p-6 text-xs font-mono text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed">
                  {project.htmlCode}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel - Right Sidebar */}
        {activeTab === 'preview' && showProperties && (
          <div className="hidden lg:block h-full">
            <PropertiesPanel
              element={selectedElement}
              onUpdate={handleElementUpdate}
              onClose={() => setShowProperties(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};