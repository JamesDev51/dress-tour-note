import { expect, test } from "@playwright/test";

test.use({ isMobile: true, hasTouch: true });

for (const width of [320, 390]) {
  test(`touch feedback starts on contact and clears on drag or cancellation at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({
      reducedMotion: width === 320 ? "reduce" : "no-preference",
    });
    await page.goto("/tour/new");
    const button = page.getByRole("button", {
      name: "투어 만들기",
      exact: true,
    });
    const touch = await page.context().newCDPSession(page);
    const start = async () => {
      await button.scrollIntoViewIfNeeded();
      const bounds = await button.boundingBox();
      if (!bounds) throw new Error("버튼이 없어요.");
      const point = {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      };
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      return point;
    };
    const cancel = () =>
      touch.send("Input.dispatchTouchEvent", {
        type: "touchCancel",
        touchPoints: [],
      });

    await page.getByPlaceholder("예: 히똥").fill("터치 확인");
    const point = await start();
    await expect(button).toHaveAttribute("data-touch-pressed", "");
    await expect(button).toHaveCSS("scale", width === 320 ? "none" : "0.97");
    await expect(button).toHaveCSS("filter", "brightness(0.92)");
    await page.screenshot({ path: testInfo.outputPath("touch-held.png") });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: point.x, y: point.y - 30 }],
    });
    await expect(button).not.toHaveAttribute("data-touch-pressed");
    await cancel();
    await expect(page).toHaveURL(/\/tour\/new$/);

    await start();
    await expect(button).toHaveAttribute("data-touch-pressed", "");
    await cancel();
    await expect(button).not.toHaveAttribute("data-touch-pressed");
    await expect(button).toHaveCSS("filter", "none");
    await expect(button).toHaveCSS("scale", "none");

    await start();
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(page).not.toHaveURL(/\/tour\/new$/);
    await expect(page.getByRole("button", { name: /샵 추가/ })).toBeVisible();
    await expect(page.locator("[data-touch-pressed]")).toHaveCount(0);
  });
}
