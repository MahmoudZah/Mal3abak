import { PrismaClient } from "@prisma/client";
import { hash } from "./auth-utils";

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.reservation.deleteMany();
  await prisma.field.deleteMany();
  await prisma.court.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin user
  await prisma.user.create({
    data: {
      email: "admin@mal3bak.com",
      password: await hash("admin123456"),
      name: "مدير المنصة",
      phone: "01000000000",
      role: "ADMIN",
    },
  });

  // Create Users with hashed passwords
  const player1 = await prisma.user.create({
    data: {
      email: "ahmed@example.com",
      password: await hash("password123"),
      name: "أحمد محمد",
      phone: "01012345678",
      role: "PLAYER",
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: "omar@example.com",
      password: await hash("password123"),
      name: "عمر علي",
      phone: "01098765432",
      role: "PLAYER",
    },
  });

  const owner1 = await prisma.user.create({
    data: {
      email: "owner@example.com",
      password: await hash("password123"),
      name: "محمد صاحب الملعب",
      phone: "01155566677",
      role: "OWNER",
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: "khaled@example.com",
      password: await hash("password123"),
      name: "خالد إبراهيم",
      phone: "01222233344",
      role: "OWNER",
    },
  });

  // Create Courts (Venues) with Fields
  // نادي الشمس - 3 ملاعب (مدينة نصر)
  const court1 = await prisma.court.create({
    data: {
      name: "نادي الشمس الرياضي",
      description:
        "نادي رياضي متكامل يضم ثلاثة ملاعب كرة قدم بمواصفات عالية. نجيل صناعي درجة أولى وإضاءة ليلية ممتازة. يتوفر موقف سيارات وكافتيريا.",
      location: "القاهرة - مدينة نصر",
      latitude: 30.0511,
      longitude: 31.3656,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800",
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800",
      ]),
      ownerId: owner1.id,
    },
  });

  const field1_1 = await prisma.field.create({
    data: {
      name: "ملعب خماسي 1",
      type: "5v5",
      pricePerHour: 250,
      courtId: court1.id,
    },
  });

  const field1_2 = await prisma.field.create({
    data: {
      name: "ملعب خماسي 2",
      type: "5v5",
      pricePerHour: 250,
      courtId: court1.id,
    },
  });

  await prisma.field.create({
    data: {
      name: "ملعب سباعي",
      type: "7v7",
      pricePerHour: 400,
      courtId: court1.id,
    },
  });

  // ملعب الأبطال - 2 ملاعب (المعادي)
  const court2 = await prisma.court.create({
    data: {
      name: "ملعب الأبطال",
      description: "ملعب حديث ومجهز بأفضل المعدات. نجيل طبيعي عالي الجودة.",
      location: "القاهرة - المعادي",
      latitude: 29.9602,
      longitude: 31.2569,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800",
      ]),
      ownerId: owner1.id,
    },
  });

  const field2_1 = await prisma.field.create({
    data: {
      name: "الملعب الرئيسي",
      type: "7v7",
      pricePerHour: 350,
      courtId: court2.id,
    },
  });

  await prisma.field.create({
    data: {
      name: "ملعب التدريب",
      type: "5v5",
      pricePerHour: 200,
      courtId: court2.id,
    },
  });

  // ستاد الحرية - ملعب واحد (الدقي)
  const court3 = await prisma.court.create({
    data: {
      name: "ستاد الحرية",
      description:
        "ملعب خماسي مغطى مكيف الهواء. مناسب للعب في جميع الأوقات والفصول.",
      location: "الجيزة - الدقي",
      latitude: 30.0388,
      longitude: 31.209,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
      ]),
      ownerId: owner2.id,
    },
  });

  const field3_1 = await prisma.field.create({
    data: {
      name: "الملعب المغطى",
      type: "5v5",
      pricePerHour: 400,
      courtId: court3.id,
    },
  });

  // ملعب الشباب - ملعبين (شبرا)
  await prisma.court.create({
    data: {
      name: "ملعب الشباب",
      description: "ملعب اقتصادي للشباب. نجيل صناعي جيد وإضاءة كافية.",
      location: "القاهرة - شبرا",
      latitude: 30.0891,
      longitude: 31.2445,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
      ]),
      ownerId: owner2.id,
      fields: {
        create: [
          { name: "ملعب A", type: "5v5", pricePerHour: 150 },
          { name: "ملعب B", type: "5v5", pricePerHour: 150 },
        ],
      },
    },
  });

  // Create sample reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reservation 1: Ahmed booked field1_1 tomorrow at 6 PM for 2 hours
  const res1Start = new Date(tomorrow);
  res1Start.setHours(18, 0, 0, 0);
  const res1End = new Date(tomorrow);
  res1End.setHours(20, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: player1.id,
      fieldId: field1_1.id,
      startTime: res1Start,
      endTime: res1End,
      status: "CONFIRMED",
      totalPrice: field1_1.pricePerHour * 2,
    },
  });

  // Reservation 2: Omar booked field2_1 tomorrow at 8 PM
  const res2Start = new Date(tomorrow);
  res2Start.setHours(20, 0, 0, 0);
  const res2End = new Date(tomorrow);
  res2End.setHours(21, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: player2.id,
      fieldId: field2_1.id,
      startTime: res2Start,
      endTime: res2End,
      status: "CONFIRMED",
      totalPrice: field2_1.pricePerHour,
    },
  });

  // Past reservation
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const res3Start = new Date(yesterday);
  res3Start.setHours(19, 0, 0, 0);
  const res3End = new Date(yesterday);
  res3End.setHours(20, 0, 0, 0);

  await prisma.reservation.create({
    data: {
      userId: player1.id,
      fieldId: field3_1.id,
      startTime: res3Start,
      endTime: res3End,
      status: "CONFIRMED",
      totalPrice: field3_1.pricePerHour,
    },
  });

  console.log("✅ Seeding finished successfully!");
  console.log("");
  console.log("📧 Test accounts:");
  console.log("   🔴 Admin:  admin@mal3bak.com / admin123456");
  console.log("   🟢 Owner:  owner@example.com / password123");
  console.log("   🔵 Player: ahmed@example.com / password123");
  console.log("");
  console.log("🏟️ Courts created:");
  console.log("   - نادي الشمس الرياضي (3 ملاعب)");
  console.log("   - ملعب الأبطال (2 ملاعب)");
  console.log("   - ستاد الحرية (1 ملعب)");
  console.log("   - ملعب الشباب (2 ملاعب)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
