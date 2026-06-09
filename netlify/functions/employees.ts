import type { Config } from "@netlify/functions";
import { db } from "../../db/index.js";
import { employees } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/employees\/?/, "").split("/").filter(Boolean);
  const idStr = parts[0];
  const id = idStr ? parseInt(idStr, 10) : null;
  const sub = parts[1]; // e.g. "leave-review"

  try {
    // GET /api/employees — list all
    if (req.method === "GET" && !id) {
      const all = await db
        .select()
        .from(employees)
        .orderBy(desc(employees.createdAt));
      return Response.json(all, { headers: CORS });
    }

    // GET /api/employees/:id — get single
    if (req.method === "GET" && id) {
      const rows = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id));
      if (!rows.length)
        return Response.json({ error: "Not found" }, { status: 404, headers: CORS });
      return Response.json(rows[0], { headers: CORS });
    }

    // POST /api/employees — create
    if (req.method === "POST") {
      const body = await req.json();

      if (!body.name || !body.employeeId) {
        return Response.json(
          { error: "name and employeeId are required" },
          { status: 400, headers: CORS }
        );
      }

      const [emp] = await db
        .insert(employees)
        .values({
          name: String(body.name),
          employeeId: Number(body.employeeId),
          department: body.department || "General",
          role: body.role || "Staff",
          salary: Number(body.salary) || 0,
          leavesAllowed: Number(body.leavesAllowed) || 5,
        })
        .returning();

      return Response.json(emp, { status: 201, headers: CORS });
    }

    // PUT /api/employees/:id — update
    if (req.method === "PUT" && id) {
      const body = await req.json();

      const allowedFields: Record<string, boolean> = {
        name: true,
        department: true,
        role: true,
        salary: true,
        leavesAllowed: true,
        leavesTaken: true,
        leavesPending: true,
        leaveStatus: true,
        isActive: true,
      };

      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(body)) {
        if (allowedFields[k]) updates[k] = v;
      }

      if (!Object.keys(updates).length) {
        return Response.json({ error: "No valid fields to update" }, { status: 400, headers: CORS });
      }

      const rows = await db
        .update(employees)
        .set(updates)
        .where(eq(employees.id, id))
        .returning();

      if (!rows.length)
        return Response.json({ error: "Not found" }, { status: 404, headers: CORS });

      return Response.json(rows[0], { headers: CORS });
    }

    // DELETE /api/employees/:id — soft-delete (deactivate)
    if (req.method === "DELETE" && id) {
      await db
        .update(employees)
        .set({ isActive: false })
        .where(eq(employees.id, id));
      return Response.json({ success: true }, { headers: CORS });
    }

    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  } catch (err: unknown) {
    console.error("[employees]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
};

export const config: Config = {
  path: ["/api/employees", "/api/employees/:id"],
};
