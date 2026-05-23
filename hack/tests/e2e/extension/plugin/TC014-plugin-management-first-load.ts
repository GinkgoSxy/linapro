import type { Page, Route } from "@playwright/test";

import { test, expect } from "../../../fixtures/auth";
import { PluginPage } from "../../../pages/PluginPage";

const lightweightPluginID = "plugin-management-first-load-e2e";

function apiEnvelope(data: unknown) {
  return {
    code: 0,
    data,
    message: "success",
  };
}

function lightweightPluginRow() {
  return {
    abnormalReason: "",
    authorizationRequired: 1,
    authorizationStatus: "pending",
    autoEnableForNewTenants: false,
    autoEnableManaged: 0,
    description: "Used by E2E to verify lightweight plugin list rendering.",
    discoveredVersion: "v0.1.0",
    effectiveVersion: "v0.1.0",
    enabled: 0,
    hasMockData: 0,
    id: lightweightPluginID,
    installMode: "tenant_scoped",
    installed: 0,
    installedAt: null,
    lastUpgradeFailure: undefined,
    name: "Plugin Management First Load E2E",
    runtimeState: "normal",
    scopeNature: "tenant_aware",
    statusKey: "disabled",
    supportsMultiTenant: true,
    type: "dynamic",
    updatedAt: null,
    upgradeAvailable: false,
    version: "v0.1.0",
  };
}

function detailPluginRow() {
  return {
    ...lightweightPluginRow(),
    declaredRoutes: [
      {
        access: "authenticated",
        description: "Route detail returned only by the plugin detail API.",
        method: "GET",
        permission: `${lightweightPluginID}:report:query`,
        publicPath: "/governed-report",
        summary: "Governed report",
      },
    ],
    dependencyCheck: emptyDependencyCheck(),
    description: "Loaded from the detail endpoint with governance payload.",
    requestedHostServices: [
      {
        methods: ["get"],
        paths: ["reports/"],
        service: "storage",
      },
    ],
    authorizedHostServices: [],
  };
}

function emptyDependencyCheck() {
  return {
    autoInstallPlan: [],
    autoInstalled: [],
    blockers: [],
    cycle: [],
    dependencies: [],
    framework: {
      currentVersion: "v0.1.0",
      requiredVersion: "",
      status: "not_declared",
    },
    manualInstallRequired: [],
    reverseBlockers: [],
    reverseDependents: [],
    softUnsatisfied: [],
    targetId: lightweightPluginID,
  };
}

async function mockPluginManagementApis(page: Page) {
  let detailRequestCount = 0;

  await page.route("**/api/v1/plugins**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === "GET" && /\/api\/v1\/plugins$/u.test(path)) {
      const id = url.searchParams.get("id")?.trim();
      const rows =
        id && !lightweightPluginID.includes(id) ? [] : [lightweightPluginRow()];
      await route.fulfill({
        json: apiEnvelope({
          list: rows,
          total: rows.length,
        }),
      });
      return;
    }

    if (request.method() === "GET" && path.endsWith("/plugins/dynamic")) {
      await route.fulfill({
        json: apiEnvelope({
          list: [],
        }),
      });
      return;
    }

    if (
      request.method() === "GET" &&
      path.endsWith(`/plugins/${lightweightPluginID}`)
    ) {
      detailRequestCount += 1;
      await route.fulfill({
        json: apiEnvelope(detailPluginRow()),
      });
      return;
    }

    if (
      request.method() === "GET" &&
      path.endsWith(`/plugins/${lightweightPluginID}/dependencies`)
    ) {
      await route.fulfill({
        json: apiEnvelope(emptyDependencyCheck()),
      });
      return;
    }

    await route.continue();
  });

  return {
    detailRequestCount: () => detailRequestCount,
  };
}

function waitForPluginDetailResponse(page: Page) {
  return page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() === "GET" &&
      new URL(response.url()).pathname.endsWith(
        `/plugins/${lightweightPluginID}`,
      )
    );
  });
}

test.describe("TC-14 插件管理首次加载优化", () => {
  test("TC-14a: 轻量列表缺少治理重字段时仍可渲染并按需加载详情", async ({
    adminPage,
  }) => {
    const pageErrors: string[] = [];
    adminPage.on("pageerror", (error) => pageErrors.push(error.message));
    const api = await mockPluginManagementApis(adminPage);

    const pluginPage = new PluginPage(adminPage);
    await pluginPage.gotoManage();
    await pluginPage.searchByPluginId(lightweightPluginID);

    await expect(pluginPage.pluginRow(lightweightPluginID)).toBeVisible();
    await expect(pluginPage.pluginNameCell(lightweightPluginID)).toContainText(
      "Plugin Management First Load E2E",
    );
    await expect(
      pluginPage.pluginRuntimeState(lightweightPluginID),
    ).toContainText(/正常|Normal/iu);
    expect(api.detailRequestCount()).toBe(0);
    expect(pageErrors).toEqual([]);

    const detailResponsePromise = waitForPluginDetailResponse(adminPage);
    await pluginPage.openPluginDetail(lightweightPluginID);
    const detailResponse = await detailResponsePromise;
    expect(detailResponse.ok()).toBe(true);

    await expect(pluginPage.pluginDetailModal()).toContainText(
      "Loaded from the detail endpoint with governance payload.",
    );
    await expect(pluginPage.pluginDetailModal()).toContainText("reports/");
    await expect(
      adminPage.getByTestId("plugin-route-review-list").last(),
    ).toContainText("/governed-report");
    expect(api.detailRequestCount()).toBe(1);
    expect(pageErrors).toEqual([]);
  });

  test("TC-14b: 安装授权弹窗打开时先读取完整详情再展示授权范围", async ({
    adminPage,
  }) => {
    const api = await mockPluginManagementApis(adminPage);

    const pluginPage = new PluginPage(adminPage);
    await pluginPage.gotoManage();
    await pluginPage.searchByPluginId(lightweightPluginID);
    expect(api.detailRequestCount()).toBe(0);

    const detailResponsePromise = waitForPluginDetailResponse(adminPage);
    await pluginPage.openInstallAuthorization(lightweightPluginID);
    const detailResponse = await detailResponsePromise;
    expect(detailResponse.ok()).toBe(true);

    await expect(pluginPage.hostServiceAuthModal()).toContainText("reports/");
    await expect(
      adminPage
        .getByTestId(
          `plugin-host-service-auth-list-${lightweightPluginID}-storage`,
        )
        .last(),
    ).toContainText("reports/");
    await expect(
      adminPage.getByTestId("plugin-route-review-list").last(),
    ).toContainText("/governed-report");
    expect(api.detailRequestCount()).toBe(1);
  });
});
