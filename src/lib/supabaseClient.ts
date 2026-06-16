import { createClient } from "@supabase/supabase-js";

// Access Vite public environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

// We check if the environment variables are set and not placeholder values
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "YOUR_SUPABASE_URL_HERE" && 
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY_HERE";

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const HAS_REAL_SUPABASE = isConfigured;

console.log("[Supabase Client] Real Supabase status:", HAS_REAL_SUPABASE ? "CONNECTED" : "FALLBACK_SANDBOX");

// Mock database and user state for sandbox mode when Supabase isn't hooked up yet
export interface SandboxProject {
  id: string;
  name: string;
  files: any[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SandboxUser {
  id: string;
  email: string;
}

class SandboxEngine {
  private getStorageKey(key: string): string {
    return `saas_forge_sandbox_${key}`;
  }

  getCurrentUser(): SandboxUser | null {
    const data = localStorage.getItem(this.getStorageKey("user"));
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user: SandboxUser | null) {
    if (user) {
      localStorage.setItem(this.getStorageKey("user"), JSON.stringify(user));
    } else {
      localStorage.removeItem(this.getStorageKey("user"));
    }
  }

  getProjects(): SandboxProject[] {
    const list = localStorage.getItem(this.getStorageKey("projects"));
    const allProjects: SandboxProject[] = list ? JSON.parse(list) : [];
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    return allProjects.filter(p => p.user_id === currentUser.id);
  }

  saveProject(name: string, files: any[], projectId?: string): SandboxProject {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required");

    const allList = localStorage.getItem(this.getStorageKey("projects"));
    let allProjects: SandboxProject[] = allList ? JSON.parse(allList) : [];

    const now = new Date().toISOString();

    if (projectId) {
      const idx = allProjects.findIndex(p => p.id === projectId && p.user_id === currentUser.id);
      if (idx !== -1) {
        allProjects[idx] = {
          ...allProjects[idx],
          name,
          files,
          updated_at: now
        };
        localStorage.setItem(this.getStorageKey("projects"), JSON.stringify(allProjects));
        return allProjects[idx];
      }
    }

    const newProject: SandboxProject = {
      id: Math.random().toString(36).substring(7),
      name,
      files,
      user_id: currentUser.id,
      created_at: now,
      updated_at: now
    };

    allProjects.push(newProject);
    localStorage.setItem(this.getStorageKey("projects"), JSON.stringify(allProjects));
    return newProject;
  }

  deleteProject(id: string) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("Authentication required");

    const allList = localStorage.getItem(this.getStorageKey("projects"));
    if (!allList) return;

    let allProjects: SandboxProject[] = JSON.parse(allList);
    allProjects = allProjects.filter(p => !(p.id === id && p.user_id === currentUser.id));
    localStorage.setItem(this.getStorageKey("projects"), JSON.stringify(allProjects));
  }
}

export const sandbox = new SandboxEngine();
