import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Generate available slots for a field based on reservations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    const dateParam = searchParams.get("date");

    if (!fieldId) {
      return NextResponse.json({ error: "يرجى تحديد الملعب" }, { status: 400 });
    }

    // Verify owner owns this field
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      include: { court: true },
    });

    if (!field || field.court.ownerId !== user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Get date range (default to next 7 days)
    const startDate = dateParam ? new Date(dateParam) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Get all reservations for this field in the date range
    const reservations = await prisma.reservation.findMany({
      where: {
        fieldId,
        status: { not: "CANCELLED" },
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      orderBy: { startTime: "asc" },
    });

    // Generate slots for each day (2 PM to midnight)
    const slots = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + dayOffset);

      for (let hour = 14; hour < 24; hour++) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if this slot overlaps with any reservation
        const isBooked = reservations.some((res) => {
          const resStart = new Date(res.startTime);
          const resEnd = new Date(res.endTime);
          return slotStart < resEnd && slotEnd > resStart;
        });

        slots.push({
          id: `${fieldId}-${slotStart.toISOString()}`,
          startTime: slotStart,
          endTime: slotEnd,
          isAvailable: !isBooked,
        });
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Get slots error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
