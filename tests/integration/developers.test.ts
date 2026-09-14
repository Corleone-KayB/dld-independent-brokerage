import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { listDevelopers, getDeveloperBySlug, getProjectBySlug } from "@/modules/developers/service";

describe("developer portal integration (requires local Postgres + seed data)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lists seeded developers", async () => {
    const result = await listDevelopers();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some((d) => d.slug === "meraas-demo-developer")).toBe(true);
  });

  it("returns a developer profile with its published projects", async () => {
    const developer = await getDeveloperBySlug("meraas-demo-developer");
    expect(developer).not.toBeNull();
    expect(developer?.projects.some((p) => p.slug === "jvc-skyline-residences")).toBe(true);
  });

  it("returns a published project with its units, ordered by price ascending", async () => {
    const project = await getProjectBySlug("jvc-skyline-residences");
    expect(project).not.toBeNull();
    expect(project?.units.length).toBeGreaterThanOrEqual(3);
    const prices = project?.units.map((u) => Number(u.price)) ?? [];
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("hides a non-published project from public lookup", async () => {
    const draftProject = await prisma.project.findFirst({ where: { status: { not: "PUBLISHED" } } });
    if (draftProject) {
      const found = await getProjectBySlug(draftProject.slug, { publicOnly: true });
      expect(found).toBeNull();
    }
  });
});
