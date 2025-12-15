import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Get all courts with details (Admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const courts = await prisma.court.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        fields: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerHour: true,
            _count: {
              select: { reservations: true },
            },
          },
        },
        _count: {
          select: { fields: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats for each court
    const courtsWithStats = await Promise.all(
      courts.map(async (court) => {
        const fieldIds = court.fields.map((f) => f.id);
        
        const [totalReservations, revenue] = await Promise.all([
          prisma.reservation.count({
            where: {
              fieldId: { in: fieldIds },
              status: "CONFIRMED",
            },
          }),
          prisma.reservation.aggregate({
            _sum: { totalPrice: true },
            where: {
              fieldId: { in: fieldIds },
              status: "CONFIRMED",
            },
          }),
        ]);

        return {
          ...court,
          totalReservations,
          totalRevenue: revenue._sum.totalPrice || 0,
        };
      })
    );

    return NextResponse.json({ courts: courtsWithStats });
  } catch (error) {
    console.error("Admin get courts error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

