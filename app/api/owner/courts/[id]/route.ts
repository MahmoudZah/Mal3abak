import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface FieldInput {
  id?: string;
  name: string;
  type: string;
  pricePerHour: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const court = await prisma.court.findUnique({
      where: { id },
      include: {
        fields: {
          select: {
            id: true,
            name: true,
            type: true,
            pricePerHour: true,
          },
        },
      },
    });

    if (!court || court.ownerId !== user.id) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    // Include latitude and longitude in response
    return NextResponse.json({ 
      court: {
        ...court,
        latitude: court.latitude,
        longitude: court.longitude,
      }
    });
  } catch (error) {
    console.error("Get court error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Verify ownership
    const existingCourt = await prisma.court.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!existingCourt || existingCourt.ownerId !== user.id) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    const { name, description, location, latitude, longitude, images, paymentName, paymentPhone, paymentMethod, serviceFee, fields } =
      await request.json();

    // Update court
    await prisma.court.update({
      where: { id },
      data: {
        name,
        description: description || null,
        location,
        latitude: latitude || null,
        longitude: longitude || null,
        images: JSON.stringify(images || []),
        paymentName: paymentName || null,
        paymentPhone: paymentPhone || null,
        paymentMethod: paymentMethod || null,
        serviceFee: serviceFee || 10,
      },
    });

    // Handle fields
    const incomingFields = fields as FieldInput[];
    const existingFieldIds = existingCourt.fields.map((f) => f.id);
    const incomingFieldIds = incomingFields
      .filter((f) => f.id)
      .map((f) => f.id!);

    // Delete removed fields (cascade will handle reservations due to schema)
    const fieldsToDelete = existingFieldIds.filter(
      (id) => !incomingFieldIds.includes(id)
    );
    if (fieldsToDelete.length > 0) {
      // Delete associated reservations first
      await prisma.reservation.deleteMany({
        where: { fieldId: { in: fieldsToDelete } },
      });
      await prisma.field.deleteMany({
        where: { id: { in: fieldsToDelete } },
      });
    }

    // Update or create fields
    for (const field of incomingFields) {
      if (field.id && existingFieldIds.includes(field.id)) {
        // Update existing field
        await prisma.field.update({
          where: { id: field.id },
          data: {
            name: field.name,
            type: field.type,
            pricePerHour: field.pricePerHour,
          },
        });
      } else {
        // Create new field (no time slots needed)
        await prisma.field.create({
          data: {
            courtId: id,
            name: field.name,
            type: field.type,
            pricePerHour: field.pricePerHour,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update court error:", error);
    return NextResponse.json({ error: "حدث خطأ في التحديث" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const court = await prisma.court.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!court || court.ownerId !== user.id) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    // Delete all related data
    const fieldIds = court.fields.map((f) => f.id);

    await prisma.reservation.deleteMany({
      where: { fieldId: { in: fieldIds } },
    });

    await prisma.field.deleteMany({
      where: { courtId: id },
    });

    await prisma.court.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete court error:", error);
    return NextResponse.json({ error: "حدث خطأ في الحذف" }, { status: 500 });
  }
}
