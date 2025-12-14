import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { fieldId, date, slots, customerName, customerPhone } =
      await request.json();

    if (!fieldId || !date || !slots || slots.length === 0) {
      return NextResponse.json(
        { error: "بيانات الحجز غير مكتملة" },
        { status: 400 }
      );
    }

    // Verify owner owns this field
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { court: true },
    });

    if (!field || field.court.ownerId !== user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Parse date and slots to create start/end times
    const bookingDate = new Date(date);
    const sortedSlots = [...slots].sort((a: number, b: number) => a - b);

    const startTime = new Date(bookingDate);
    startTime.setHours(sortedSlots[0], 0, 0, 0);

    const endTime = new Date(bookingDate);
    endTime.setHours(sortedSlots[sortedSlots.length - 1] + 1, 0, 0, 0);

    // Use transaction to prevent race conditions
    const reservation = await prisma.$transaction(async (tx) => {
      // Check for any overlapping reservations
      const conflictingReservation = await tx.reservation.findFirst({
        where: {
          fieldId: fieldId,
          status: { not: "CANCELLED" },
          OR: [
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });

      if (conflictingReservation) {
        throw new Error("الموعد المختار محجوز بالفعل");
      }

      // Calculate total
      const totalPrice = slots.length * field.pricePerHour;

      // Create reservation (manual booking by owner)
      return tx.reservation.create({
        data: {
          fieldId,
          visitorName: customerName || "حجز يدوي",
          visitorPhone: customerPhone || null,
          startTime,
          endTime,
          status: "CONFIRMED",
          totalPrice,
        },
      });
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        totalPrice: reservation.totalPrice,
      },
    });
  } catch (error) {
    console.error("Manual booking error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ في الحجز";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
