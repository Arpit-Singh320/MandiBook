"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Search,
  Users,
  Wheat,
  Building2,
  Shield,
  Loader2,
  CheckCircle2,
  Ban,
  UserPlus,
  Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mandiApi, userApi, type MandiData, type UserData } from "@/lib/data-api";

type RoleFilter = "all" | "farmer" | "manager" | "admin";

type ManagerFormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  mandiId: string;
  designation: string;
};

type AdminFormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  twoFactorEnabled: boolean;
};

const roleConfig: Record<string, { icon: typeof Users; color: string; label: string }> = {
  farmer: { icon: Wheat, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Farmer" },
  manager: { icon: Building2, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Manager" },
  admin: { icon: Shield, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Admin" },
};

const initialManagerForm: ManagerFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  mandiId: "",
  designation: "Mandi Manager",
};

const initialAdminForm: AdminFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  department: "Platform Operations",
  twoFactorEnabled: true,
};

const formatJoinedDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const buildUserLocation = (user: UserData, mandiMap: Map<string, MandiData>) => {
  const pieces = [user.village, user.district, user.state].filter(Boolean);
  if (pieces.length > 0) return pieces.join(", ");
  if (user.role === "manager" && user.mandiId && mandiMap.has(user.mandiId)) return mandiMap.get(user.mandiId)?.name || "Assigned mandi";
  if (user.designation) return user.designation;
  if (user.department) return user.department;
  return "Location unavailable";
};

const buildManagerPayload = (formState: ManagerFormState) => {
  const payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    mandiId?: string;
    designation?: string;
  } = {
    name: formState.name.trim(),
    email: formState.email.trim(),
    password: formState.password,
  };

  if (formState.phone.trim()) payload.phone = formState.phone.trim();
  if (formState.mandiId.trim()) payload.mandiId = formState.mandiId.trim();
  if (formState.designation.trim()) payload.designation = formState.designation.trim();

  return payload;
};

const buildAdminPayload = (formState: AdminFormState) => {
  const payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    department?: string;
    twoFactorEnabled?: boolean;
  } = {
    name: formState.name.trim(),
    email: formState.email.trim(),
    password: formState.password,
    twoFactorEnabled: formState.twoFactorEnabled,
  };

  if (formState.phone.trim()) payload.phone = formState.phone.trim();
  if (formState.department.trim()) payload.department = formState.department.trim();

  return payload;
};

const buildAssignmentPayload = (mandiId: string, designation: string) => {
  const payload: {
    mandiId?: string;
    designation?: string;
  } = {};

  if (mandiId.trim()) payload.mandiId = mandiId.trim();
  if (designation.trim()) payload.designation = designation.trim();

  return payload;
};

