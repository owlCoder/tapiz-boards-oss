import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Button,
  ConfirmDialog,
  Download,
  EmptyState,
  InfoBanner,
  Select,
  useToast,
} from "@tapizlabs/ui";
import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { BoardView } from "@/features/board/BoardView";
import { BacklogView } from "@/features/board/BacklogView";
import { SprintsView } from "@/features/board/SprintsView";
import { TrashView } from "@/features/projects/TrashView";
import { MyWorkView } from "@/features/mywork/MyWorkView";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { HTML_LANGS, isLocale } from "@/i18n/config";
import {
  getState,
  replaceState,
  resetDemo,
  storageWarning,
  transaction,
  useRevision,
} from "./runtime/store";
import {
  nameOf,
  projectDto,
  sprintDto,
  storyDto,
  validateState,
  type LocalState,
} from "./runtime/model";
import { usePathname } from "./runtime/navigation";
import { messages } from "./runtime/messages";
import ChangelogPage from "@/app/(public)/changelog/page";
import PrivacyPolicyPage from "@/app/(public)/privacy-policy/page";
import TermsOfServicePage from "@/app/(public)/terms-of-service/page";

function DemoTools() {
  const { locale, dict } = useI18n();
  const t = messages[locale];
  const { showToast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, setPending] = useState<LocalState | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const input = useRef<HTMLInputElement>(null);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const data = getState();
  useEffect(() => {
    const listener = () => setOnline(navigator.onLine);
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
    return () => {
      window.removeEventListener("online", listener);
      window.removeEventListener("offline", listener);
    };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      if (reg.waiting) setUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          )
            setUpdate(worker);
        });
      });
    });
  }, []);
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(getState(), null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "tapiz-boards-demo.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error(t.tooLarge);
      setPending(validateState(JSON.parse(await file.text())));
    } catch (e) {
      showToast(
        e instanceof Error && e.message === t.tooLarge ? t.tooLarge : t.invalid,
        false,
      );
    }
  }
  function execute(fn: () => void) {
    try {
      fn();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t.invalid, false);
    }
  }
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-ink-100 px-3 py-2 text-xs">
        <Badge variant="info">{t.label}</Badge>
        <span className="text-txt-3" title={t.local}>
          {online ? t.saved : t.offline} · localStorage
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            aria-label={t.person}
            value={data.currentUserId}
            onChange={(e) =>
              execute(() =>
                transaction((d) => {
                  d.currentUserId = e.target.value;
                }),
              )
            }
            className="max-w-44 text-xs"
          >
            {data.users
              .filter((x) => x.isActive)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {nameOf(u)}
                </option>
              ))}
          </Select>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={14} />}
            onClick={exportData}
          >
            {t.export}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => input.current?.click()}
          >
            {t.import}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
            {t.reset}
          </Button>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label={t.import}
            onChange={(e) => {
              void importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {storageWarning() && (
        <InfoBanner variant="warn" text={storageWarning()} />
      )}
      {update && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-txt-3">{t.updated}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              navigator.serviceWorker.addEventListener(
                "controllerchange",
                () => location.reload(),
                { once: true },
              );
              update.postMessage("ACTIVATE");
            }}
          >
            {t.update}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={resetOpen}
        title={t.resetTitle}
        description={t.resetDescription}
        confirmLabel={t.reset}
        cancelLabel={dict.common.cancel}
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() =>
          execute(() => {
            resetDemo();
            setResetOpen(false);
          })
        }
      />
      <ConfirmDialog
        open={pending !== null}
        title={t.importTitle}
        description={t.importDescription}
        confirmLabel={t.import}
        cancelLabel={dict.common.cancel}
        onCancel={() => setPending(null)}
        onConfirm={() =>
          execute(() => {
            if (pending) replaceState(pending);
            setPending(null);
            showToast(t.imported, true);
          })
        }
      />
    </div>
  );
}

