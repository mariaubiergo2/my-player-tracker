"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@prisma/client";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAssignmentsData,
  updateTrainerAssignments,
} from "@/actions/users";
import { useTranslation } from "@/components/LanguageProvider";
import PageContainer from "@/components/ui/PageContainer";
import SegmentedTabs from "@/components/ui/SegmentedTabs";

interface UserListItem {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  phone: string | null;
  birthDate: string | null;
  avatarUrl: string | null;
  createdAt: string;
  trainerSpecialty?: string | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  // Tab control
  const [activeTab, setActiveTab] = useState<"directory" | "assignments">("directory");

  // Assignments state
  const [trainers, setTrainers] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [initialPlayerIds, setInitialPlayerIds] = useState<string[]>([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Fetch assignments data
  const fetchAssignmentsData = async () => {
    setLoadingAssignments(true);
    try {
      const res = await getAssignmentsData();
      if (res.success && res.trainers && res.players) {
        setTrainers(res.trainers);
        setAllPlayers(res.players);
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assignments") {
      fetchAssignmentsData();
      setSelectedTrainerId(null);
      setSelectedPlayerIds([]);
      setInitialPlayerIds([]);
    }
  }, [activeTab]);

  const handleSelectTrainer = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    const trainer = trainers.find((t) => t.id === trainerId);
    if (trainer) {
      setSelectedPlayerIds(trainer.assignedPlayerIds || []);
      setInitialPlayerIds(trainer.assignedPlayerIds || []);
    } else {
      setSelectedPlayerIds([]);
      setInitialPlayerIds([]);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedTrainerId) return;
    setSavingAssignments(true);

    const toAssign = selectedPlayerIds.filter((id) => !initialPlayerIds.includes(id));
    const toUnassign = initialPlayerIds.filter((id) => !selectedPlayerIds.includes(id));

    try {
      const res = await updateTrainerAssignments(selectedTrainerId, toAssign, toUnassign);
      if (res.success) {
        showSuccess(t("admin_users.assignments_save_success") || "Trainer assignments successfully updated.");
        
        // Re-fetch assignments data to get fresh counts and relation state
        await fetchAssignmentsData();
        
        // Sync local states
        const newAssigned = selectedPlayerIds;
        setInitialPlayerIds(newAssigned);
        
        // Update local trainers state
        setTrainers((prev) =>
          prev.map((t) =>
            t.id === selectedTrainerId
              ? { ...t, playerCount: newAssigned.length, assignedPlayerIds: newAssigned }
              : t
          )
        );
      } else {
        showError(res.error || t("admin_users.assignments_save_error") || "Failed to update assignments.");
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setSavingAssignments(false);
    }
  };

  const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId);

  // Check if there are any differences
  const hasChanges =
    selectedPlayerIds.length !== initialPlayerIds.length ||
    selectedPlayerIds.some((id) => !initialPlayerIds.includes(id));

  // Filter players by query
  const filteredPlayersList = allPlayers.filter((p) => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase();
    const email = p.email ? p.email.toLowerCase() : "";
    const query = playerSearchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Sorting state for trainers list
  const [trainerSortBy, setTrainerSortBy] = useState<"name" | "count">("name");

  // Sorted trainers list
  const sortedTrainersList = [...trainers].sort((a, b) => {
    if (trainerSortBy === "count") {
      return b.playerCount - a.playerCount; // descending (most assigned first)
    } else {
      const nameA = `${a.name} ${a.surname}`.toLowerCase();
      const nameB = `${b.name} ${b.surname}`.toLowerCase();
      return nameA.localeCompare(nameB); // ascending (A-Z)
    }
  });
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Dynamic resizable and reorderable columns state
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "name",
    "email",
    "role",
    "phone",
    "birth",
    "registered"
  ]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 200,
    email: 200,
    role: 150,
    phone: 130,
    birth: 120,
    registered: 120
  });

  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Column reordering handlers (HTML5 Drag and Drop)
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    if (isResizing) {
      e.preventDefault();
      return;
    }
    setDraggedColId(colId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;

    const dragIndex = columnOrder.indexOf(draggedColId);
    const targetIndex = columnOrder.indexOf(targetColId);

    const newOrder = [...columnOrder];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColId);

    setColumnOrder(newOrder);
    setDraggedColId(null);
  };

  // Column resizing handler (Mousedown/Mousemove events)
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = columnWidths[colId];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(90, startWidth + deltaX); // min 90px
      setColumnWidths((prev) => ({
        ...prev,
        [colId]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Helper translations for headers
  const getColLabel = (colId: string) => {
    switch (colId) {
      case "name":
        return t("admin_users.table_name");
      case "email":
        return t("admin_users.table_email");
      case "role":
        return t("admin_users.table_role");
      case "phone":
        return t("admin_users.table_phone");
      case "birth":
        return t("admin_users.table_birth");
      case "registered":
        return t("admin_users.table_registered");
      default:
        return "";
    }
  };

  // Helper responsive classes for columns
  const getColClass = (colId: string) => {
    switch (colId) {
      case "phone":
        return "hidden lg:table-cell";
      case "birth":
        return "hidden md:table-cell";
      case "registered":
        return "hidden xl:table-cell";
      default:
        return "";
    }
  };

  // Modal control states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    role: "PLAYER" as UserRole,
    phone: "",
    birthDate: "",
    password: "",
    trainerSpecialty: "",
  });

  // Client-side authentication check
  // Utility to show temporary message banners
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 5000);
  };

  // Fetch all users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsers();
      if (res.success && res.users) {
        // Map Dates from action correctly
        const mappedUsers = (res.users as any[]).map((u) => ({
          ...u,
          birthDate: u.birthDate ? new Date(u.birthDate).toISOString().split("T")[0] : null,
          createdAt: new Date(u.createdAt).toLocaleDateString(),
        }));
        setUsers(mappedUsers);
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchUsers();
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Open Edit Modal with selected user details loaded
  const handleOpenEdit = (userItem: UserListItem) => {
    setSelectedUser(userItem);
    setFormData({
      name: userItem.name,
      surname: userItem.surname,
      email: userItem.email,
      role: userItem.role,
      phone: userItem.phone || "",
      birthDate: userItem.birthDate || "",
      password: "", // password is not edited here
      trainerSpecialty: userItem.trainerSpecialty || "",
    });
    setIsEditOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      surname: "",
      email: "",
      role: "PLAYER",
      phone: "",
      birthDate: "",
      password: "",
      trainerSpecialty: "",
    });
    setIsCreateOpen(true);
  };

  // Open Delete Confirmation Dialog
  const handleOpenDelete = (userItem: UserListItem) => {
    setSelectedUser(userItem);
    setIsDeleteOpen(true);
  };

  // Submit new user details
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage("");
    try {
      const res = await createUser({
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || undefined,
        birthDate: formData.birthDate || undefined,
        password: formData.password || undefined,
        trainerSpecialty: formData.role === "TRAINER" ? formData.trainerSpecialty : undefined,
      });

      if (res.success) {
        showSuccess(t("admin_users.success_create"));
        setIsCreateOpen(false);
        fetchUsers();
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setActionLoading(false);
    }
  };

  // Submit edited user details
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setErrorMessage("");
    try {
      const res = await updateUser(selectedUser.id, {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        birthDate: formData.birthDate,
        trainerSpecialty: formData.role === "TRAINER" ? formData.trainerSpecialty : null,
      });

      if (res.success) {
        showSuccess(t("admin_users.success_update"));
        setIsEditOpen(false);
        fetchUsers();
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setErrorMessage("");
    try {
      const res = await deleteUser(selectedUser.id);
      if (res.success) {
        showSuccess(t("admin_users.success_delete"));
        setIsDeleteOpen(false);
        fetchUsers();
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    } finally {
      setActionLoading(false);
    }
  };

  // Inline role modification (Quick action dropdown inside table row)
  const handleRoleChange = async (userId: string, newRole: UserRole, currentName: string) => {
    try {
      const res = await updateUser(userId, { role: newRole });
      if (res.success) {
        const localizedRole =
          newRole === "PLAYER"
            ? t("common.role_player")
            : newRole === "GOAL_KEEPER"
            ? t("common.role_goal_keeper")
            : newRole === "TRAINER"
            ? t("common.role_trainer")
            : t("common.role_admin");
        showSuccess(t("admin_users.success_role", { name: currentName, role: localizedRole }));
        // Locally update role in state to avoid full table redraws
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        showError(res.error || t("common.error"));
      }
    } catch (err) {
      console.error(err);
      showError(t("common.error"));
    }
  };

  // Filters logic
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.name} ${u.surname}`.toLowerCase();
    const email = u.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "badge badge-error gap-1 font-semibold";
      case "TRAINER":
        return "badge badge-info gap-1 font-semibold text-white";
      case "PLAYER":
      case "GOAL_KEEPER":
        return "badge badge-success gap-1 font-semibold text-white";
      default:
        return "badge badge-ghost";
    }
  };


  if (isLoading || loadingUsers) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/60 font-medium">{t("admin_users.loading_users")}</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return null; // Let useEffect handle redirect
  }

  return (
    <PageContainer className="py-10">
      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success shadow-lg mb-6 border border-success/20 animate-fade-in">
          <div>
            <span>✅ {successMessage}</span>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error shadow-lg mb-6 border border-error/20 animate-fade-in">
          <div>
            <span>❌ {errorMessage}</span>
          </div>
        </div>
      )}
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("admin_users.title")}
          </h1>
          <p className="text-base-content/70 mt-2">
            {t("admin_users.subtitle")}
          </p>
        </div>
        {activeTab === "directory" && (
          <button onClick={handleOpenCreate} className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all">
            + {t("admin_users.create_btn")}
          </button>
        )}
      </div>

      {/* Tabs */}
      <SegmentedTabs
        tabs={[
          { id: "directory", label: t("admin_users.tab_directory") || "User Directory" },
          { id: "assignments", label: t("admin_users.tab_assignments") || "Assignments" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === "directory" ? (
        <div className="animate-fade-in space-y-8">
          {/* Control Filter Bar */}
          <div className="card bg-base-100 shadow-md border border-base-200 mb-8">
            <div className="card-body py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="form-control w-full md:max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("admin_users.search_placeholder")}
                    className="input input-bordered w-full pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="absolute left-3 top-3.5 text-base-content/50">🔍</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto items-center justify-end">
                <span className="text-sm font-semibold text-base-content/70 whitespace-nowrap">{t("admin_users.filter_role")}:</span>
                <select
                  className="select select-bordered w-full md:w-auto min-w-[150px]"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL" className="bg-base-100 text-base-content">{t("admin_users.all_roles")}</option>
                  <option value="ADMIN" className="bg-base-100 text-base-content">{t("admin_users.admins")}</option>
                  <option value="TRAINER" className="bg-base-100 text-base-content">{t("admin_users.trainers")}</option>
                  <option value="PLAYER" className="bg-base-100 text-base-content">{t("admin_users.players")}</option>
                  <option value="GOAL_KEEPER" className="bg-base-100 text-base-content">{t("common.role_goal_keeper")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Directory Table */}
          {filteredUsers.length === 0 ? (
            <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
              <div className="max-w-md">
                <span className="text-5xl">👥</span>
                <h3 className="text-2xl font-bold mt-4">{t("admin_users.no_users")}</h3>
                <p className="py-2 text-base-content/60">
                  {t("admin_users.adjust_filter")}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto card bg-base-100 shadow-xl border border-base-200">
              <table className="table table-zebra w-full" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr className="bg-base-200/50">
                    {columnOrder.map((colId) => (
                      <th
                        key={colId}
                        style={{ width: columnWidths[colId] }}
                        className={`relative p-0 select-none group border-r border-base-content/10 last:border-0 ${getColClass(colId)}`}
                      >
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, colId)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, colId)}
                          className="px-4 py-3 cursor-move flex items-center justify-between font-bold text-xs uppercase text-base-content/70 hover:bg-base-200/50 active:bg-base-200 transition-colors"
                          title={t("admin_users.drag_reorder") || "Drag to reorder / Arrastra para reordenar"}
                        >
                          <span className="truncate">{getColLabel(colId)}</span>
                          <span className="opacity-0 group-hover:opacity-40 text-[10px] ml-1 select-none pointer-events-none">⋮⋮</span>
                        </div>
                        {/* Resizer Handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(e, colId)}
                          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary z-20"
                        />
                      </th>
                    ))}
                    {/* Actions column remains fixed at the end */}
                    <th className="text-right px-4 py-3 w-[120px] font-bold text-xs uppercase text-base-content/70">
                      {t("admin_users.table_actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                      {columnOrder.map((colId) => {
                        if (colId === "name") {
                          return (
                            <td key="name" className="px-4 py-3 font-medium max-w-xs truncate">
                              <div className="flex items-center gap-3">
                                <div className={`avatar placeholder ${u.avatarUrl ? "" : "bg-neutral text-neutral-content"} rounded-full w-9 h-9 flex items-center justify-center overflow-hidden shrink-0`}>
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-semibold">
                                      {u.name.charAt(0).toUpperCase()}
                                      {u.surname.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-base-content truncate">
                                    {u.name} {u.surname}
                                  </div>
                                  <div className="text-xs text-base-content/50 lg:hidden truncate">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        }
                        if (colId === "email") {
                          return (
                            <td key="email" className="px-4 py-3 text-sm font-medium text-base-content/85 max-w-xs truncate">
                              {u.email}
                            </td>
                          );
                        }
                        if (colId === "role") {
                          const isDisabled = u.id === user.id;
                          return (
                            <td key="role" className="px-4 py-3 text-sm">
                              <div className="dropdown dropdown-bottom dropdown-end">
                                <div
                                  tabIndex={isDisabled ? undefined : 0}
                                  role={isDisabled ? undefined : "button"}
                                  className={`${getRoleBadgeClass(u.role)} gap-1 flex items-center pr-2.5 pl-2.5 h-6 rounded-full text-xs font-semibold text-white select-none ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"}`}
                                  title={isDisabled ? t("admin_users.cannot_demote_self") : t("admin_users.modify_role")}
                                >
                                  <span>
                                    {u.role === "PLAYER" && t("common.role_player")}
                                    {u.role === "GOAL_KEEPER" && t("common.role_goal_keeper")}
                                    {u.role === "TRAINER" && t("common.role_trainer")}
                                    {u.role === "ADMIN" && "Admin"}
                                  </span>
                                  {!isDisabled && <span className="text-[9px] opacity-80 ml-0.5">▼</span>}
                                </div>
                                {!isDisabled && (
                                  <ul
                                    tabIndex={0}
                                    className="dropdown-content menu p-1.5 shadow-xl bg-base-100 border border-base-300 rounded-lg w-40 z-50 text-xs text-base-content"
                                  >
                                    <li>
                                      <button
                                        onClick={() => {
                                          handleRoleChange(u.id, "PLAYER", u.name);
                                          (document.activeElement as HTMLElement)?.blur();
                                        }}
                                        className={`py-1.5 px-3 rounded text-left ${u.role === "PLAYER" ? "bg-primary text-primary-content font-semibold" : "hover:bg-base-200"}`}
                                      >
                                        {t("common.role_player")}
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          handleRoleChange(u.id, "GOAL_KEEPER", u.name);
                                          (document.activeElement as HTMLElement)?.blur();
                                        }}
                                        className={`py-1.5 px-3 rounded text-left ${u.role === "GOAL_KEEPER" ? "bg-primary text-primary-content font-semibold" : "hover:bg-base-200"}`}
                                      >
                                        {t("common.role_goal_keeper")}
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          handleRoleChange(u.id, "TRAINER", u.name);
                                          (document.activeElement as HTMLElement)?.blur();
                                        }}
                                        className={`py-1.5 px-3 rounded text-left ${u.role === "TRAINER" ? "bg-primary text-primary-content font-semibold" : "hover:bg-base-200"}`}
                                      >
                                        {t("common.role_trainer")}
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          handleRoleChange(u.id, "ADMIN", u.name);
                                          (document.activeElement as HTMLElement)?.blur();
                                        }}
                                        className={`py-1.5 px-3 rounded text-left ${u.role === "ADMIN" ? "bg-primary text-primary-content font-semibold" : "hover:bg-base-200"}`}
                                      >
                                        {t("common.role_admin")}
                                      </button>
                                    </li>
                                  </ul>
                                )}
                              </div>
                            </td>
                          );
                        }
                        if (colId === "phone") {
                          return (
                            <td key="phone" className={`px-4 py-3 text-sm text-base-content/75 truncate ${getColClass(colId)}`}>
                              {u.phone || <span className="text-base-content/30 italic">{t("common.not_specified")}</span>}
                            </td>
                          );
                        }
                        if (colId === "birth") {
                          return (
                            <td key="birth" className={`px-4 py-3 text-sm text-base-content/75 truncate ${getColClass(colId)}`}>
                              {u.birthDate || <span className="text-base-content/30 italic">{t("common.not_specified")}</span>}
                            </td>
                          );
                        }
                        if (colId === "registered") {
                          return (
                            <td key="registered" className={`px-4 py-3 text-sm text-base-content/50 truncate ${getColClass(colId)}`}>
                              {u.createdAt}
                            </td>
                          );
                        }
                        return null;
                      })}
                      {/* Actions column remains fixed at the end */}
                      <td className="px-4 py-3 text-right w-[120px]">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                            title={t("common.edit")}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                            disabled={u.id === user.id}
                            title={u.id === user.id ? "Cannot delete yourself" : t("common.delete")}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Assignments Section */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Trainers List Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="card bg-base-100 shadow-md border border-base-200 p-6">
              <h3 className="font-bold text-xl mb-1 text-base-content">
                {t("admin_users.assignments_trainer_title") || "Trainers"}
              </h3>
              <p className="text-sm text-base-content/60 mb-6">
                {t("admin_users.assignments_trainer_subtitle") || "Select a trainer to manage their assigned players."}
              </p>

              {loadingAssignments ? (
                <div className="flex justify-center items-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : trainers.length === 0 ? (
                <div className="text-center py-8 text-base-content/50">
                  {t("admin_users.assignments_no_trainers") || "No trainers found."}
                </div>
              ) : (
                <>
                  {/* Sorting Controls */}
                  <div className="flex items-center gap-2 mb-4 p-2 bg-base-200/40 rounded-lg text-xs w-fit select-none">
                    <span className="font-semibold text-base-content/60">
                      {t("admin_users.assignments_sort_label") || "Sort by:"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTrainerSortBy("name")}
                        className={`px-2 py-1 rounded transition-colors ${
                          trainerSortBy === "name"
                            ? "bg-primary text-primary-content font-semibold"
                            : "hover:bg-base-200 text-base-content/70"
                        }`}
                      >
                        {t("admin_users.assignments_sort_by_name") || "Name"}
                      </button>
                      <button
                        onClick={() => setTrainerSortBy("count")}
                        className={`px-2 py-1 rounded transition-colors ${
                          trainerSortBy === "count"
                            ? "bg-primary text-primary-content font-semibold"
                            : "hover:bg-base-200 text-base-content/70"
                        }`}
                      >
                        {t("admin_users.assignments_sort_by_count") || "No. of Players"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {sortedTrainersList.map((trainer) => (
                      <div
                        key={trainer.id}
                        onClick={() => handleSelectTrainer(trainer.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          selectedTrainerId === trainer.id
                            ? "bg-primary/10 border-primary/50 shadow-sm font-semibold"
                            : "bg-base-100 border-base-200 hover:bg-base-200/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`avatar placeholder ${trainer.avatarUrl ? "" : "bg-neutral text-neutral-content"} rounded-full w-10 h-10 flex items-center justify-center overflow-hidden shrink-0`}>
                            {trainer.avatarUrl ? (
                              <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-semibold">
                                {trainer.name.charAt(0).toUpperCase()}
                                {trainer.surname.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-base-content truncate group-hover:text-primary transition-colors">
                              {trainer.name} {trainer.surname}
                            </div>
                            <div className="text-xs text-base-content/50 truncate">
                              {trainer.email}
                            </div>
                          </div>
                        </div>
                        <div className="badge badge-neutral text-xs font-semibold shrink-0">
                          {trainer.playerCount}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Players Checklist Panel */}
          <div className="lg:col-span-7">
            {selectedTrainer ? (
              <div className="card bg-base-100 shadow-md border border-base-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-200 pb-4">
                  <div>
                    <h3 className="font-bold text-xl text-base-content">
                      {t("admin_users.assignments_players_title", { trainerName: `${selectedTrainer.name} ${selectedTrainer.surname}` })}
                    </h3>
                    <p className="text-sm text-base-content/60">
                      {t("admin_users.assignments_count", { count: selectedPlayerIds.length })}
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAssignments}
                    disabled={savingAssignments || !hasChanges}
                    className="btn btn-primary btn-sm shadow-md hover:scale-105 active:scale-95 transition-all"
                  >
                    {savingAssignments ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        {t("admin_users.assignments_saving") || "Saving..."}
                      </>
                    ) : (
                      t("admin_users.assignments_save_btn") || "Save Changes"
                    )}
                  </button>
                </div>

                {/* Filter Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("admin_users.assignments_search_players") || "Search players..."}
                    className="input input-bordered input-sm w-full pl-8"
                    value={playerSearchQuery}
                    onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  />
                  <span className="absolute left-2.5 top-2 text-base-content/50 text-sm">🔍</span>
                </div>

                {/* Players Checklist */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {filteredPlayersList.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">
                      {t("admin_users.assignments_no_players") || "No players found."}
                    </div>
                  ) : (
                    filteredPlayersList.map((player) => {
                      const isChecked = selectedPlayerIds.includes(player.id);
                      return (
                        <label
                          key={player.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-base-200 hover:bg-base-200/30 cursor-pointer transition-all select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm rounded"
                              checked={isChecked}
                              onChange={() => handleTogglePlayer(player.id)}
                            />
                            <div className={`avatar placeholder ${player.avatarUrl ? "" : "bg-neutral text-neutral-content"} rounded-full w-8 h-8 flex items-center justify-center overflow-hidden shrink-0`}>
                              {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-semibold">
                                  {player.name.charAt(0).toUpperCase()}
                                  {player.surname.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-base-content truncate">
                                {player.name} {player.surname}
                              </div>
                              <div className="text-xs text-base-content/50 truncate">
                                {player.email}
                              </div>
                              {(() => {
                                const otherTrainers = player.trainers?.filter((tr: any) => tr.id !== selectedTrainerId) || [];
                                if (otherTrainers.length > 0) {
                                  return (
                                    <div className="text-[10px] text-base-content/40 mt-0.5 truncate">
                                      {t("admin_users.assignments_also_assigned_to", {
                                        names: otherTrainers.map((tr: any) => `${tr.name} ${tr.surname}`).join(", ")
                                      })}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="card bg-base-100 shadow-md border border-base-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[350px]">
                <span className="text-5xl mb-4 block animate-bounce">📋</span>
                <h4 className="font-bold text-lg text-base-content/60 max-w-sm">
                  {t("admin_users.assignments_trainer_subtitle") || "Select a trainer to manage their assigned players."}
                </h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg border border-base-content/10 shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-bold text-2xl text-primary mb-6">{t("admin_users.create_title")}</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.first_name")}</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder={t("admin_users.table_name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.surname")}</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder={t("admin_users.surname").replace(" *", "")}
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("admin_users.email")}</span>
                </label>
                <input
                  type="email"
                  required
                  className="input input-bordered w-full"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.role")}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value="PLAYER" className="bg-base-100 text-base-content">{t("common.role_player")}</option>
                    <option value="GOAL_KEEPER" className="bg-base-100 text-base-content">{t("common.role_goal_keeper")}</option>
                    <option value="TRAINER" className="bg-base-100 text-base-content">{t("common.role_trainer")}</option>
                    <option value="ADMIN" className="bg-base-100 text-base-content">{t("common.role_admin")}</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.phone")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {formData.role === "TRAINER" && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Especialitat del Trainer</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.trainerSpecialty}
                    onChange={(e) => setFormData({ ...formData, trainerSpecialty: e.target.value })}
                  >
                    <option value="">Sense especialitat / Buit</option>
                    <option value="VIDEO_ANALYSIS">Anàlisi de Vídeo (VIDEO_ANALYSIS)</option>
                    <option value="PHYSICAL_PREP">Preparació Física (PHYSICAL_PREP)</option>
                    <option value="NUTRITION">Nutrició (NUTRITION)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.birth_date")}</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.password")}</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input input-bordered w-full"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-ghost"
                  disabled={actionLoading}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("admin_users.create_btn")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg border border-base-content/10 shadow-2xl relative">
            <button
              onClick={() => setIsEditOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="font-bold text-2xl text-primary mb-6">{t("admin_users.edit_title")}</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.first_name")}</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder={t("admin_users.table_name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.surname")}</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder={t("admin_users.surname").replace(" *", "")}
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("admin_users.email")}</span>
                </label>
                <input
                  type="email"
                  required
                  className="input input-bordered w-full"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.role")}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    disabled={selectedUser.id === user.id} // prevent demoting self
                    title={selectedUser.id === user.id ? t("admin_users.cannot_demote_self") : t("admin_users.modify_role")}
                  >
                    <option value="PLAYER" className="bg-base-100 text-base-content">{t("common.role_player")}</option>
                    <option value="GOAL_KEEPER" className="bg-base-100 text-base-content">{t("common.role_goal_keeper")}</option>
                    <option value="TRAINER" className="bg-base-100 text-base-content">{t("common.role_trainer")}</option>
                    <option value="ADMIN" className="bg-base-100 text-base-content">{t("common.role_admin")}</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">{t("admin_users.phone")}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="+34 600 000 000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              {formData.role === "TRAINER" && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Especialitat del Trainer</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.trainerSpecialty}
                    onChange={(e) => setFormData({ ...formData, trainerSpecialty: e.target.value })}
                  >
                    <option value="">Sense especialitat / Buit</option>
                    <option value="VIDEO_ANALYSIS">Anàlisi de Vídeo (VIDEO_ANALYSIS)</option>
                    <option value="PHYSICAL_PREP">Preparació Física (PHYSICAL_PREP)</option>
                    <option value="NUTRITION">Nutrició (NUTRITION)</option>
                  </select>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">{t("admin_users.birth_date")}</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="modal-action mt-8">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="btn btn-ghost"
                  disabled={actionLoading}
                >
                  {t("common.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    t("common.save")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box border-2 border-error/20 shadow-2xl">
            <h3 className="font-extrabold text-2xl text-error mb-4">{t("admin_users.delete_title")}</h3>
            <p className="py-2 text-base-content/80">
              {t("admin_users.delete_confirm_text")}{" "}
              <strong className="text-base-content font-bold">
                {selectedUser.name} {selectedUser.surname}
              </strong>{" "}
              ({selectedUser.email})?
            </p>
            
            <div className="alert alert-warning mt-4 text-xs font-semibold py-3 border border-warning/20">
              <div>
                <span>
                  {t("admin_users.delete_warning")}
                </span>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn btn-ghost"
                disabled={actionLoading}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="btn btn-error text-white"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  t("admin_users.delete_btn")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
