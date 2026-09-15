import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Category } from "./Category";
import { User } from "./User";
import { Application } from "./Application";
import { EmploymentType } from "./EmploymentType";
import { ExperienceLevel } from "./ExperienceLevel";

@Entity()
@Index(["uuid"])
@Index(["categoryId"])
@Index(["employmentTypeId"])
@Index(["experienceLevelId"])
export class Job {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", unique: true, generated: "uuid" })
  uuid!: string;

  @Column()
  title!: string;

  @Column("text")
  description!: string;

  @Column()
  location!: string;

  @Column()
  employmentTypeId!: number;

  @ManyToOne(() => EmploymentType, (employmentType) => employmentType.jobs, { eager: true })
  @JoinColumn({ name: "employmentTypeId" })
  employmentType!: EmploymentType;

  @Column()
  experienceLevelId!: number;

  @ManyToOne(() => ExperienceLevel, (experienceLevel) => experienceLevel.jobs, { eager: true })
  @JoinColumn({ name: "experienceLevelId" })
  experienceLevel!: ExperienceLevel;

  @Column({ type: "varchar", nullable: true })
  salaryRange!: string | null;

  @Column()
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.jobs, { eager: true })
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @Column()
  postedById!: number;

  @ManyToOne(() => User, (user) => user.jobs)
  @JoinColumn({ name: "postedById" })
  postedBy!: User;

  @OneToMany(() => Application, (application) => application.job)
  applications!: Application[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