export default function DemoApp() {
  useRevision();
  const pathname = usePathname();
  const data = getState();
  let storedLocale = "sr";
  try {
    storedLocale = localStorage.getItem("tapiz-demo-locale") ?? "sr";
  } catch {
    /* Fall back to Serbian. */
  }
  const locale = isLocale(storedLocale) ? storedLocale : "sr";
  const t = messages[locale];
  useEffect(() => {
    document.documentElement.lang = HTML_LANGS[locale];
  }, [locale]);
  const view = useMemo(() => {
    const user = data.users.find((x) => x.id === data.currentUserId)!;
    const session = { id: user.id, role: user.role, name: nameOf(user) };
    const projects = data.projects.filter((x) => !x.deletedAt);
    const allStories = [...data.stories]
      .sort(
        (a, b) =>
          a.position - b.position ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id),
      )
      .map((s) => storyDto(data, s));
    const segments = pathname.split("/").filter(Boolean);
    let content;
    if (pathname === "/")
      content = (
        <Dashboard
          firstName={user.firstName}
          projects={projects.map(projectDto)}
          currentUserId={user.id}
        />
      );
    else if (pathname === "/changelog") content = <ChangelogPage />;
    else if (pathname === "/privacy-policy") content = <PrivacyPolicyPage />;
    else if (pathname === "/terms-of-service") content = <TermsOfServicePage />;
    else if (pathname === "/status")
      content = (
        <div className="space-y-5">
          <InfoBanner text={`${t.label} · ${t.local}`} />
          <div className="rounded-xl border border-border bg-ink-100 p-5">
            <p className="font-semibold text-txt-1">
              {storageWarning() || t.saved}
            </p>
            <p className="mt-2 text-sm text-txt-3">
              OSS UI · localStorage · {data.projects.length} /{" "}
              {data.stories.length}
            </p>
          </div>
        </div>
      );
    else if (pathname === "/trash")
      content = (
        <TrashView
          projects={data.projects
            .filter((x) => x.deletedAt && x.ownerId === user.id)
            .map(projectDto)}
        />
      );
    else if (pathname === "/my-work")
      content = (
        <MyWorkView
          firstName={user.firstName}
          items={allStories
            .filter(
              (s) =>
                s.assigneeId === user.id &&
                projects.some((p) => p.id === s.projectId) &&
                !data.columns.find((c) => c.id === s.columnId)?.isDone,
            )
            .map((s) => ({
              ...s,
              projectName: projects.find((p) => p.id === s.projectId)!.name,
              columnName:
                data.columns.find((c) => c.id === s.columnId)?.name ?? null,
            }))}
        />
      );
    else {
      const localProject = projects.find((x) => x.id === segments[1]);
      if (!localProject)
        content = <EmptyState title={t.missing} message={t.choose} />;
      else {
        const project = projectDto(localProject);
        const canManage = user.id === project.ownerId;
        const sprints = data.sprints
          .filter((s) => s.projectId === project.id)
          .map((s) => sprintDto(data, s));
        const activeId = sprints.find((s) => s.status === "active")?.id;
        const stories = allStories.filter((s) => s.projectId === project.id);
        const columns = data.columns
          .filter((c) => c.projectId === project.id)
          .sort((a, b) => a.position - b.position);
        const members = localProject.memberIds.map((id) => {
          const u = data.users.find((x) => x.id === id)!;
          return {
            userId: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
          };
        });
        const common = {
          project,
          columns,
          sprints,
          members,
          currentUser: session,
          canManage,
        };
        if (segments[2] === "backlog")
          content = (
            <BacklogView
              {...common}
              stories={stories.filter(
                (s) =>
                  !activeId || s.sprintId !== activeId || s.columnId === null,
              )}
            />
          );
        else if (segments[2] === "sprints")
          content = (
            <SprintsView
              {...common}
              storiesBySprint={Object.fromEntries(
                sprints.map((s) => [
                  s.id,
                  stories.filter((x) => x.sprintId === s.id),
                ]),
              )}
            />
          );
        else
          content = (
            <BoardView
              {...common}
              columns={columns.map((c) => ({
                ...c,
                stories: activeId
                  ? stories.filter(
                      (s) => s.columnId === c.id && s.sprintId === activeId,
                    )
                  : [],
              }))}
            />
          );
      }
    }
    return { user: { ...user, name: nameOf(user) }, content };
  }, [data, pathname, t]);
  return (
    <I18nProvider locale={locale} dict={DICTIONARIES[locale]}>
      <AppShellLayout user={view.user}>
        <DemoTools />
        {view.content}
      </AppShellLayout>
    </I18nProvider>
  );
}
