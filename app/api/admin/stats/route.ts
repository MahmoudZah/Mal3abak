import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalPlayers,
      totalOwners,
      totalCourts,
      totalFields,
      totalReservations,
      confirmedReservations,
      cancelledReservations,
      revenueResult,
      recentReservations,
      topCourts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "PLAYER" } }),
      prisma.user.count({ where: { role: "OWNER" } }),
      prisma.court.count(),
      prisma.field.count(),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: "CONFIRMED" } }),
      prisma.reservation.count({ where: { status: "CANCELLED" } }),
      prisma.reservation.aggregate({
        _sum: { totalPrice: true },
        where: { status: "CONFIRMED" },
      }),
      prisma.reservation.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          field: {
            include: { court: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.court.findMany({
        take: 5,
        include: {
          fields: {
            include: {
              reservations: {
                where: { status: "CONFIRMED" },
              },
            },
          },
          owner: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Calculate top courts by reservations
    const courtsWithStats = topCourts.map((court) => {
      const totalReservations = court.fields.reduce(
        (acc, field) => acc + field.reservations.length,
        0
      );
      const totalRevenue = court.fields.reduce(
        (acc, field) =>
          acc +
          field.reservations.reduce((sum, res) => sum + res.totalPrice, 0),
        0
      );
      return {
        id: court.id,
        name: court.name,
        location: court.location,
        ownerName: court.owner.name,
        fieldsCount: court.fields.length,
        totalReservations,
        totalRevenue,
      };
    });

    // Sort by reservations
    courtsWithStats.sort((a, b) => b.totalReservations - a.totalReservations);

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          players: totalPlayers,
          owners: totalOwners,
        },
        courts: {
          total: totalCourts,
          fields: totalFields,
        },
        reservations: {
          total: totalReservations,
          confirmed: confirmedReservations,
          cancelled: cancelledReservations,
          pending: totalReservations - confirmedReservations - cancelledReservations,
        },
        revenue: {
          total: revenueResult._sum.totalPrice || 0,
        },
      },
      recentReservations: recentReservations.map((res) => ({
        id: res.id,
        courtName: res.field.court.name,
        fieldName: res.field.name,
        customerName: res.user?.name || res.visitorName || "زائر",
        startTime: res.startTime,
        endTime: res.endTime,
        status: res.status,
        totalPrice: res.totalPrice,
        createdAt: res.createdAt,
      })),
      topCourts: courtsWithStats,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

