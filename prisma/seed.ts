import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import * as seedData from "../src/config/seed-data.json";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  // 1. Seed Roles
  for (const role of seedData.roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name },
    });
  }
  console.log("Roles seeded.");

  // 2. Seed Categories
  for (const category of seedData.categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: { name: category.name },
    });
  }
  console.log("Categories seeded.");

  // 3. Seed Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
  if (adminRole) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "admin@jobportal.com" },
      update: {},
      create: {
        email: "admin@jobportal.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        roleId: adminRole.id,
      },
    });
    console.log("Admin user seeded.");
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
