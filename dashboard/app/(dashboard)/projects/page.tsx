"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { inputClass } from "@/components/Field";

export default function ProjectsPage() {
  const { projects, addProject, deleteProject, setActiveProject, loading } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeProject(id: string, projectName: string) {
    if (!window.confirm(`Delete ${projectName}? All services, routes, and project members will be removed.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project");
    } finally {
      setDeletingId(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addProject({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 flex items-end justify-between gap-6">
        <div><p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-signal">Workspace directory</p><h1 className="font-display text-[30px] font-semibold tracking-tight text-text">Your projects</h1><p className="mt-2 max-w-xl text-[14px] leading-relaxed text-text-dim">Select a project to open its gateway dashboard, or create a new workspace for another product or environment.</p></div>
        <span className="hidden rounded-full border border-ink-border bg-ink-panel px-3 py-1.5 font-mono text-[11px] text-text-faint sm:block">{loading ? "Loading projects" : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`}</span>
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {projects.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <article key={project.id} className="group rounded-lg border border-ink-border bg-ink-panel p-5 shadow-panel transition-colors hover:border-signal/60 hover:bg-ink-panel2"><Link href="/services" onClick={() => setActiveProject(project.id)} className="block"><div className="mb-8 flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-md border border-signal/30 bg-signal/10 font-display text-[18px] text-signal">{project.name.slice(0, 1).toUpperCase()}</span><span className="font-mono text-[16px] text-text-faint group-hover:text-signal">-&gt;</span></div><h2 className="font-display text-[17px] font-semibold text-text">{project.name}</h2><p className="mt-1 min-h-10 text-[12px] leading-relaxed text-text-dim">{project.description || "No description added yet."}</p></Link><div className="mt-4 flex items-center justify-between border-t border-ink-border pt-3"><span className="font-mono text-[10px] uppercase tracking-wider text-text-faint">{project.service_count} {project.service_count === 1 ? "service" : "services"}</span><button type="button" onClick={() => removeProject(project.id, project.name)} disabled={deletingId === project.id} className="focus-ring text-[11px] text-danger hover:underline disabled:opacity-50">{deletingId === project.id ? "Deleting..." : "Delete"}</button></div></article>)}</div> : <div className="rounded-lg border border-dashed border-signal/40 bg-signal/5 px-6 py-14 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-signal/30 text-[22px] text-signal">+</div><h2 className="font-display text-[18px] font-semibold text-text">Start with your first project</h2><p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-text-dim">Create a project before adding services, routes, API keys, or team members.</p></div>}
        </section>
        <section className="h-fit rounded-lg border border-ink-border bg-ink-panel p-5 shadow-panel"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-signal">New workspace</p><h2 className="font-display text-[18px] font-semibold text-text">Create a project</h2><p className="mt-1 mb-5 text-[12px] leading-relaxed text-text-dim">Each project gets its own gateway configuration and member access.</p><form onSubmit={submit}><label className="mb-4 block"><span className="mb-1.5 block text-[12px] font-medium text-text-dim">Project name</span><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Payments API" required /></label><label className="mb-4 block"><span className="mb-1.5 block text-[12px] font-medium text-text-dim">Description <span className="text-text-faint">(optional)</span></span><textarea className={`${inputClass} min-h-20 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Production services and routes" /></label>{error && <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</p>}<button type="submit" disabled={saving} className="focus-ring w-full rounded-md bg-signal px-4 py-2.5 text-[13px] font-semibold text-ink hover:bg-signal/90 disabled:opacity-50">{saving ? "Creating project..." : "Create project"}</button></form></section>
      </div>
    </div>
  );
}
