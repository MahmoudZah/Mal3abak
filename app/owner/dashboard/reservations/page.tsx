import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";

export default async function OwnerReservationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Get all courts with their fields and reservations
  const courts = await prisma.court.findMany({
    where: { ownerId: user.id },
    include: {
      fields: {
        include: {
          reservations: {
            include: { user: true },
            orderBy: { startTime: "desc" },
          },
        },
      },
    },
  });

  // Flatten all reservations with court info
  const allReservations = courts.flatMap((court) =>
    court.fields.flatMap((field) =>
      field.reservations.map((res) => ({
        id: res.id,
        startTime: res.startTime.toISOString(),
        endTime: res.endTime.toISOString(),
        totalPrice: res.totalPrice,
        serviceFee: res.serviceFee,
        status: res.status,
        paymentProof: res.paymentProof,
        visitorName: res.visitorName,
        visitorPhone: res.visitorPhone,
        user: res.user ? { name: res.user.name, phone: res.user.phone } : null,
        courtName: court.name,
        courtId: court.id,
        fieldName: field.name,
      }))
    )
  );

  // Prepare courts data for tabs
  const courtsData = courts.map((court) => {
    const courtReservations = court.fields.flatMap((f) => f.reservations);
    return {
      id: court.id,
      name: court.name,
      reservationsCount: courtReservations.length,
      revenue: courtReservations.reduce((sum, r) => sum + r.totalPrice, 0),
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <ReservationsClient
        initialReservations={allReservations}
        courts={courtsData}
      />
    </div>
  );
}
