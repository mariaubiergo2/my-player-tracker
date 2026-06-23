"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
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
