import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Job } from "./Job";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", unique: true, generated: "uuid" })
  uuid!: string;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Job, (job) => job.category)
  jobs!: Job[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
