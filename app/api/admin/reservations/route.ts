import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Get all reservations (Admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500); // Cap at 500 for performance

    const reservations = await prisma.reservation.findMany({
      where: status ? { status } : undefined,
      take: limit,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        visitorName: true,
        visitorPhone: true,
        field: {
          select: {
            name: true,
            court: {
              select: {
                name: true,
                location: true,
                owner: {
                  select: { name: true },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reservations: reservations.map((res) => ({
        id: res.id,
        courtName: res.field.court.name,
        courtLocation: res.field.court.location,
        ownerName: res.field.court.owner.name,
        fieldName: res.field.name,
        customerName: res.user?.name || res.visitorName || "زائر",
        customerEmail: res.user?.email || null,
        customerPhone: res.user?.phone || res.visitorPhone || null,
        startTime: res.startTime,
        endTime: res.endTime,
        status: res.status,
        totalPrice: res.totalPrice,
        createdAt: res.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin get reservations error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