export function AdminUsersManagement() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [mandis, setMandis] = useState<MandiData[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [assignmentUserId, setAssignmentUserId] = useState<string | null>(null);
  const [creatingManager, setCreatingManager] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [managerForm, setManagerForm] = useState<ManagerFormState>(initialManagerForm);
  const [adminForm, setAdminForm] = useState<AdminFormState>(initialAdminForm);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});
  const [designationDrafts, setDesignationDrafts] = useState<Record<string, string>>({});

  const mandiMap = useMemo(() => new Map(mandis.map((mandi) => [mandi.id, mandi])), [mandis]);

  const loadUsers = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const params: { role?: string; search?: string; limit?: number } = { limit: 100 };
      if (filter !== "all") params.role = filter;
      if (search) params.search = search;
      const response = await userApi.list(token, params);
      setUsers(response.data);
      setCounts(response.counts || {});
      setTotal(response.total || response.data.length);
      setAssignmentDrafts(
        response.data.reduce<Record<string, string>>((acc, user) => {
          if (user.role === "manager") acc[user.id] = user.mandiId || "";
          return acc;
        }, {}),
      );
      setDesignationDrafts(
        response.data.reduce<Record<string, string>>((acc, user) => {
          if (user.role === "manager") acc[user.id] = user.designation || "";
          return acc;
        }, {}),
      );
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filter, search, token]);

  useEffect(() => {
    if (!token) return;
    void loadUsers();
  }, [loadUsers, token]);

  useEffect(() => {
    const loadMandis = async () => {
      try {
        const response = await mandiApi.list();
        setMandis(response.data);
      } catch {
        setMandis([]);
      }
    };

    void loadMandis();
  }, []);

  const summaryCounts = useMemo(
    () => ({
      all: total,
      farmer: counts.farmer || 0,
      manager: counts.manager || 0,
      admin: counts.admin || 0,
    }),
    [counts, total],
  );

  const toggleStatus = async (user: UserData) => {
    if (!token) return;
    const nextStatus = user.status === "active" ? "suspended" : "active";
    setActionUserId(user.id);
    setError("");
    setSuccess("");
    try {
      const response = await userApi.updateStatus(token, user.id, nextStatus);
      setUsers((prev) => prev.map((entry) => (entry.id === user.id ? response.data : entry)));
      setSuccess(response.message || `User ${nextStatus}`);
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : "Failed to update user status");
    } finally {
      setActionUserId(null);
    }
  };

  const handleCreateManager = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setCreatingManager(true);
      setError("");
      setSuccess("");
      const response = await userApi.createManager(token, buildManagerPayload(managerForm));
      setManagerForm(initialManagerForm);
      setSuccess(response.message || "Manager created successfully");
      await loadUsers();
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : "Failed to create manager");
    } finally {
      setCreatingManager(false);
    }
  };

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setCreatingAdmin(true);
      setError("");
      setSuccess("");
      const response = await userApi.createAdmin(token, buildAdminPayload(adminForm));
      setAdminForm(initialAdminForm);
      setSuccess(response.message || "Admin created successfully");
      await loadUsers();
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleAssignManager = async (user: UserData) => {
    if (!token || user.role !== "manager") return;

    try {
      setAssignmentUserId(user.id);
      setError("");
      setSuccess("");
      const response = await userApi.assignManager(
        token,
        user.id,
        buildAssignmentPayload(assignmentDrafts[user.id] || "", designationDrafts[user.id] || ""),
      );
      setSuccess(response.message || "Manager assignment updated");
      await loadUsers();
    } catch (assignError: unknown) {
      setError(assignError instanceof Error ? assignError.message : "Failed to update manager assignment");
    } finally {
      setAssignmentUserId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">User Management</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">Create internal accounts, assign mandi managers, and control access for every user role.</p>
      </motion.div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} onSubmit={handleCreateManager} className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create manager account</h2>
              <p className="text-xs text-neutral-500">Create a mandi manager with email credentials and assign them to a mandi.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={managerForm.name} onChange={(e) => setManagerForm((current) => ({ ...current, name: e.target.value }))} required placeholder="Manager name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={managerForm.email} onChange={(e) => setManagerForm((current) => ({ ...current, email: e.target.value }))} required type="email" placeholder="manager@email.com" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={managerForm.password} onChange={(e) => setManagerForm((current) => ({ ...current, password: e.target.value }))} required placeholder="Temporary password" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={managerForm.phone} onChange={(e) => setManagerForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone (optional)" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <select value={managerForm.mandiId} onChange={(e) => setManagerForm((current) => ({ ...current, mandiId: e.target.value }))} className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
              <option value="">Assign mandi later</option>
              {mandis.map((mandi) => (
                <option key={mandi.id} value={mandi.id}>{mandi.name}</option>
              ))}
            </select>
            <input value={managerForm.designation} onChange={(e) => setManagerForm((current) => ({ ...current, designation: e.target.value }))} placeholder="Designation" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
          </div>
          <button type="submit" disabled={creatingManager} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
            {creatingManager ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {creatingManager ? "Creating manager..." : "Create manager"}
          </button>
        </motion.form>

        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleCreateAdmin} className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create admin account</h2>
              <p className="text-xs text-neutral-500">Provision a new platform admin with secure login credentials and 2FA support.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={adminForm.name} onChange={(e) => setAdminForm((current) => ({ ...current, name: e.target.value }))} required placeholder="Admin name" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={adminForm.email} onChange={(e) => setAdminForm((current) => ({ ...current, email: e.target.value }))} required type="email" placeholder="admin@email.com" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={adminForm.password} onChange={(e) => setAdminForm((current) => ({ ...current, password: e.target.value }))} required placeholder="Temporary password" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={adminForm.phone} onChange={(e) => setAdminForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone (optional)" className="px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <input value={adminForm.department} onChange={(e) => setAdminForm((current) => ({ ...current, department: e.target.value }))} placeholder="Department" className="sm:col-span-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
            <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300">
              <input type="checkbox" checked={adminForm.twoFactorEnabled} onChange={(e) => setAdminForm((current) => ({ ...current, twoFactorEnabled: e.target.checked }))} />
              Enable email-based 2FA for this admin
            </label>
          </div>
          <button type="submit" disabled={creatingAdmin} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 disabled:opacity-50">
            {creatingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {creatingAdmin ? "Creating admin..." : "Create admin"}
          </button>
        </motion.form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["all", "farmer", "manager", "admin"] as RoleFilter[]).map((role) => {
          const config = role === "all" ? { icon: Users, color: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300", label: "All Users" } : roleConfig[role]!;
          const Icon = config.icon;
          return (
            <button key={role} onClick={() => setFilter(role)} className={`bg-white dark:bg-neutral-900 rounded-xl border p-4 text-left transition-all ${filter === role ? "border-[var(--primary)] ring-2 ring-[var(--ring)]" : "border-[var(--border)]"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color} mb-2`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-neutral-900 dark:text-white">{summaryCounts[role]}</p>
              <p className="text-xs text-neutral-500">{config.label}</p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or location..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.2fr,0.8fr,1fr,1.1fr,1fr,0.9fr] gap-4 px-5 py-3 border-b border-[var(--border)] bg-neutral-50 dark:bg-neutral-800/50 text-xs font-medium text-neutral-500">
          <span>User</span>
          <span>Role</span>
          <span>Contact</span>
          <span>Assignment / Location</span>
          <span>Status / Joined</span>
          <span className="text-right">Actions</span>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {users.map((user) => {
            const rc = roleConfig[user.role]!;
            const Icon = rc.icon;
            const isManager = user.role === "manager";
            return (
              <div key={user.id} className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr,1fr,1.1fr,1fr,0.9fr] gap-4 items-start lg:items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${rc.color}`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email || user.phone || "—"}</p>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${rc.color}`}><Icon className="w-3 h-3" /> {rc.label}</span>
                </div>
                <div className="text-sm text-neutral-500 break-all">
                  {user.email || user.phone || "—"}
                </div>
                <div className="space-y-2">
                  {isManager ? (
                    <>
                      <select value={assignmentDrafts[user.id] || ""} onChange={(e) => setAssignmentDrafts((current) => ({ ...current, [user.id]: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
                        <option value="">Unassigned</option>
                        {mandis.map((mandi) => (
                          <option key={mandi.id} value={mandi.id}>{mandi.name}</option>
                        ))}
                      </select>
                      <input value={designationDrafts[user.id] || ""} onChange={(e) => setDesignationDrafts((current) => ({ ...current, [user.id]: e.target.value }))} placeholder="Designation" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--ring)]" />
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">{buildUserLocation(user, mandiMap)}</p>
                  )}
                </div>
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${user.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{user.status}</span>
                  <p className="mt-2 text-xs text-neutral-500">Joined {formatJoinedDate(user.createdAt)}</p>
                </div>
                <div className="flex flex-col lg:items-end gap-2">
                  {isManager ? (
                    <button type="button" onClick={() => void handleAssignManager(user)} disabled={assignmentUserId === user.id} className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50">
                      {assignmentUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save assignment
                    </button>
                  ) : null}
                  <button type="button" onClick={() => void toggleStatus(user)} disabled={actionUserId === user.id} className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50">
                    {actionUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                    {user.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
          {users.length === 0 ? <div className="px-6 py-12 text-center text-sm text-neutral-500">No users found matching your criteria.</div> : null}
        </div>
      </div>
    </div>
  );
}
