import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../test/msw/server";
import { createUser, deleteUser, getMe, listUsers, updateUser } from "./usersApi";

const token = "access-123";

describe("usersApi integration (MSW)", () => {
  it("sends bearer token and parses list/users responses", async () => {
    server.use(
      http.get("http://localhost:3000/users", ({ request }) => {
        if (request.headers.get("authorization") !== `Bearer ${token}`) {
          return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        return HttpResponse.json([
          {
            id: "u1",
            username: "john",
            email: "john@example.com",
            name: "John",
            role: "USER",
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z"
          }
        ]);
      })
    );

    const result = await listUsers(token);
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("john");
  });

  it("covers getMe/create/update/delete endpoints", async () => {
    server.use(
      http.get("http://localhost:3000/users/me", () =>
        HttpResponse.json({
          id: "u1",
          username: "john",
          email: "john@example.com",
          name: "John",
          role: "SUPERVISOR",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z"
        })
      ),
      http.post("http://localhost:3000/users", async ({ request }) => {
        const body = (await request.json()) as { email: string };
        return HttpResponse.json({
          id: "u2",
          username: "new_user",
          email: body.email,
          name: null,
          role: "USER",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z"
        });
      }),
      http.patch("http://localhost:3000/users/:id", async ({ params }) =>
        HttpResponse.json({
          id: String(params.id),
          username: "updated_user",
          email: "updated@example.com",
          name: "Updated",
          role: "USER",
          isActive: false,
          createdAt: "2026-01-01T00:00:00.000Z"
        })
      ),
      http.delete("http://localhost:3000/users/:id", () => HttpResponse.json({ ok: true }))
    );

    const me = await getMe(token);
    const created = await createUser(token, { email: "new@example.com", password: "password123" });
    const updated = await updateUser(token, "u2", { name: "Updated" });
    const deleted = await deleteUser(token, "u2");

    expect(me.role).toBe("SUPERVISOR");
    expect(created.email).toBe("new@example.com");
    expect(updated.username).toBe("updated_user");
    expect(deleted).toEqual({ ok: true });
  });
});
