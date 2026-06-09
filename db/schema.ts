import {
  pgTable,
  serial,
  text,
  timestamp,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const employees = pgTable("employees", {
  id: serial().primaryKey(),
  name: text().notNull(),
  employeeId: integer("employee_id").notNull().unique(),
  department: text().notNull().default("General"),
  role: text().notNull().default("Staff"),
  salary: real().notNull().default(0),
  leavesAllowed: integer("leaves_allowed").notNull().default(5),
  leavesTaken: integer("leaves_taken").notNull().default(0),
  leavesPending: integer("leaves_pending").notNull().default(0),
  leaveStatus: integer("leave_status").notNull().default(0), // 0=None, 1=Pending, 2=Approved, 3=Rejected
  isActive: boolean("is_active").notNull().default(true),
  joinDate: timestamp("join_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});
