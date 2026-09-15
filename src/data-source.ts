import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "./entities/User";
import { Role } from "./entities/Role";
import { Job } from "./entities/Job";
import { Category } from "./entities/Category";
import { Application } from "./entities/Application";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL as string,
  synchronize: false,
  logging: false,
  entities: [User, Role, Job, Category, Application],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
