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

    // Fetch courts with optimized single query
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
            reservations: {
              where: { status: "CONFIRMED" },
              select: {
                totalPrice: true,
              },
            },
            _count: {
              select: { reservations: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats in memory (much faster than separate DB queries)
    const courtsWithStats = courts.map((court) => {
      let totalReservations = 0;
      let totalRevenue = 0;

      court.fields.forEach((field) => {
        totalReservations += field.reservations.length;
        field.reservations.forEach((res) => {
          totalRevenue += res.totalPrice;
        });
      });

      return {
        id: court.id,
        name: court.name,
        description: court.description,
        location: court.location,
        images: court.images,
        createdAt: court.createdAt,
        owner: court.owner,
        fields: court.fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          pricePerHour: f.pricePerHour,
          _count: f._count,
        })),
        totalReservations,
        totalRevenue,
      };
    });

    return NextResponse.json({ courts: courtsWithStats });
  } catch (error) {
    console.error("Admin get courts error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

