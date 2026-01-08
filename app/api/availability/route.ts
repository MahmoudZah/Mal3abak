import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get availability for a field on a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    const dateParam = searchParams.get("date");

    if (!fieldId) {
      return NextResponse.json({ error: "يرجى تحديد الملعب" }, { status: 400 });
    }

    // Verify field exists
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json({ error: "الملعب غير موجود" }, { status: 404 });
    }

    // Get date range for the requested date
    // IMPORTANT: Parse date in local timezone to avoid UTC conversion issues
    let date: Date;
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      date = new Date(year, month - 1, day); // Month is 0-indexed
    } else {
      date = new Date();
    }
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all reservations for this field on this date
    const reservations = await prisma.reservation.findMany({
      where: {
        fieldId,
        status: { not: "CANCELLED" },
        OR: [
          // Reservation starts on this day
          {
            startTime: { gte: startOfDay, lte: endOfDay },
          },
          // Reservation ends on this day
          {
            endTime: { gte: startOfDay, lte: endOfDay },
          },
          // Reservation spans the entire day
          {
            startTime: { lte: startOfDay },
            endTime: { gte: endOfDay },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
