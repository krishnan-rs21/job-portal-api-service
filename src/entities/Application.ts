import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from "typeorm";
import { Job } from "./Job";
import { User } from "./User";
import { ApplicationStatus, type ApplicationStatusType } from "../config/constants";

@Entity()
@Unique(["jobId", "userId"])
@Index(["uuid"])
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", unique: true, generated: "uuid" })
  uuid!: string;

  @Column()
  jobId!: number;

  @ManyToOne(() => Job, (job) => job.applications)
  @JoinColumn({ name: "jobId" })
  job!: Job;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.applications)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({
    type: "enum",
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING,
  })
  status!: ApplicationStatusType;

  @Column({ type: "varchar", nullable: true })
  resumeUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
