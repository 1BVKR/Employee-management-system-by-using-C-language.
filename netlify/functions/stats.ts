import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import { desc } from "drizzle-orm";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const all = await db.select().from(employees).orderBy(desc(employees.createdAt));

    const active = all.filter((e) => e.isActive);
    const inactive = all.filter((e) => !e.isActive);

    const pendingLeaves = active.filter((e) => e.leaveStatus === 1);
    const approvedLeaves = active.filter((e) => e.leaveStatus === 2);
    const rejectedLeaves = active.filter((e) => e.leaveStatus === 3);
    const noLeaveRequest = active.filter((e) => e.leaveStatus === 0);

    const totalMonthlyPayroll = active.reduce((sum, e) => sum + (e.salary || 0), 0);

    // Department breakdown
    const deptMap: Record<string, number> = {};
    active.forEach((e) => {
      deptMap[e.department] = (deptMap[e.department] || 0) + 1;
    });

    const departments = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Leave utilization
    const totalLeavesAllowed = active.reduce((s, e) => s + e.leavesAllowed, 0);
    const totalLeavesTaken = active.reduce((s, e) => s + e.leavesTaken, 0);

    const recentEmployees = active.slice(0, 8).map((e) => ({
      id: e.id,
      name: e.name,
      employeeId: e.employeeId,
      department: e.department,
      role: e.role,
      salary: e.salary,
      leaveStatus: e.leaveStatus,
      isActive: e.isActive,
      joinDate: e.joinDate,
    }));

    return Response.json(
      {
        total: all.length,
        active: active.length,
        inactive: inactive.length,
        pendingLeaves: pendingLeaves.length,
        approvedLeaves: approvedLeaves.length,
        rejectedLeaves: rejectedLeaves.length,
        noLeaveRequest: noLeaveRequest.length,
        totalMonthlyPayroll,
        totalLeavesAllowed,
        totalLeavesTaken,
        leaveUtilizationPct:
          totalLeavesAllowed > 0
            ? Math.round((totalLeavesTaken / totalLeavesAllowed) * 100)
            : 0,
        departments,
        recentEmployees,
      },
      { headers: CORS }
    );
  } catch (err: unknown) {
    console.error("[stats]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
};

export const config: Config = {
  path: "/api/stats",
};
