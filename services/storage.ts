import { Project, User } from '../types';

// INTEGRATION CONFIGURATION
const CONFIG = {
  DATABASE_URL: "postgresql://neondb_owner:npg_TWgj0sQd4PGb@ep-divine-dawn-a4fiqw1s-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  CLERK_KEY: "pk_test_Zmxvd2luZy1zaGFyay01NC5jbGVyay5hY2NvdW50cy5kZXYk",
  STORAGE_KEY: 'siteweaver_projects',
  USER_KEY: 'siteweaver_user'
};

// Templates available to everyone
export const TEMPLATES: Project[] = [
  {
    id: 'template_saas',
    name: 'SaaS Landing Page',
    createdAt: new Date().toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    htmlCode: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-50"><div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8"><div class="text-center"><h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">Data to enrich your online business</h1><p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.</p></div></div></body></html>',
    history: [],
    synced: true
  },
  {
    id: 'template_portfolio',
    name: 'Designer Portfolio',
    createdAt: new Date().toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    htmlCode: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white"><nav class="flex items-center justify-between flex-wrap p-6"><div class="flex items-center flex-shrink-0 text-black mr-6"><span class="font-semibold text-xl tracking-tight">Portfolio</span></div></nav><div class="container mx-auto px-4"><div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10"><div class="bg-gray-100 h-64 rounded-lg"></div><div class="bg-gray-100 h-64 rounded-lg"></div></div></div></body></html>',
    history: [],
    synced: true
  },
  {
    id: 'template_ecommerce',
    name: 'E-commerce Store',
    createdAt: new Date().toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    htmlCode: '<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white"><header class="bg-white shadow"><div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"><h1 class="text-3xl font-bold text-gray-900">Store</h1></div></header><main><div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"><div class="px-4 py-6 sm:px-0"><div class="border-4 border-dashed border-gray-200 rounded-lg h-96"></div></div></div></main></body></html>',
    history: [],
    synced: true
  }
];

// USER SESSION MANAGEMENT
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CONFIG.USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const signIn = (email: string): User => {
  const user: User = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    name: email.split('@')[0],
    email: email,
    avatar: `https://ui-avatars.com/api/?name=${email}&background=0D8ABC&color=fff`
  };
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  return user;
};

export const signOut = () => {
  localStorage.removeItem(CONFIG.USER_KEY);
};

// DATABASE OPERATIONS (Simulated Neon DB)
export const getProjects = (): Project[] => {
  const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (!stored) {
    return [];
  }
  return JSON.parse(stored);
};

export const getProjectById = (id: string): Project | undefined => {
  // First check mock templates (for read-only access simulation)
  const template = TEMPLATES.find(t => t.id === id);
  if (template) {
      // Return a copy so we don't mutate the const
      return { ...template };
  }

  const projects = getProjects();
  return projects.find(p => p.id === id);
};

export const saveProject = async (project: Project): Promise<void> => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  
  // Mark as syncing
  project.synced = false;
  
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.unshift(project);
  }
  
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(projects));

  // Simulate Network Request to Neon DB
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Mark as synced
  project.synced = true;
  if (index >= 0) projects[index] = project;
  else projects[0] = project; // It was unshifted to 0
  
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(projects));
  console.log(`[Neon DB] Project ${project.id} synced successfully`);
};

export const createNewProject = (initialPrompt: string): Project => {
  const newProject: Project = {
    id: `project_${Math.random().toString(36).substr(2, 9)}`,
    name: initialPrompt.length > 25 ? initialPrompt.substring(0, 25) + '...' : initialPrompt,
    createdAt: new Date().toISOString(),
    // Initial placeholder that triggers the effect in Playground
    htmlCode: '<div style="display:flex;height:100vh;justify-content:center;align-items:center;font-family:sans-serif;color:#64748b;flex-direction:column;gap:1rem;"><div style="font-size:1.5rem;font-weight:bold;">Generating your design...</div><div style="font-size:0.9rem;">Powered by Gemini</div></div>',
    history: [
      { role: 'user', text: initialPrompt, timestamp: Date.now() }
    ],
    synced: false
  };
  
  saveProject(newProject);
  return newProject;
};