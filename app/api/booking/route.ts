import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { fieldId, date, slots, visitorName, visitorPhone, paymentProof } =
      await request.json();

    if (!fieldId || !date || !slots || slots.length === 0) {
      return NextResponse.json(
        { error: "بيانات الحجز غير مكتملة" },
        { status: 400 }
      );
    }

    // Payment proof is required
    if (!paymentProof) {
      return NextResponse.json(
        { error: "يرجى إرفاق إثبات الدفع" },
        { status: 400 }
      );
    }

    // Validate slots are consecutive to prevent price manipulation
    const sortedSlotsCheck = [...slots].sort((a: number, b: number) => a - b);
    for (let i = 1; i < sortedSlotsCheck.length; i++) {
      if (sortedSlotsCheck[i] - sortedSlotsCheck[i - 1] !== 1) {
        return NextResponse.json(
          { error: "يجب اختيار ساعات متتالية" },
          { status: 400 }
        );
      }
    }

    // If not logged in, require visitor info
    if (!user && (!visitorName || !visitorPhone)) {
      return NextResponse.json(
        { error: "يرجى إدخال الاسم ورقم الهاتف للحجز" },
        { status: 400 }
      );
    }

    // Get the field
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json({ error: "الملعب غير موجود" }, { status: 404 });
    }

    // Parse date and slots to create start/end times
    // IMPORTANT: Parse date in local timezone to avoid UTC conversion issues
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day); // Month is 0-indexed
    const sortedSlots = [...slots].sort((a: number, b: number) => a - b);

    const startTime = new Date(bookingDate);
    startTime.setHours(sortedSlots[0], 0, 0, 0);

    const endTime = new Date(bookingDate);
    endTime.setHours(sortedSlots[sortedSlots.length - 1] + 1, 0, 0, 0);

    // Use transaction with serializable isolation to prevent race conditions
    const reservation = await prisma.$transaction(async (tx) => {
      // Check for any overlapping reservations
      const conflictingReservation = await tx.reservation.findFirst({
        where: {
          fieldId: fieldId,
          status: { not: "CANCELLED" },
          OR: [
            // New booking starts during existing booking
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            // New booking ends during existing booking
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            // New booking completely contains existing booking
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

      // Calculate total price (field price + service fee)
      const serviceFee = 10; // 10 EGP service fee
      const fieldPrice = slots.length * field.pricePerHour;
      const totalPrice = fieldPrice + serviceFee;

      // Create reservation with PENDING status (owner needs to confirm)
      return tx.reservation.create({
        data: {
          userId: user?.id || null,
          visitorName: user ? null : visitorName,
          visitorPhone: user ? null : visitorPhone,
          fieldId: fieldId,
          startTime: startTime,
          endTime: endTime,
          status: "PENDING", // Changed to PENDING - owner must confirm
          totalPrice: totalPrice,
          serviceFee: serviceFee,
          paymentProof: paymentProof,
        },
        include: {
          field: {
            include: { court: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        courtName: reservation.field.court.name,
        fieldName: reservation.field.name,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        totalPrice: reservation.totalPrice,
        hours: slots.length,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    const message = error instanceof Error ? error.message : "حدث خطأ في الحجز";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Get user's reservations
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: user.id },
      include: {
        field: {
          include: { court: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
