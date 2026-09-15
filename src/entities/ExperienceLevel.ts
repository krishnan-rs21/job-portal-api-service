import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Job } from "./Job";

@Entity()
export class ExperienceLevel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", unique: true, generated: "uuid" })
  uuid!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: 0 })
  sortOrder!: number;

  @OneToMany(() => Job, (job) => job.experienceLevel)
  jobs!: Job[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
