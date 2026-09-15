import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { Role } from "./Role";
import { Application } from "./Application";
import { Job } from "./Job";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "uuid", unique: true, generated: "uuid" })
  uuid!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  roleId!: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: "roleId" })
  role!: Role;

  @OneToMany(() => Application, (application) => application.user)
  applications!: Application[];

  @OneToMany(() => Job, (job) => job.postedBy)
  jobs!: Job[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
