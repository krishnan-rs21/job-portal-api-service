import "reflect-metadata";
import bcrypt from "bcrypt";
import { AppDataSource } from "./data-source";
import { Role } from "./entities/Role";
import { Category } from "./entities/Category";
import { User } from "./entities/User";
import seedData from "./config/seed-data.json";

async function seed() {
  await AppDataSource.initialize();
  const roleRepository = AppDataSource.getRepository(Role);
  const categoryRepository = AppDataSource.getRepository(Category);
  const userRepository = AppDataSource.getRepository(User);

  for (const role of seedData.roles) {
    const existing = await roleRepository.findOne({ where: { name: role.name } });
    if (!existing) {
      await roleRepository.save(roleRepository.create({ name: role.name }));
    }
  }

  for (const category of seedData.categories) {
    const existing = await categoryRepository.findOne({
      where: { name: category.name },
    });
    if (!existing) {
      await categoryRepository.save(
        categoryRepository.create({ name: category.name }),
      );
    }
  }

  const adminRole = await roleRepository.findOne({ where: { name: "ADMIN" } });
  if (adminRole) {
    const existingAdmin = await userRepository.findOne({
      where: { email: "admin@jobportal.com" },
    });
    if (!existingAdmin) {
      await userRepository.save(
        userRepository.create({
          email: "admin@jobportal.com",
          password: await bcrypt.hash("admin123", 10),
          firstName: "System",
          lastName: "Admin",
          roleId: adminRole.id,
        }),
      );
    }
  }

  console.log("Seeding finished.");
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
