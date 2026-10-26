"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  DEMO_STORAGE_KEY, STARTER_DEMO, blankStory, formattedDate,
  isDemoState, makeColumns, uid,
  type DemoColumn, type DemoProject, type DemoSprint, type DemoState, type DemoStory,
} from "./demo-data";

type Tab = "projects" | "board" | "backlog" | "sprints" | "mywork" | "calendar" | "insights" | "activity" | "settings" | "trash";
const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "projects", icon: "▦", label: "Projekti" },
  { id: "board", icon: "▥", label: "Tabla" },
  { id: "backlog", icon: "☷", label: "Backlog" },
  { id: "sprints", icon: "◷", label: "Sprintovi" },
  { id: "mywork", icon: "◎", label: "Moj rad" },
  { id: "calendar", icon: "▤", label: "Kalendar" },
  { id: "insights", icon: "◫", label: "Statistika" },
  { id: "activity", icon: "↺", label: "Aktivnosti" },
  { id: "settings", icon: "⚙", label: "Podešavanja" },
  { id: "trash", icon: "⌫", label: "Korpa" },
];

function Button({ children, onClick, variant = "ghost", title, disabled, type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger";
  title?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  return <button type={type} disabled={disabled} title={title} onClick={onClick} className={`demo-btn demo-btn--${variant}`}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="demo-field"><span>{label}</span>{children}</label>;
}

function Badge({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`demo-badge ${tone ? `demo-badge--${tone}` : ""}`}>{children}</span>;
}

export default function DemoApp() {
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<DemoState>(STARTER_DEMO);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [tab, setTab] = useState<Tab>("board");
  const [selectedId, setSelectedId] = useState("sample-project");
  const [selectedUser, setSelectedUser] = useState("Profesor");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [draft, setDraft] = useState<DemoStory | null>(null);
  const [commentText, setCommentText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [sprintDraft, setSprintDraft] = useState<DemoSprint | null>(null);
  const [retroTexts, setRetroTexts] = useState<Record<string, string>>({});
  const [dragId, setDragId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate only in browser, then persist each mutation. The server never sees these records.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isDemoState(parsed)) setData(parsed);
        else setStorageWarning("Sačuvani podaci nisu ispravni. Učitani su početni primeri.");
      }
    } catch {
      setStorageWarning("Browser skladište nije dostupno. Promene možda neće opstati posle osvežavanja.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    } catch {
      setStorageWarning("Nije moguće sačuvati promene u ovom browseru. Izvezi JSON kao rezervnu kopiju.");
    }
  }, [data, loaded]);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key !== DEMO_STORAGE_KEY || !event.newValue) return;
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (isDemoState(next)) setData(next);
      } catch { /* Ignore malformed changes from other tabs. */ }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  const activeProjects = data.projects.filter((p) => !p.archived);
  const project = activeProjects.find((p) => p.id === selectedId) ?? activeProjects[0] ?? null;
  const activeSprint = project?.sprints.find((s) => s.status === "active") ?? null;
  const doneId = project?.columns.find((c) => c.done)?.id ?? "";
  const storyList = project?.stories ?? [];
  const allProjectStories = data.projects.filter((p) => !p.archived).flatMap((p) =>
    p.stories.map((s) => ({ ...s, projectName: p.name, projectId: p.id, columnName: p.columns.find((c) => c.id === s.columnId)?.name ?? "Backlog" }))
  );
  const storyMatches = (story: DemoStory) =>
    (!search.trim() || `${story.title} ${story.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) &&
    (!priorityFilter || story.priority === priorityFilter) &&
    (!assigneeFilter || story.assignee === assigneeFilter);

  function mutate(update: (previous: DemoState) => DemoState, message?: string) {
    setData((previous) => {
      const next = update(previous);
      return message ? {
        ...next, activity: [{ id: uid(), text: message, time: new Date().toISOString() }, ...next.activity].slice(0, 100),
      } : next;
    });
  }
  function mutateProject(update: (p: DemoProject) => DemoProject, message?: string) {
    if (!project) return;
    const id = project.id;
    mutate((previous) => ({
      ...previous, projects: previous.projects.map((p) => p.id === id ? update(p) : p),
    }), message);
  }
  function openNewStory(initialSprintId?: string) {
    if (!project) return;
    setDraft(blankStory(project, initialSprintId ?? activeSprint?.id ?? ""));
    setTaskText(""); setCommentText("");
  }
  function openStory(story: DemoStory) {
    setDraft(structuredClone(story));
    setTaskText(""); setCommentText("");
  }
  function saveStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft?.title.trim() || !project) return;
    const story = { ...draft, title: draft.title.trim(), description: draft.description.trim(), points: Math.max(0, Number(draft.points) || 0) };
    const isNew = !project.stories.some((s) => s.id === story.id);
    mutateProject((p) => ({
      ...p, stories: isNew ? [...p.stories, story] : p.stories.map((s) => s.id === story.id ? story : s),
    }), `${isNew ? "Kreirana" : "Izmenjena"} kartica: ${story.title}`);
    setDraft(null);
  }
  function deleteStory(story: DemoStory) {
    if (!window.confirm(`Obrisati karticu „${story.title}“?`)) return;
    mutateProject((p) => ({ ...p, stories: p.stories.filter((s) => s.id !== story.id) }), `Obrisana kartica: ${story.title}`);
    setDraft(null);
  }
  function moveStory(id: string, columnId: string, beforeId = "") {
    mutateProject((p) => {
      const moving = p.stories.find((s) => s.id === id);
      if (!moving) return p;
      const changed = p.stories.map((s) => s.id === id ? { ...s, columnId } : s);
      const candidates = changed.filter((s) => s.columnId === columnId && s.sprintId === moving.sprintId && s.id !== id)
        .sort((a, b) => a.order - b.order);
      const targetIndex = candidates.findIndex((s) => s.id === beforeId);
      candidates.splice(targetIndex < 0 ? candidates.length : targetIndex, 0, { ...moving, columnId });
      const order = new Map(candidates.map((s, i) => [s.id, i]));
      return { ...p, stories: changed.map((s) => order.has(s.id) ? { ...s, order: order.get(s.id)! } : s) };
    }, "Kartica je pomerena na tabli.");
  }
  function createProject() {
    const name = window.prompt("Naziv novog projekta:");
    if (!name?.trim()) return;
    const id = uid();
    const next: DemoProject = {
      id, name: name.trim(), description: "", archived: false, columns: makeColumns(),
      members: [selectedUser || "Profesor"], sprints: [], stories: [],
    };
    mutate((prev) => ({ ...prev, projects: [...prev.projects, next] }), `Kreiran projekat: ${next.name}`);
    setSelectedId(id); setTab("settings"); setSearch("");
  }
  function archiveProject(p: DemoProject) {
    if (!window.confirm(`Premestiti projekat „${p.name}“ u korpu?`)) return;
    mutate((prev) => ({ ...prev, projects: prev.projects.map((item) => item.id === p.id ? { ...item, archived: true } : item) }), `Arhiviran projekat: ${p.name}`);
    setTab("projects");
  }
  function restoreProject(id: string) {
    mutate((prev) => ({ ...prev, projects: prev.projects.map((p) => p.id === id ? { ...p, archived: false } : p) }), "Vraćen projekat iz korpe.");
    setSelectedId(id); setTab("board");
  }
  function removeProject(p: DemoProject) {
    if (!window.confirm(`Trajno obrisati „${p.name}“ i sve kartice? Ovo se ne može poništiti.`)) return;
    mutate((prev) => ({ ...prev, projects: prev.projects.filter((item) => item.id !== p.id) }), `Trajno obrisan projekat: ${p.name}`);
  }
  function addColumn() {
    const name = window.prompt("Naziv nove kolone:");
    if (!name?.trim() || !project) return;
    mutateProject((p) => ({
      ...p, columns: [...p.columns.slice(0, -1), { id: uid(), name: name.trim(), done: false, wipLimit: 0 }, ...p.columns.slice(-1)],
    }), `Dodata kolona: ${name.trim()}`);
  }
  function editColumn(column: DemoColumn, action: "rename" | "wip" | "left" | "right" | "delete") {
    if (!project) return;
    if (action === "rename") {
      const name = window.prompt("Novi naziv kolone:", column.name)?.trim();
      if (name) mutateProject((p) => ({ ...p, columns: p.columns.map((c) => c.id === column.id ? { ...c, name } : c) }), `Preimenovana kolona: ${name}`);
    } else if (action === "wip") {
      const input = window.prompt("WIP limit (0 = bez ograničenja):", String(column.wipLimit));
      if (input === null || !/^\d+$/.test(input)) return;
      mutateProject((p) => ({ ...p, columns: p.columns.map((c) => c.id === column.id ? { ...c, wipLimit: Number(input) } : c) }));
    } else if (action === "delete") {
      if (column.done || project.columns.length <= 2) { window.alert("Završna kolona i poslednje dve kolone moraju ostati."); return; }
      if (!window.confirm(`Obrisati kolonu „${column.name}“? Njene kartice prelaze u prvu preostalu kolonu.`)) return;
      mutateProject((p) => {
        const fallback = p.columns.find((c) => c.id !== column.id)!.id;
        return { ...p, columns: p.columns.filter((c) => c.id !== column.id), stories: p.stories.map((s) => s.columnId === column.id ? { ...s, columnId: fallback } : s) };
      }, `Obrisana kolona: ${column.name}`);
    } else {
      mutateProject((p) => {
        const columns = [...p.columns];
        const current = columns.findIndex((c) => c.id === column.id);
        const target = current + (action === "left" ? -1 : 1);
        if (target < 0 || target >= columns.length || columns[current].done || columns[target].done) return p;
        [columns[current], columns[target]] = [columns[target], columns[current]];
        return { ...p, columns };
      });
    }
  }
  function openNewSprint() {
    if (!project) return;
    setSprintDraft({ id: uid(), name: `Sprint ${project.sprints.length + 1}`, goal: "",
      startDate: "", endDate: "", status: "planned", retro: [] });
  }
  function saveSprint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sprintDraft?.name.trim() || !project) return;
    if (sprintDraft.startDate && sprintDraft.endDate && sprintDraft.startDate > sprintDraft.endDate) {
      window.alert("Datum završetka mora biti posle datuma početka."); return;
    }
    const sprint = { ...sprintDraft, name: sprintDraft.name.trim() };
    const isNew = !project.sprints.some((s) => s.id === sprint.id);
    mutateProject((p) => ({ ...p, sprints: isNew ? [...p.sprints, sprint] : p.sprints.map((s) => s.id === sprint.id ? sprint : s) }),
      `${isNew ? "Napravljen" : "Izmenjen"} sprint: ${sprint.name}`);
    setSprintDraft(null);
  }
  function changeSprintStatus(sprint: DemoSprint, status: "active" | "planned" | "completed") {
    if (status === "active" && activeSprint && activeSprint.id !== sprint.id) { window.alert("Prvo završi ili vrati aktivni sprint u planirano."); return; }
    if (status === "completed" && !window.confirm(`Završiti sprint „${sprint.name}“?`)) return;
    mutateProject((p) => ({ ...p, sprints: p.sprints.map((s) => s.id === sprint.id ? { ...s, status } : s) }),
      `Sprint „${sprint.name}“: ${status === "active" ? "pokrenut" : status === "planned" ? "vraćen u planirano" : "završen"}.`);
  }
  function deleteSprint(sprint: DemoSprint) {
    if (sprint.status !== "planned" || !window.confirm(`Obrisati planirani sprint „${sprint.name}“? Kartice prelaze u backlog.`)) return;
    mutateProject((p) => ({
      ...p, sprints: p.sprints.filter((s) => s.id !== sprint.id),
      stories: p.stories.map((s) => s.sprintId === sprint.id ? { ...s, sprintId: "" } : s),
    }), `Obrisan sprint: ${sprint.name}`);
  }
  function addRetro(sprintId: string, category: "good" | "bad") {
    const text = retroTexts[sprintId]?.trim();
    if (!text) return;
    mutateProject((p) => ({ ...p, sprints: p.sprints.map((s) => s.id === sprintId
      ? { ...s, retro: [...s.retro, { id: uid(), category, text }] } : s) }), "Dodat osvrt na sprint.");
    setRetroTexts((prev) => ({ ...prev, [sprintId]: "" }));
  }
  function addMember() {
    const name = window.prompt("Ime demo člana tima:")?.trim();
    if (!name || !project) return;
    if (project.members.some((m) => m.toLowerCase() === name.toLowerCase())) { window.alert("Član već postoji."); return; }
    mutateProject((p) => ({ ...p, members: [...p.members, name] }), `Dodat demo član: ${name}`);
  }
  function removeMember(name: string) {
    if (!project || project.members.length <= 1 || !window.confirm(`Ukloniti člana „${name}“? Njegove kartice ostaju bez zaduženog.`)) return;
    mutateProject((p) => ({
      ...p, members: p.members.filter((m) => m !== name),
      stories: p.stories.map((s) => s.assignee === name ? { ...s, assignee: "" } : s),
    }));
    if (selectedUser === name) setSelectedUser("Profesor");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "tapiz-demo-backup.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importData(file: File) {
    try {
      const json: unknown = JSON.parse(await file.text());
      if (!isDemoState(json)) throw new Error("Invalid format");
      if (!window.confirm("Uvoz će zameniti sve trenutne demo podatke. Nastaviti?")) return;
      setData(json); setSelectedId(json.projects.find((p) => !p.archived)?.id ?? "");
      setTab("projects"); setStorageWarning("");
    } catch {
      window.alert("Datoteka nije ispravan Tapiz demo JSON (verzija 1).");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  function resetDemo() {
    if (!window.confirm("Obrisati lokalne izmene i vratiti početne demo primere?")) return;
    setData(structuredClone(STARTER_DEMO)); setSelectedId("sample-project"); setTab("board");
    setSearch(""); setPriorityFilter(""); setAssigneeFilter("");
  }

  const sprintCount = project?.sprints.length ?? 0;
  const backlog = storyList.filter((s) => !activeSprint || s.sprintId !== activeSprint.id);
  const boardStories = storyList.filter((s) => s.sprintId === activeSprint?.id);
  const doneCount = boardStories.filter((s) => s.columnId === doneId).length;
  const donePoints = boardStories.filter((s) => s.columnId === doneId).reduce((sum, s) => sum + s.points, 0);
  const totalPoints = boardStories.reduce((sum, s) => sum + s.points, 0);
  const visibleMyWork = useMemo(() =>
    allProjectStories.filter((s) => s.assignee === selectedUser && storyMatches(s)),
    // Filters are deliberately controlled in the parent; the array is inexpensive in this demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, selectedUser, search, priorityFilter, assigneeFilter]);
  const isProjectTab = tab === "projects" || tab === "trash";
  const noProject = !project && !isProjectTab && tab !== "activity";

  function filters() {
    return <div className="demo-filters">
      <input aria-label="Pretraga kartica" placeholder="Pretraži kartice…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <select aria-label="Prioritet" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
        <option value="">Svi prioriteti</option><option value="high">Visok</option><option value="medium">Srednji</option><option value="low">Nizak</option>
      </select>
      <select aria-label="Zaduženi" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
        <option value="">Svi članovi</option>{project?.members.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      {(search || priorityFilter || assigneeFilter) && <Button onClick={() => { setSearch(""); setPriorityFilter(""); setAssigneeFilter(""); }}>Očisti</Button>}
    </div>;
  }

  function storyCard(story: DemoStory, draggable = false) {
    const done = story.tasks.filter((t) => t.done).length;
    return <div key={story.id} className="demo-story" draggable={draggable}
      onDragStart={draggable ? (e) => { e.dataTransfer.effectAllowed = "move"; setDragId(story.id); } : undefined}
      onDragEnd={draggable ? () => setDragId("") : undefined}
      onDragOver={draggable ? (e) => e.preventDefault() : undefined}
      onDrop={draggable ? (e) => { e.preventDefault(); e.stopPropagation(); if (dragId && dragId !== story.id) moveStory(dragId, story.columnId, story.id); setDragId(""); } : undefined}>
      <button className="demo-story-open" onClick={() => openStory(story)}>
        <strong>{story.title}</strong>
        {story.description && <span className="demo-story-desc">{story.description}</span>}
        <span className="demo-story-meta">
          <Badge tone={story.priority}>{story.priority === "high" ? "Visok" : story.priority === "low" ? "Nizak" : "Srednji"}</Badge>
          {story.points > 0 && <Badge>{story.points} SP</Badge>}
          {story.tasks.length > 0 && <Badge>✓ {done}/{story.tasks.length}</Badge>}
          {story.comments.length > 0 && <Badge>◌ {story.comments.length}</Badge>}
          {story.dueDate && <Badge>{formattedDate(story.dueDate)}</Badge>}
        </span>
        <span className="demo-story-footer">{story.assignee ? <span className="demo-avatar" aria-hidden="true">{story.assignee[0].toUpperCase()}</span> : <span className="demo-unassigned">Nije dodeljeno</span>}<span>{story.assignee}</span></span>
      </button>
    </div>;
  }

  return <div className="demo-shell">
    <aside className="demo-sidebar">
      <div className="demo-logo"><span className="demo-logo-mark">▦</span><div><strong>TAPIZ <em>BOARDS</em></strong><small>EDUCATION · LOCAL DEMO</small></div></div>
      <div className="demo-sidebar-caption">RADNI PROSTOR</div>
      <select className="demo-project-select" aria-label="Aktivni projekat" value={project?.id ?? ""} onChange={(e) => { setSelectedId(e.target.value); setTab("board"); }}>
        {activeProjects.length === 0 && <option value="">Nema aktivnih projekata</option>}
        {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <nav className="demo-nav" aria-label="Demo navigacija">
        {tabs.map((item) => <button key={item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>
          <span aria-hidden="true">{item.icon}</span>{item.label}
          {item.id === "backlog" && project && <small>{backlog.length}</small>}
          {item.id === "trash" && <small>{data.projects.filter((p) => p.archived).length}</small>}
        </button>)}
      </nav>
      <div className="demo-sidebar-bottom">
        <div className="demo-private"><span>●</span> OFFLINE DEMO<br/><small>Podaci ostaju u ovom browseru.</small></div>
        <Button onClick={toggleTheme}>{theme === "dark" ? "☀ Svetla tema" : "☾ Tamna tema"}</Button>
      </div>
    </aside>

    <main className="demo-main">
      <header className="demo-topbar">
        <div><span className="demo-eyebrow">TAPIZ / {project?.name ?? "DEMO"}</span><h1>{tabs.find((x) => x.id === tab)?.label}</h1></div>
        <div className="demo-top-actions">
          <Badge tone="local">Bez logina i baze</Badge>
          <Button onClick={exportData} title="Sačuvaj lokalne podatke u JSON">↓ Izvezi</Button>
          <Button onClick={() => fileRef.current?.click()}>↑ Uvezi</Button>
          <input ref={fileRef} hidden type="file" accept=".json,application/json" aria-label="Uvezi demo podatke" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importData(f); }} />
        </div>
      </header>
      {storageWarning && <div className="demo-warning" role="status">{storageWarning}</div>}
      <div className="demo-help">Interaktivni primer za nastavu. Podaci se automatski čuvaju u <code>localStorage</code> na ovom uređaju. Nema sinhronizacije između korisnika ili uređaja.</div>

      {tab === "projects" && <section>
        <div className="demo-section-head"><div><h2>Aktivni projekti</h2><p>Svaki projekat ima svoju Kanban tablu i sprintove.</p></div><Button variant="primary" onClick={createProject}>+ Novi projekat</Button></div>
        <div className="demo-project-grid">
          {activeProjects.map((p) => <article key={p.id} className="demo-panel demo-project-card"><span className="demo-project-symbol">▦</span><h3>{p.name}</h3><p>{p.description || "Bez opisa"}</p>
            <div className="demo-project-counts"><Badge>{p.stories.length} kartica</Badge><Badge>{p.members.length} članova</Badge><Badge>{p.sprints.length} sprintova</Badge></div>
            <div className="demo-button-row"><Button variant="primary" onClick={() => { setSelectedId(p.id); setTab("board"); }}>Otvori tablu</Button><Button onClick={() => { setSelectedId(p.id); setTab("settings"); }}>Podešavanja</Button><Button variant="danger" onClick={() => archiveProject(p)}>U korpu</Button></div>
          </article>)}
          {activeProjects.length === 0 && <div className="demo-empty demo-panel">Nema aktivnih projekata. Napravi novi projekat ili vrati neki iz korpe.</div>}
        </div>
      </section>}

      {tab === "trash" && <section><div className="demo-section-head"><div><h2>Korpa</h2><p>Arhivirani projekti mogu da se vrate ili trajno obrišu.</p></div></div>
        <div className="demo-stack">{data.projects.filter((p) => p.archived).map((p) => <article className="demo-panel demo-list-item" key={p.id}><div><h3>{p.name}</h3><p>{p.stories.length} kartica, {p.sprints.length} sprintova</p></div><div className="demo-button-row"><Button variant="primary" onClick={() => restoreProject(p.id)}>Vrati</Button><Button variant="danger" onClick={() => removeProject(p)}>Trajno obriši</Button></div></article>)}
          {!data.projects.some((p) => p.archived) && <div className="demo-panel demo-empty">Korpa je prazna.</div>}</div>
      </section>}

      {noProject && <div className="demo-panel demo-empty"><h2>Nema aktivnog projekta</h2><p>Napravi novi projekat da započneš rad.</p><Button variant="primary" onClick={createProject}>+ Novi projekat</Button></div>}

      {project && tab === "board" && <section>
        <div className="demo-section-head"><div><h2>{project.name} <Badge tone="local">Kanban</Badge></h2><p>{activeSprint ? `Aktivni sprint: ${activeSprint.name} · ${activeSprint.goal || "bez cilja"}` : "Tabla prikazuje samo aktivni sprint, kao u Tapiz Boards."}</p></div><div className="demo-button-row"><Button onClick={addColumn}>+ Kolona</Button><Button variant="primary" onClick={() => openNewStory()}>+ Kartica</Button></div></div>
        {filters()}
        {activeSprint ? <>
          <div className="demo-metrics"><span>{boardStories.length} kartica</span><span>{doneCount} završeno</span><span>{donePoints}/{totalPoints} story points</span><span>{boardStories.length ? Math.round((doneCount / boardStories.length) * 100) : 0}% završeno</span></div>
          <div className="demo-columns">
            {project.columns.map((column, index) => {
              const shown = boardStories.filter((s) => s.columnId === column.id && storyMatches(s)).sort((a, b) => a.order - b.order);
              const total = boardStories.filter((s) => s.columnId === column.id).length;
              return <div key={column.id} className={`demo-column ${column.done ? "demo-column--done" : ""}`}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (dragId) moveStory(dragId, column.id); setDragId(""); }}>
                <div className="demo-column-title"><div><span className="demo-column-dot"/><strong>{column.name}</strong><Badge>{total}</Badge></div><span className="demo-column-menu">
                  <button title="Preimenuj" onClick={() => editColumn(column, "rename")}>✎</button>
                  <button title="WIP limit" onClick={() => editColumn(column, "wip")}>≡</button>
                  <button title="Pomeri levo" disabled={index === 0 || column.done} onClick={() => editColumn(column, "left")}>←</button>
                  <button title="Pomeri desno" disabled={index === project.columns.length - 1 || project.columns[index + 1]?.done} onClick={() => editColumn(column, "right")}>→</button>
                  {!column.done && <button title="Obriši kolonu" onClick={() => editColumn(column, "delete")}>×</button>}
                </span></div>
                {column.wipLimit > 0 && <div className={total > column.wipLimit ? "demo-wip over" : "demo-wip"}>WIP {total}/{column.wipLimit}{total > column.wipLimit && " · prekoračeno"}</div>}
                <div className="demo-column-cards">{shown.map((s) => storyCard(s, true))}<button className="demo-add-inline" onClick={() => { const fresh = blankStory(project, activeSprint.id); fresh.columnId = column.id; setDraft(fresh); }}>+ Nova kartica</button></div>
              </div>;
            })}
          </div>
          <p className="demo-note">Prevuci kartice između kolona ili promeni kolonu u detaljima kartice. Za rad na telefonu koristi izbor kolone u kartici.</p>
        </> : <div className="demo-panel demo-empty"><h3>Nema aktivnog sprinta</h3><p>U Tapiz Boards se kartice nalaze u backlog-u dok ne pokreneš sprint.</p><Button variant="primary" onClick={() => setTab("sprints")}>Otvori sprintove</Button><Button onClick={() => setTab("backlog")}>Pogledaj backlog</Button></div>}
      </section>}

      {project && tab === "backlog" && <section><div className="demo-section-head"><div><h2>Backlog</h2><p>Sve kartice van aktivnog sprinta, uključujući planirane sprintove.</p></div><Button variant="primary" onClick={() => openNewStory("")}>+ Nova kartica</Button></div>{filters()}
        <div className="demo-panel demo-backlog">
          {backlog.filter(storyMatches).sort((a, b) => a.order - b.order).map((story) => <div key={story.id} className="demo-list-item demo-backlog-row">
            <div><button className="demo-link" onClick={() => openStory(story)}>{story.title}</button><p>{story.description || "Bez opisa"}</p><span className="demo-inline-info"><Badge tone={story.priority}>{story.priority}</Badge><Badge>{story.points} SP</Badge>{story.assignee && <Badge>{story.assignee}</Badge>}</span></div>
            <select aria-label={`Sprint za ${story.title}`} value={story.sprintId} onChange={(e) => mutateProject((p) => ({ ...p, stories: p.stories.map((s) => s.id === story.id ? { ...s, sprintId: e.target.value } : s) }), `Promenjen sprint za: ${story.title}`)}>
              <option value="">Bez sprinta</option>{project.sprints.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
            </select>
          </div>)}
          {backlog.filter(storyMatches).length === 0 && <div className="demo-empty">Backlog nema kartica za izabrane filtere.</div>}
        </div>
      </section>}

      {project && tab === "sprints" && <section><div className="demo-section-head"><div><h2>Planiranje sprintova</h2><p>Najviše jedan aktivan sprint po projektu. Dodaj kartice u sprint kroz backlog ili detalje kartice.</p></div><Button variant="primary" onClick={openNewSprint}>+ Novi sprint</Button></div>
        <div className="demo-stack">{project.sprints.map((sprint) => {
          const stories = storyList.filter((s) => s.sprintId === sprint.id);
          const points = stories.reduce((sum, s) => sum + s.points, 0);
          return <article className="demo-panel demo-sprint" key={sprint.id}>
            <div className="demo-section-head"><div><h3>{sprint.name} <Badge tone={sprint.status}>{sprint.status === "active" ? "U toku" : sprint.status === "planned" ? "Planiran" : "Završen"}</Badge></h3><p>{sprint.goal || "Cilj nije unet"} · {formattedDate(sprint.startDate)} — {formattedDate(sprint.endDate)}</p><div className="demo-inline-info"><Badge>{stories.length} kartica</Badge><Badge>{points} SP</Badge></div></div><div className="demo-button-row">
              {sprint.status === "planned" && <><Button variant="primary" disabled={Boolean(activeSprint)} onClick={() => changeSprintStatus(sprint, "active")}>Pokreni</Button><Button onClick={() => setSprintDraft(structuredClone(sprint))}>Izmeni</Button><Button variant="danger" onClick={() => deleteSprint(sprint)}>Obriši</Button></>}
              {sprint.status === "active" && <><Button variant="primary" onClick={() => changeSprintStatus(sprint, "completed")}>Završi</Button><Button onClick={() => changeSprintStatus(sprint, "planned")}>Vrati u planirano</Button><Button onClick={() => setTab("board")}>Tabla</Button></>}
            </div></div>
            <div className="demo-sprint-stories">{stories.map((story) => <button key={story.id} onClick={() => openStory(story)}><span>{story.title}</span><Badge>{project.columns.find((c) => c.id === story.columnId)?.name ?? "—"}</Badge></button>)}
              {stories.length === 0 && <p>Nema dodeljenih kartica.</p>}</div>
            {sprint.status === "completed" && <div className="demo-retro"><h4>Retrospektiva</h4>{sprint.retro.map((r) => <div className="demo-retro-item" key={r.id}><Badge tone={r.category === "good" ? "done" : "high"}>{r.category === "good" ? "Šta je bilo dobro" : "Šta unaprediti"}</Badge> {r.text} <button title="Obriši napomenu" onClick={() => mutateProject((p) => ({ ...p, sprints: p.sprints.map((s) => s.id === sprint.id ? { ...s, retro: s.retro.filter((i) => i.id !== r.id) } : s) }))}>×</button></div>)}
              <textarea placeholder="Zabeleži zaključak sa retrospektive…" value={retroTexts[sprint.id] ?? ""} onChange={(e) => setRetroTexts((prev) => ({ ...prev, [sprint.id]: e.target.value }))} />
              <div className="demo-button-row"><Button onClick={() => addRetro(sprint.id, "good")}>+ Šta je bilo dobro</Button><Button onClick={() => addRetro(sprint.id, "bad")}>+ Šta unaprediti</Button></div>
            </div>}
          </article>;
        })}{sprintCount === 0 && <div className="demo-panel demo-empty">Nema sprintova. Napravi prvi planirani sprint, dodaj kartice i pokreni ga.</div>}</div>
      </section>}

      {project && tab === "mywork" && <section><div className="demo-section-head"><div><h2>Moj rad</h2><p>Kartice dodeljene izabranom demo korisniku kroz sve projekte.</p></div><select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}><option value="">Izaberi člana</option>{Array.from(new Set(data.projects.flatMap((p) => p.members))).map((m) => <option key={m} value={m}>{m}</option>)}</select></div>{filters()}
        <div className="demo-stack">{visibleMyWork.map((story) => <div className="demo-panel demo-list-item" key={story.id}><div><h3>{story.title}</h3><p>{story.projectName} / {story.columnName}</p></div><div className="demo-button-row"><Badge>{story.points} SP</Badge><Button onClick={() => { setSelectedId(story.projectId); setTab("board"); openStory(story); }}>Detalji</Button></div></div>)}{visibleMyWork.length === 0 && <div className="demo-panel demo-empty">Nema dodeljenih kartica.</div>}</div>
      </section>}

      {project && tab === "calendar" && <section><div className="demo-section-head"><div><h2>Kalendar rokova</h2><p>Pregled rokova kartica po datumu.</p></div></div>
        <div className="demo-stack">{storyList.filter((s) => s.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((story) => <div className="demo-panel demo-list-item" key={story.id}><div><Badge>{formattedDate(story.dueDate)}</Badge><h3>{story.title}</h3><p>{story.assignee || "Nije dodeljeno"}</p></div><Button onClick={() => openStory(story)}>Detalji</Button></div>)}{!storyList.some((s) => s.dueDate) && <div className="demo-panel demo-empty">Postavi rok na kartici da se pojavi ovde.</div>}</div>
      </section>}

      {project && tab === "insights" && <section><div className="demo-section-head"><div><h2>Uvid u projekat</h2><p>Statistika se računa lokalno na osnovu kartica i sprintova.</p></div></div>
        <div className="demo-stat-grid"><div className="demo-panel demo-stat"><small>Ukupno kartica</small><strong>{storyList.length}</strong></div><div className="demo-panel demo-stat"><small>Završeno</small><strong>{storyList.filter((s) => s.columnId === doneId).length}</strong></div><div className="demo-panel demo-stat"><small>Story points</small><strong>{storyList.reduce((sum, s) => sum + s.points, 0)}</strong></div><div className="demo-panel demo-stat"><small>Sprintova</small><strong>{sprintCount}</strong></div></div>
        <div className="demo-panel demo-chart"><h3>Kartice po kolonama</h3>{project.columns.map((c) => { const count = storyList.filter((s) => s.columnId === c.id).length; return <div key={c.id} className="demo-chart-row"><span>{c.name}</span><div><span style={{ width: `${storyList.length ? (count / storyList.length) * 100 : 0}%` }}/></div><b>{count}</b></div>; })}</div>
        <div className="demo-panel demo-chart"><h3>Zaduženja po članovima</h3>{project.members.map((member) => { const count = storyList.filter((s) => s.assignee === member).length; return <div key={member} className="demo-chart-row"><span>{member}</span><div><span style={{ width: `${storyList.length ? (count / storyList.length) * 100 : 0}%` }}/></div><b>{count}</b></div>; })}</div>
      </section>}

      {tab === "activity" && <section><div className="demo-section-head"><div><h2>Istorija aktivnosti</h2><p>Poslednjih 100 promena u lokalnoj demonstraciji.</p></div></div><div className="demo-panel demo-activity">{data.activity.map((event) => <div key={event.id}><span>●</span><p>{event.text}<small>{event.time.replace("T", " ").slice(0, 16)}</small></p></div>)}</div></section>}

      {project && tab === "settings" && <section><div className="demo-section-head"><div><h2>Podešavanja projekta</h2><p>Podaci su izolovani od glavne aplikacije i postoje samo u ovom browseru.</p></div></div>
        <div className="demo-panel demo-settings">
          <Field label="Naziv projekta"><input value={project.name} onChange={(e) => { const value = e.target.value; mutateProject((p) => ({ ...p, name: value })); }} /></Field>
          <Field label="Opis"><textarea value={project.description} onChange={(e) => { const value = e.target.value; mutateProject((p) => ({ ...p, description: value })); }} /></Field>
          <div className="demo-section-head"><div><h3>Demo članovi tima</h3><p>Bez naloga: članovi služe samo za dodelu kartica.</p></div><Button onClick={addMember}>+ Član</Button></div>
          <div className="demo-member-list">{project.members.map((name) => <div key={name}><span className="demo-avatar">{name[0]?.toUpperCase()}</span><span>{name}</span><Button variant="danger" disabled={project.members.length <= 1} onClick={() => removeMember(name)}>Ukloni</Button></div>)}</div>
          <div className="demo-button-row"><Button variant="danger" onClick={() => archiveProject(project)}>Premesti projekat u korpu</Button></div>
        </div>
        <div className="demo-panel demo-settings"><h3>Podaci radionice</h3><p>Možeš izvesti sve u JSON, ponovo ih uvesti ili vratiti početno stanje.</p><div className="demo-button-row"><Button onClick={exportData}>Izvezi JSON</Button><Button onClick={() => fileRef.current?.click()}>Uvezi JSON</Button><Button variant="danger" onClick={resetDemo}>Resetuj demo</Button></div></div>
      </section>}
    </main>

    {draft && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDraft(null); }}>
      <div className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-story-title">
        <div className="demo-modal-head"><div><span className="demo-eyebrow">KARTICA / LOCAL DEMO</span><h2 id="demo-story-title">{project?.stories.some((s) => s.id === draft.id) ? "Detalji kartice" : "Nova kartica"}</h2></div><button className="demo-close" aria-label="Zatvori" onClick={() => setDraft(null)}>×</button></div>
        <form onSubmit={saveStory} className="demo-form">
          <Field label="Naslov *"><input autoFocus required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}/></Field>
          <Field label="Opis"><textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/></Field>
          <div className="demo-form-grid">
            <Field label="Kolona"><select value={draft.columnId} onChange={(e) => setDraft({ ...draft, columnId: e.target.value })}>{project?.columns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Sprint"><select value={draft.sprintId} onChange={(e) => setDraft({ ...draft, sprintId: e.target.value })}><option value="">Backlog (bez sprinta)</option>{project?.sprints.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.status}</option>)}</select></Field>
            <Field label="Zaduženi"><select value={draft.assignee} onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}><option value="">Nije dodeljeno</option>{project?.members.map((m) => <option key={m} value={m}>{m}</option>)}</select></Field>
            <Field label="Prioritet"><select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as DemoStory["priority"] })}><option value="low">Nizak</option><option value="medium">Srednji</option><option value="high">Visok</option></select></Field>
            <Field label="Story points"><input type="number" min={0} max={9999} value={draft.points} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}/></Field>
            <Field label="Rok"><input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}/></Field>
          </div>
          <div className="demo-subsection"><h3>Checklist ({draft.tasks.filter((t) => t.done).length}/{draft.tasks.length})</h3>{draft.tasks.map((task) => <div className="demo-task" key={task.id}><input type="checkbox" checked={task.done} onChange={(e) => setDraft({ ...draft, tasks: draft.tasks.map((t) => t.id === task.id ? { ...t, done: e.target.checked } : t) })}/><span className={task.done ? "is-complete" : ""}>{task.title}</span><button type="button" onClick={() => setDraft({ ...draft, tasks: draft.tasks.filter((t) => t.id !== task.id) })}>×</button></div>)}
            <div className="demo-input-row"><input placeholder="Nova stavka…" value={taskText} onChange={(e) => setTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (taskText.trim()) { setDraft({ ...draft, tasks: [...draft.tasks, { id: uid(), title: taskText.trim(), done: false }] }); setTaskText(""); } } }}/><Button onClick={() => { if (taskText.trim()) { setDraft({ ...draft, tasks: [...draft.tasks, { id: uid(), title: taskText.trim(), done: false }] }); setTaskText(""); } }}>Dodaj</Button></div>
          </div>
          <div className="demo-subsection"><h3>Komentari ({draft.comments.length})</h3>{draft.comments.map((comment) => <div className="demo-comment" key={comment.id}><strong>{comment.author}</strong><small>{comment.createdAt.replace("T", " ").slice(0, 16)}</small><p>{comment.body}</p><button type="button" title="Obriši komentar" onClick={() => setDraft({ ...draft, comments: draft.comments.filter((c) => c.id !== comment.id) })}>×</button></div>)}
            <div className="demo-input-row"><input placeholder="Napiši komentar…" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (commentText.trim()) { setDraft({ ...draft, comments: [...draft.comments, { id: uid(), author: selectedUser || "Profesor", body: commentText.trim(), createdAt: new Date().toISOString() }] }); setCommentText(""); } } }}/><Button onClick={() => { if (commentText.trim()) { setDraft({ ...draft, comments: [...draft.comments, { id: uid(), author: selectedUser || "Profesor", body: commentText.trim(), createdAt: new Date().toISOString() }] }); setCommentText(""); } }}>Komentariši</Button></div>
          </div>
          <div className="demo-modal-actions">{project?.stories.some((s) => s.id === draft.id) && <Button variant="danger" onClick={() => deleteStory(draft)}>Obriši karticu</Button>}<div className="demo-spacer"/><Button onClick={() => setDraft(null)}>Odustani</Button><Button type="submit" variant="primary">Sačuvaj karticu</Button></div>
        </form>
      </div>
    </div>}

    {sprintDraft && <div className="demo-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSprintDraft(null); }}>
      <div className="demo-modal demo-modal--small" role="dialog" aria-modal="true" aria-labelledby="demo-sprint-title">
        <div className="demo-modal-head"><h2 id="demo-sprint-title">Planiranje sprinta</h2><button className="demo-close" aria-label="Zatvori" onClick={() => setSprintDraft(null)}>×</button></div>
        <form onSubmit={saveSprint} className="demo-form"><Field label="Naziv *"><input autoFocus required value={sprintDraft.name} onChange={(e) => setSprintDraft({ ...sprintDraft, name: e.target.value })}/></Field><Field label="Cilj sprinta"><textarea value={sprintDraft.goal} onChange={(e) => setSprintDraft({ ...sprintDraft, goal: e.target.value })}/></Field><div className="demo-form-grid"><Field label="Početak"><input type="date" value={sprintDraft.startDate} onChange={(e) => setSprintDraft({ ...sprintDraft, startDate: e.target.value })}/></Field><Field label="Kraj"><input type="date" value={sprintDraft.endDate} onChange={(e) => setSprintDraft({ ...sprintDraft, endDate: e.target.value })}/></Field></div><div className="demo-modal-actions"><Button onClick={() => setSprintDraft(null)}>Odustani</Button><Button variant="primary" type="submit">Sačuvaj sprint</Button></div></form>
      </div>
    </div>}
  </div>;
}
