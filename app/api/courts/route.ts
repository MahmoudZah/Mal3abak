import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface FieldInput {
  name: string;
  type: string;
  pricePerHour: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { name, description, governorate, region, location, latitude, longitude, images, paymentName, paymentPhone, paymentMethod, fields } =
      await request.json();

    if (!name || !governorate || !region) {
      return NextResponse.json(
        { error: "اسم النادي والمحافظة والمنطقة مطلوبان" },
        { status: 400 }
      );
    }

    if (!paymentName || !paymentPhone || !paymentMethod) {
      return NextResponse.json(
        { error: "بيانات الدفع مطلوبة" },
        { status: 400 }
      );
    }

    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: "يجب إضافة ملعب واحد على الأقل" },
        { status: 400 }
      );
    }

    // Create court with fields
    const court = await prisma.court.create({
      data: {
        name,
        description: description || null,
        governorate,
        region,
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        images: JSON.stringify(images || []),
        paymentName,
        paymentPhone,
        paymentMethod,
        ownerId: user.id,
        fields: {
          create: (fields as FieldInput[]).map((field) => ({
            name: field.name,
            type: field.type,
            pricePerHour: field.pricePerHour,
          })),
        },
      },
      include: {
        fields: true,
      },
    });

    return NextResponse.json({
      success: true,
      court: {
        id: court.id,
        name: court.name,
        fieldsCount: court.fields.length,
      },
    });
  } catch (error) {
    console.error("Create court error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء النادي" },
      { status: 500 }
    );
  }
}

// Get all courts (for explore page search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const governorate = searchParams.get("governorate") || "";
    const region = searchParams.get("region") || "";

    const courts = await prisma.court.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { governorate: { contains: search, mode: "insensitive" } },
            { region: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(governorate && { governorate }),
        ...(region && { region }),
      },
      select: {
        id: true,
        name: true,
        governorate: true,
        region: true,
        location: true,
        latitude: true,
        longitude: true,
        images: true,
        description: true,
        fields: {
          select: { id: true, pricePerHour: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ courts });
  } catch (error) {
    console.error("Get courts error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
