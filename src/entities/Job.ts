import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Category } from "./Category";
import { User } from "./User";
import { Application } from "./Application";

@Entity()
@Index(["uuid"])
@Index(["categoryId"])
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
  type!: string;

  @Column()
  experience!: string;

  @Column({ type: "varchar", nullable: true })
  salaryRange!: string | null;

  @Column()
  categoryId!: number;

  @ManyToOne(() => Category, (category) => category.jobs)
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
