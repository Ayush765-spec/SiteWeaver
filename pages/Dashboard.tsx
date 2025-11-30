import React, { useState, useEffect } from 'react';
import { ArrowUp, Layout, Code, User as UserIcon, Sparkles, Database, Plus, Mail, Palette, Monitor } from 'lucide-react';
import { Project, User } from '../types';
import { getProjects, createNewProject, TEMPLATES } from '../services/storage';

interface DashboardProps {
  user: User | null;
  onOpenProject: (projectId: string) => void;
  onAuthRequired: () => void;
}

const CODE_SNIPPET = `<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">Hello there</h1>
      <p class="py-6">Provident cupiditate voluptatem.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>`;

export const Dashboard: React.FC<DashboardProps> = ({ user, onOpenProject, onAuthRequired }) => {
  const [prompt, setPrompt] = useState('');
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [typedCode, setTypedCode] = useState('');

  useEffect(() => {
    setIsSyncing(true);
    // Simulate DB fetch delay
    setTimeout(() => {
      setRecentProjects(getProjects());
      setIsSyncing(false);
    }, 800);
  }, []);

  // Typing effect for the hero visual
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= CODE_SNIPPET.length) {
        setTypedCode(CODE_SNIPPET.slice(0, currentIndex));
        currentIndex++;
      } else {
        // Reset to loop the animation
        setTimeout(() => {
          currentIndex = 0;
          setTypedCode('');
        }, 2000);
      }
    }, 30); // Typing speed

    return () => clearInterval(interval);
  }, []);

  const handleGenerate = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (!prompt.trim()) return;
    const project = createNewProject(prompt);
    onOpenProject(project.id);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cream-50 scroll-smooth">
      {/* Hero Section */}
      <section id="home" className="relative pt-24 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-orange-100/50 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>
        <div className="absolute top-40 right-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-rose-100/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-6 md:mb-8 border border-orange-200 shadow-sm animate-fade-in-up">
            <Sparkles size={12} />
            Gemini 2.5 Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-slate-900 mb-6 tracking-tight leading-tight px-2">
            What should we <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">design</span> next?
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-8 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed px-4">
            Generate, edit, and explore layouts in seconds. Describe your idea, preview the code, then polish it inside the playground.
          </p>

          {/* Input Area */}
          <div className="bg-white p-2 rounded-2xl shadow-2xl shadow-orange-500/10 border border-orange-100 max-w-2xl mx-auto transition-all focus-within:ring-4 focus-within:ring-orange-500/10 relative z-20 mx-4 md:mx-auto">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your page design (e.g., 'A modern SaaS landing page with a dark theme')..."
              className="w-full p-4 md:p-5 text-slate-900 bg-white placeholder:text-slate-400 text-base md:text-lg resize-none outline-none rounded-xl h-28 md:h-32 font-sans"
              style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
            />
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 pb-2 mt-2 gap-3">
               <div className="flex gap-2 w-full sm:w-auto">
                 <button className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors">
                   <Palette size={14} /> Style
                 </button>
               </div>
               <button 
                 onClick={handleGenerate}
                 disabled={!prompt.trim()}
                 className="w-full sm:w-auto justify-center px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
               >
                 <Sparkles size={16} />
                 {user ? 'Generate' : 'Sign in to Generate'}
               </button>
            </div>
          </div>
        </div>

        {/* Visual Mockup with Typing Animation */}
        <div className="mt-12 md:mt-16 max-w-5xl mx-auto relative hidden md:block animate-fade-in-up delay-200">
           <div className="bg-slate-900 rounded-t-xl p-3 flex items-center gap-2 w-11/12 md:w-3/4 mx-auto shadow-2xl">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              <div className="bg-slate-800 rounded-md px-3 py-1 text-[10px] text-slate-400 font-mono flex-1 text-center truncate">
                siteweaver.app/preview
              </div>
           </div>
           
           <div className="bg-white rounded-b-xl w-11/12 md:w-3/4 mx-auto h-64 md:h-80 border-x border-b border-slate-200 shadow-2xl overflow-hidden relative flex">
              {/* Left: Code Editor (Typing Effect) */}
              <div className="w-1/2 bg-[#1e293b] p-4 md:p-6 overflow-hidden border-r border-slate-700">
                 <div className="font-mono text-xs md:text-sm text-blue-300 mb-2">// Generating Layout...</div>
                 <pre className="font-mono text-[10px] md:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    <span className="text-pink-400">&lt;div</span> <span className="text-sky-300">class</span>=<span className="text-amber-300">"hero"</span><span className="text-pink-400">&gt;</span>
                    {typedCode}
                    <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-pulse align-middle"></span>
                 </pre>
              </div>

              {/* Right: Live Preview Mockup */}
              <div className="w-1/2 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center">
                 <div className="absolute inset-0 grid grid-cols-6 gap-2 p-4 opacity-5">
                    {Array.from({length: 24}).map((_, i) => (
                      <div key={i} className="bg-slate-900 rounded h-full"></div>
                    ))}
                 </div>
                 
                 {/* Floating elements animation */}
                 <div className="relative z-10 w-3/4 space-y-4">
                    <div className="w-full h-8 bg-white rounded-lg shadow-sm border border-slate-200 animate-pulse"></div>
                    <div className="flex gap-4">
                      <div className="w-2/3 h-24 bg-white rounded-lg shadow-sm border border-slate-200 p-3">
                         <div className="w-12 h-12 rounded-full bg-orange-100 mb-2"></div>
                         <div className="w-3/4 h-2 bg-slate-100 rounded"></div>
                      </div>
                      <div className="w-1/3 h-24 bg-white rounded-lg shadow-sm border border-slate-200"></div>
                    </div>
                    <div className="w-1/2 h-8 bg-slate-900 rounded-lg shadow-lg mx-auto transform hover:scale-105 transition-transform duration-500"></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Your Projects</h2>
            <p className="text-slate-500 text-sm mt-1">Pick up where you left off</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm self-start sm:self-auto">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
              <Database size={10} />
              {isSyncing ? 'Syncing...' : 'Neon DB Connected'}
            </span>
          </div>
        </div>

        {recentProjects.length === 0 && !isSyncing ? (
          <div className="text-center py-16 md:py-20 bg-white rounded-2xl border border-slate-100 border-dashed mx-2 md:mx-0">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Layout size={32} />
            </div>
            <h3 className="text-slate-900 font-medium mb-1">No projects yet</h3>
            <p className="text-slate-500 text-sm px-4">Enter a prompt above to generate your first website.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => onOpenProject(project.id)}
                className="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden h-52 flex flex-col"
              >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Layout size={20} />
                    </div>
                    {project.synced && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium border border-emerald-100">Synced</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{project.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium group-hover:text-orange-600 transition-colors">
                    <span>Open Editor</span>
                    <ArrowUp size={12} className="rotate-45" />
                  </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Templates Section */}
      <section id="templates" className="bg-white py-12 md:py-16 border-t border-slate-100">
         <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-slate-900">Start with a Template</h2>
              <p className="text-slate-500 text-sm mt-1">Production-ready layouts to kickstart your next idea</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               {TEMPLATES.map(template => (
                 <div key={template.id} className="group cursor-pointer">
                    <div className="bg-slate-100 rounded-xl aspect-[4/3] mb-4 overflow-hidden border border-slate-200 group-hover:shadow-md transition-all relative">
                       {template.thumbnail ? (
                          <img 
                            src={template.thumbnail} 
                            alt={template.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                       ) : (
                          <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>
                       )}
                       {/* Overlay */}
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <button className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                            Use Template
                          </button>
                       </div>
                    </div>
                    <h3 className="font-bold text-slate-900">{template.name}</h3>
                    <p className="text-xs text-slate-500">Responsive • Tailwind CSS</p>
                 </div>
               ))}
               
               {/* Coming soon card */}
               <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl aspect-[4/3] border border-dashed border-slate-300">
                  <span className="text-slate-400 text-sm font-medium">More coming soon</span>
               </div>
            </div>
         </div>
      </section>

      {/* Contact Footer */}
      <section id="contact" className="bg-slate-900 text-white py-16 md:py-20">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
               <Mail size={24} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">Get in touch</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
               Have questions about SiteWeaver, collaboration ideas, or student projects? Drop me a line and I'll get back to you soon.
            </p>
            
            <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700 inline-block text-left w-full max-w-md">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                     A
                  </div>
                  <div>
                     <h3 className="font-bold text-lg">Ayush Mukherjee</h3>
                     <p className="text-sm text-slate-400">Creator & Developer</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-300 break-all">
                     <Mail size={16} className="text-orange-500 shrink-0" />
                     <a href="mailto:ayushsouthpoint@gmail.com" className="hover:text-white transition-colors">ayushsouthpoint@gmail.com</a>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                     <div className="w-4 flex justify-center shrink-0"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div></div>
                     <span>Available for projects</span>
                  </div>
               </div>
            </div>
            
            <div className="mt-12 text-slate-600 text-sm">
               © 2024 SiteWeaver. Built with React, Tailwind, and Gemini.
            </div>
         </div>
      </section>
    </div>
  );
};