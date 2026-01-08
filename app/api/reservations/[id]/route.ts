import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!["CONFIRMED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    // Verify the reservation belongs to owner's court
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        field: {
          include: {
            court: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "الحجز غير موجود" }, { status: 404 });
    }

    if (reservation.field.court.ownerId !== user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    // Update status
    await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update reservation status error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

