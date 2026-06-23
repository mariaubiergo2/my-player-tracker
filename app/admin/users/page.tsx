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
} from "@/actions/users";

interface UserListItem {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  phone: string | null;
  birthDate: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // State variables
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

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
  });

  // Client-side authentication check
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
        showError(res.error || "Failed to retrieve user directory.");
      }
    } catch (err) {
      console.error(err);
      showError("An unexpected error occurred while fetching users.");
    } finally {
      setLoadingUsers(false);
    }
  };

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
      });

      if (res.success) {
        showSuccess(`Successfully created user: ${formData.name}`);
        setIsCreateOpen(false);
        fetchUsers();
      } else {
        showError(res.error || "Failed to create user.");
      }
    } catch (err) {
      console.error(err);
      showError("Unexpected error occurred while creating user.");
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
      });

      if (res.success) {
        showSuccess(`Successfully updated profile of ${formData.name}`);
        setIsEditOpen(false);
        fetchUsers();
      } else {
        showError(res.error || "Failed to update user.");
      }
    } catch (err) {
      console.error(err);
      showError("Unexpected error occurred while updating user.");
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
        showSuccess("User account and all associated matches deleted.");
        setIsDeleteOpen(false);
        fetchUsers();
      } else {
        showError(res.error || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      showError("Unexpected error occurred during user deletion.");
    } finally {
      setActionLoading(false);
    }
  };

  // Inline role modification (Quick action dropdown inside table row)
  const handleRoleChange = async (userId: string, newRole: UserRole, currentName: string) => {
    try {
      const res = await updateUser(userId, { role: newRole });
      if (res.success) {
        showSuccess(`Updated role of ${currentName} to ${newRole}`);
        // Locally update role in state to avoid full table redraws
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        showError(res.error || "Failed to update user role.");
      }
    } catch (err) {
      console.error(err);
      showError("Failed to update user role.");
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
          <p className="text-base-content/60 font-medium">Loading user database...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return null; // Let useEffect handle redirect
  }

  return (
    <section className="container mx-auto px-6 py-10">
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
            User Management
          </h1>
          <p className="text-base-content/70 mt-2">
            Create, update roles, manage profiles, and delete platform users.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary shadow-md hover:scale-105 active:scale-95 transition-all">
          + Create User
        </button>
      </div>

      {/* Control Filter Bar */}
      <div className="card bg-base-100 shadow-md border border-base-200 mb-8">
        <div className="card-body py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="form-control w-full md:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="input input-bordered w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute left-3 top-3.5 text-base-content/50">🔍</span>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center justify-end">
            <span className="text-sm font-semibold text-base-content/70 whitespace-nowrap">Filter Role:</span>
            <select
              className="select select-bordered w-full md:w-auto min-w-[150px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrators</option>
              <option value="TRAINER">Trainers</option>
              <option value="PLAYER">Players</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      {filteredUsers.length === 0 ? (
        <div className="hero bg-base-200 rounded-2xl p-10 text-center shadow-inner border border-base-content/5">
          <div className="max-w-md">
            <span className="text-5xl">👥</span>
            <h3 className="text-2xl font-bold mt-4">No users found</h3>
            <p className="py-2 text-base-content/60">
              Try adjusting your filters or search query, or register a new user using the creation panel.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto card bg-base-100 shadow-xl border border-base-200">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50">
                <th>Name</th>
                <th>Email</th>
                <th>Role (Quick Toggle)</th>
                <th className="hidden lg:table-cell">Phone</th>
                <th className="hidden md:table-cell">Birth Date</th>
                <th className="hidden xl:table-cell">Registered</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-base-200/30 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-9">
                          <span className="text-xs font-semibold">
                            {u.name.charAt(0).toUpperCase()}
                            {u.surname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-base-content">
                          {u.name} {u.surname}
                        </div>
                        <div className="text-xs text-base-content/50 lg:hidden">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-medium text-base-content/85">{u.email}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={getRoleBadgeClass(u.role)}>{u.role}</span>
                      <select
                        className="select select-ghost select-xs max-w-[110px] text-xs font-normal border border-base-300 rounded focus:border-primary"
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value as UserRole, u.name)
                        }
                        disabled={u.id === user.id} // cannot modify own admin role
                        title={u.id === user.id ? "Cannot demote yourself" : "Modify user role"}
                      >
                        <option value="PLAYER">PLAYER</option>
                        <option value="TRAINER">TRAINER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell text-sm text-base-content/75">
                    {u.phone || <span className="text-base-content/30 italic">Not set</span>}
                  </td>
                  <td className="hidden md:table-cell text-sm text-base-content/75">
                    {u.birthDate || <span className="text-base-content/30 italic">Not set</span>}
                  </td>
                  <td className="hidden xl:table-cell text-sm text-base-content/50">
                    {u.createdAt}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-ghost btn-sm text-primary hover:bg-primary/10"
                        title="Edit User Info"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleOpenDelete(u)}
                        className="btn btn-ghost btn-sm text-error hover:bg-error/10"
                        disabled={u.id === user.id}
                        title={u.id === user.id ? "Cannot delete yourself" : "Delete User"}
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
            <h3 className="font-bold text-2xl text-primary mb-6">Create New Account</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">First Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Surname *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder="Surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email *</span>
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
                    <span className="label-text font-semibold">Role *</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    <option value="PLAYER">PLAYER</option>
                    <option value="TRAINER">TRAINER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Phone</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Birth Date</span>
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
                    <span className="label-text font-semibold">Password *</span>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Create User"
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
            <h3 className="font-bold text-2xl text-primary mb-6">Edit User Profile</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">First Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Surname *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered w-full"
                    placeholder="Surname"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Email *</span>
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
                    <span className="label-text font-semibold">Role *</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    disabled={selectedUser.id === user.id} // prevent demoting self
                    title={selectedUser.id === user.id ? "Cannot demote yourself" : "Modify user role"}
                  >
                    <option value="PLAYER">PLAYER</option>
                    <option value="TRAINER">TRAINER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Phone</span>
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

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Birth Date</span>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Save Changes"
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
            <h3 className="font-extrabold text-2xl text-error mb-4">⚠️ Delete Account?</h3>
            <p className="py-2 text-base-content/80">
              Are you sure you want to permanently delete the account for{" "}
              <strong className="text-base-content font-bold">
                {selectedUser.name} {selectedUser.surname}
              </strong>{" "}
              ({selectedUser.email})?
            </p>
            
            <div className="alert alert-warning mt-4 text-xs font-semibold py-3 border border-warning/20">
              <div>
                <span>
                  <strong>CRITICAL INFORMATION:</strong> Deleting this user will automatically
                  cascade and delete all match logs where they are designated as the Player or Trainer.
                  This action is permanent and cannot be undone.
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
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="btn btn-error text-white"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Yes, Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
