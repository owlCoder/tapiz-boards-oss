"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  FieldLabel,
  FormError,
  Input,
  PageHeader,
  Plus,
  Select,
  UserMinus,
  UserPlus,
  useToast,
} from "@tapizlabs/ui";
import type { UserDto } from "@/domain/types";
import { fullName } from "@/domain/types";
import {
  adminDeleteUserAction,
  adminSetPasswordAction,
  adminUpdateUserAction,
  createUserAction,
  setUserActiveAction,
} from "@/lib/actions/admin.actions";
import { useI18n } from "@/i18n/I18nProvider";
import { SidePanel } from "@/components/layout/SidePanel";

interface AdminUsersViewProps {
  users: UserDto[];
  currentUserId: string;
}

export function AdminUsersView({ users, currentUserId }: AdminUsersViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { dict } = useI18n();
  const t = dict.admin;

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "member" as "admin" | "member" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editing, setEditing] = useState<UserDto | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [resetting, setResetting] = useState<UserDto | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [deleting, setDeleting] = useState<UserDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openEdit = (user: UserDto) => {
    setEditing(user);
    setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    setEditError(null);
  };

  const handleCreate = async () => {
    setCreateError(null);
    setCreateLoading(true);
    const result = await createUserAction(createForm);
    setCreateLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setCreateOpen(false);
    setCreateForm({ firstName: "", lastName: "", email: "", password: "", role: "member" });
    showToast(t.userCreated, true);
    router.refresh();
  };

  const handleEdit = async () => {
    if (!editing) return;
    setEditError(null);
    setEditLoading(true);
    const result = await adminUpdateUserAction(editing.id, editForm);
    setEditLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditing(null);
    router.refresh();
  };

  const handleResetPassword = async () => {
    if (!resetting) return;
    setResetError(null);
    setResetLoading(true);
    const result = await adminSetPasswordAction(resetting.id, { newPassword });
    setResetLoading(false);
    if (!result.ok) {
      setResetError(result.error);
      return;
    }
    setResetting(null);
    setNewPassword("");
    showToast(t.passwordReset, true);
  };

  const toggleActive = async (user: UserDto) => {
    const result = await setUserActiveAction(user.id, !user.isActive);
    showToast(result.ok ? (user.isActive ? t.userDeactivated : t.userActivated) : result.error, result.ok);
    if (result.ok) router.refresh();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteError(null);
    setDeleteLoading(true);
    const result = await adminDeleteUserAction(deleting.id);
    setDeleteLoading(false);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setDeleting(null);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.title}
        subtitle={t.description}
        variant="enterprise"
        action={
          <Button size="sm" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>
            {t.newUser}
          </Button>
        }
      />

      <ul className="divide-y divide-(--tapiz-border-subtle) overflow-hidden rounded-xl border border-(--tapiz-border-subtle) bg-(--tapiz-bg-surface)">
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Avatar name={fullName(user)} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName(user)}</p>
              <p className="truncate text-xs text-(--tapiz-text-muted)">{user.email}</p>
            </div>
            <Badge variant={user.role === "admin" ? "info" : "muted"}>
              {user.role === "admin" ? t.roleAdmin : t.roleMember}
            </Badge>
            <Badge variant={user.isActive ? "success" : "danger"}>
              {user.isActive ? t.active : t.inactive}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => openEdit(user)}>
              {dict.common.edit}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setResetting(user)}>
              {t.resetPassword}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={user.id === currentUserId}
              onClick={() => void toggleActive(user)}
            >
              {user.isActive ? t.deactivate : t.activate}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              icon={<UserMinus size={14} />}
              disabled={user.id === currentUserId}
              onClick={() => setDeleting(user)}
            >
              {dict.common.remove}
            </Button>
          </li>
        ))}
      </ul>

      <SidePanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.newUser}
        icon={<UserPlus size={18} />}
        footer={
          <Button fullWidth loading={createLoading} onClick={() => void handleCreate()}>
            {dict.common.create}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="admin-first">{t.firstName}</FieldLabel>
            <Input id="admin-first" value={createForm.firstName} onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="admin-last">{t.lastName}</FieldLabel>
            <Input id="admin-last" value={createForm.lastName} onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="admin-email">{t.email}</FieldLabel>
            <Input id="admin-email" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="admin-password">{t.password}</FieldLabel>
            <Input id="admin-password" type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="admin-role">{t.role}</FieldLabel>
            <Select
              id="admin-role"
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as "admin" | "member" }))}
            >
              <option value="member">{t.roleMember}</option>
              <option value="admin">{t.roleAdmin}</option>
            </Select>
          </div>
          <FormError message={createError} />
        </div>
      </SidePanel>

      <SidePanel
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t.editUser}
        footer={
          <Button fullWidth loading={editLoading} onClick={() => void handleEdit()}>
            {dict.common.save}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="edit-first">{t.firstName}</FieldLabel>
            <Input id="edit-first" value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="edit-last">{t.lastName}</FieldLabel>
            <Input id="edit-last" value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div>
            <FieldLabel htmlFor="edit-email">{t.email}</FieldLabel>
            <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <FormError message={editError} />
        </div>
      </SidePanel>

      <SidePanel
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title={t.resetPassword}
        footer={
          <Button fullWidth loading={resetLoading} onClick={() => void handleResetPassword()}>
            {dict.common.save}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="new-password">{t.newPassword}</FieldLabel>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <FormError message={resetError} />
        </div>
      </SidePanel>

      <ConfirmDialog
        open={deleting !== null}
        title={t.confirmDeleteTitle}
        description={deleteError ?? t.confirmDeleteDescription}
        confirmLabel={dict.common.remove}
        cancelLabel={dict.common.cancel}
        danger
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          setDeleting(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
