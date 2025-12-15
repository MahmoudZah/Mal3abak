import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

// Update user role or details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Prevent admin from modifying their own role
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "لا يمكنك تعديل حسابك من هنا" },
        { status: 400 }
      );
    }

    const { name, phone, role, password } = await request.json();

    const updateData: {
      name?: string;
      phone?: string | null;
      role?: string;
      password?: string;
    } = {};

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role && ["PLAYER", "OWNER", "ADMIN"].includes(role)) {
      updateData.role = role;
    }
    if (password && password.length >= 6) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "حدث خطأ في تحديث الحساب" }, { status: 500 });
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حسابك" },
        { status: 400 }
      );
    }

    // Get user with their courts
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        courts: {
          include: { fields: true },
        },
      },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Delete all related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete reservations for user
      await tx.reservation.deleteMany({ where: { userId: id } });

      // Delete all courts owned by user (and their fields/reservations)
      for (const court of userToDelete.courts) {
        const fieldIds = court.fields.map((f) => f.id);
        await tx.reservation.deleteMany({
          where: { fieldId: { in: fieldIds } },
        });
        await tx.field.deleteMany({ where: { courtId: court.id } });
        await tx.court.delete({ where: { id: court.id } });
      }

      // Delete sessions
      await tx.session.deleteMany({ where: { userId: id } });

      // Delete user
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الحساب" }, { status: 500 });
  }
}

