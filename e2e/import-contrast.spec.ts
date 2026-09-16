import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const evidenceRoot = ".omo/evidence/task-26-import-contrast/red";

test("import recovery guidance has sufficient contrast at mobile widths", async ({
  page,
}) => {
  mkdirSync(evidenceRoot, { recursive: true });
  const evidence: Array<{
    width: number;
    seriousOrCritical: Array<{
      id: string;
      impact: string | null;
      targets: string[];
    }>;
    screenshotPath: string;
  }> = [];

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "not-a-pdf.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a pdf"),
    });
    await page.getByRole("alert").waitFor();

    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const seriousOrCritical = result.violations
      .filter(({ impact }) => impact === "serious" || impact === "critical")
      .map(({ id, impact, nodes }) => ({
        id,
        impact: impact ?? null,
        targets: nodes.flatMap((node) => node.target.map(String)),
      }));
    const screenshotPath = `${evidenceRoot}/failing-first-${width}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    evidence.push({ width, seriousOrCritical, screenshotPath });
  }

  writeFileSync(
    `${evidenceRoot}/failing-first.json`,
    JSON.stringify(evidence, null, 2),
  );
  expect(
    evidence.flatMap(({ seriousOrCritical }) => seriousOrCritical),
  ).toEqual([]);
});
