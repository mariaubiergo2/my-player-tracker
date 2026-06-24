"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword, verifyPassword, generateToken } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Checks if the current request is initiated by a verified Admin user
 */
async function checkAdmin(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthenticated: No active session found.");
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error("Unauthorized: Invalid session token.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== UserRole.ADMIN) {
    throw new Error("Forbidden: This action requires Administrator privileges.");
  }

  return payload.userId;
}

/**
 * READ: Fetch all users
 */
export async function getUsers() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        birthDate: true,
        createdAt: true,
      },
    });
    return { success: true, users };
  } catch (error) {
    console.error("getUsers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load users",
    };
  }
}

/**
 * CREATE: Add a new user
 */
export async function createUser(data: {
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  phone?: string;
  birthDate?: string;
  password?: string;
}) {
  try {
    await checkAdmin();

    if (!data.name || !data.surname || !data.email || !data.role) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const rawPassword = data.password || "tracker123";
    const hashedPassword = await hashPassword(rawPassword);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        role: data.role,
        phone: data.phone?.trim() || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: newUser };
  } catch (error) {
    console.error("createUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * UPDATE: Edit existing user details
 */
export async function updateUser(
  id: string,
  updates: {
    name?: string;
    surname?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    birthDate?: string;
  }
) {
  try {
    await checkAdmin();

    const data: any = {};
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.surname !== undefined) data.surname = updates.surname.trim();
    
    if (updates.email !== undefined) {
      const emailLower = updates.email.toLowerCase().trim();
      const collision = await prisma.user.findFirst({
        where: { email: emailLower, NOT: { id } },
      });
      if (collision) {
        return { success: false, error: "This email address is already in use." };
      }
      data.email = emailLower;
    }

    if (updates.role !== undefined) data.role = updates.role;
    if (updates.phone !== undefined) data.phone = updates.phone?.trim() || null;
    
    if (updates.birthDate !== undefined) {
      data.birthDate = updates.birthDate ? new Date(updates.birthDate) : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/users");
    revalidatePath("/dashboard"); // Revalidate dashboard since roles of players/trainers changed
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("updateUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * DELETE: Delete a user (cascade deletes matches)
 */
export async function deleteUser(id: string) {
  try {
    const currentAdminId = await checkAdmin();

    if (id === currentAdminId) {
      return { success: false, error: "You cannot delete your own admin account." };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * GET PROFILE: Fetch details of the current logged-in user
 */
export async function getProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return { success: false, error: "Unauthenticated: Please log in." };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { success: false, error: "Unauthorized: Invalid session token." };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        birthDate: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    return {
      success: true,
      user: {
        ...user,
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : null,
      },
    };
  } catch (error) {
    console.error("getProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load profile",
    };
  }
}

/**
 * UPDATE PROFILE: Edit current logged-in user details (Player or Trainer or Admin)
 */
export async function updateProfile(updates: {
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return { success: false, error: "Unauthenticated: Please log in." };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { success: false, error: "Unauthorized: Invalid session token." };
    }

    const userId = payload.userId;

    // Validate base inputs
    if (!updates.name || !updates.surname || !updates.email) {
      return { success: false, error: "First name, surname, and email are required fields." };
    }

    // Check email collision
    const emailLower = updates.email.toLowerCase().trim();
    const collision = await prisma.user.findFirst({
      where: { email: emailLower, NOT: { id: userId } },
    });
    if (collision) {
      return { success: false, error: "This email address is already in use by another account." };
    }

    // Prepare update data
    const data: any = {
      name: updates.name.trim(),
      surname: updates.surname.trim(),
      email: emailLower,
      phone: updates.phone?.trim() || null,
      birthDate: updates.birthDate ? new Date(updates.birthDate) : null,
      avatarUrl: updates.avatarUrl?.trim() || null,
    };

    // Handle password update if requested
    if (updates.newPassword) {
      if (!updates.currentPassword) {
        return { success: false, error: "Current password is required to set a new password." };
      }
      if (updates.newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }

      // Fetch user to verify current password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return { success: false, error: "User not found." };
      }

      const isValid = await verifyPassword(updates.currentPassword, user.password);
      if (!isValid) {
        return { success: false, error: "Incorrect current password." };
      }

      data.password = await hashPassword(updates.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Re-generate token since email or name might have changed
    const newToken = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
    });

    // Update session cookie
    cookieStore.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        surname: updatedUser.surname,
        role: updatedUser.role,
        phone: updatedUser.phone,
        birthDate: updatedUser.birthDate,
        avatarUrl: updatedUser.avatarUrl,
      },
    };
  } catch (error) {
    console.error("updateProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

