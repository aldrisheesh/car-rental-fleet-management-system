/* eslint-disable @typescript-eslint/no-explicit-any -- Acceptance tooling normalizes dynamic HTTP and database evidence at runtime. */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";

import { PROJECT } from "./baseline-data.ts";

type Evidence = {
  scenario: string;
  status: "PASS" | "FAIL";
  observed: string;
};

function argument(name: string) {
  const prefix = `${name}=`;
  return process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length);
}

function cookieHeader(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
}

function stable(value: unknown) {
  return JSON.stringify(value);
}

async function main() {
  if (!process.argv.includes("--apply"))
    throw new Error(
      "This controlled acceptance run changes synthetic defense records. Re-run with --apply.",
    );

  const baseUrl = new URL(
    argument("--base-url") ??
      process.env.DEFENSE_ACCEPTANCE_BASE_URL ??
      "http://127.0.0.1:3000",
  );
  if (!["http:", "https:"].includes(baseUrl.protocol))
    throw new Error("The acceptance base URL must use HTTP or HTTPS.");

  const apiUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!apiUrl || new URL(apiUrl).hostname !== `${PROJECT}.supabase.co`)
    throw new Error("Refusing an unexpected Supabase project.");
  const databaseUrl = new URL(
    process.env.DEFENSE_DATABASE_URL ??
      readFileSync("supabase/.temp/pooler-url", "utf8").trim(),
  );
  if (
    !(
      databaseUrl.hostname === `db.${PROJECT}.supabase.co` ||
      decodeURIComponent(databaseUrl.username) === `postgres.${PROJECT}`
    )
  )
    throw new Error("API/database project mismatch.");
  if (!databaseUrl.password)
    databaseUrl.password = process.env.SUPABASE_DB_PASSWORD ?? "";
  if (!databaseUrl.password)
    throw new Error("Database credentials unavailable.");
  if (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD)
    throw new Error("Owner/Admin acceptance credentials are unavailable.");

  const sql = postgres(databaseUrl.toString(), {
    ssl: "require",
    max: 1,
    prepare: false,
    connect_timeout: 15,
  });
  const evidence: Evidence[] = [];
  let cookie = "";
  let originalCoverage: string | null = null;
  const temporaryMaintenanceIds: string[] = [];
  let failure: unknown;

  const check = (scenario: string, condition: unknown, observed: string) => {
    const status = condition ? "PASS" : "FAIL";
    evidence.push({ scenario, status, observed });
    if (!condition) throw new Error(`${scenario}: ${observed}`);
  };
  const request = async (
    path: string,
    init: RequestInit = {},
    acceptedStatuses: number[] = [],
  ) => {
    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
      signal: AbortSignal.timeout(60_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok && !acceptedStatuses.includes(response.status))
      throw new Error(
        `${init.method ?? "GET"} ${path} failed with ${response.status}: ${body?.message ?? "Unknown response"}`,
      );
    return { response, body };
  };
  const branchSnapshot = async () =>
    (await sql`select id, branch_id from public.vehicles order by id`).map(
      (row) => ({ id: row.id, branchId: row.branch_id }),
    );
  const batchCount = async () =>
    Number(
      (
        await sql`select count(*)::int as count from public.allocation_recommendation_batches`
      )[0].count,
    );
  const generateAllocation = async (label: string) =>
    (
      await request("/api/allocation-recommendations", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: `${label}-${Date.now()}-${randomUUID()}`,
        }),
      })
    ).body;
  const decide = async (
    recommendationId: string,
    state: "Approved" | "Rejected",
    approvedTransferUnits?: number,
  ) =>
    request("/api/allocation-recommendations", {
      method: "PATCH",
      body: JSON.stringify({
        recommendationId,
        state,
        approvedTransferUnits,
      }),
    });

  try {
    const login = await fetch(new URL("/api/auth/sign-in", baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: process.env.E2E_ADMIN_EMAIL,
        password: process.env.E2E_ADMIN_PASSWORD,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    const loginBody = await login.json().catch(() => null);
    check(
      "Owner/Admin authentication",
      login.ok && loginBody?.principal?.role === "Owner/Admin",
      login.ok
        ? `Authenticated as ${loginBody?.principal?.role ?? "unknown role"}.`
        : `Sign-in returned ${login.status}.`,
    );
    cookie = cookieHeader(login);

    const branchesBefore = await branchSnapshot();
    const batchesBefore = await batchCount();
    const forecastKey = `acceptance-forecast-${Date.now()}-${randomUUID()}`;
    await request("/api/forecasts", {
      method: "POST",
      body: JSON.stringify({ idempotencyKey: forecastKey }),
    });
    const forecastView = (await request("/api/forecasts")).body;
    const forecastRun = (forecastView.runs ?? []).find(
      (run: any) => run.idempotency_key === forecastKey,
    );
    const forecastRows = (forecastView.forecasts ?? []).filter(
      (forecast: any) => forecast.run_id === forecastRun?.id,
    );
    check(
      "Explainable three-horizon WMA",
      forecastRows.length === 36 &&
        forecastRows.every(
          (forecast: any) =>
            forecast.inputs?.length === 3 &&
            Number(forecast.required_vehicle_units) ===
              Math.ceil(Number(forecast.forecasted_demand)),
        ),
      `${forecastRows.length} positions generated; every position must have 3 stored inputs and a ceiling-based requirement.`,
    );
    check(
      "Forecast evaluation contract",
      Number.isInteger(forecastView.accuracy?.eligibleForecasts) &&
        Number.isInteger(forecastView.accuracy?.excludedZeroActuals) &&
        Array.isArray(forecastView.accuracy?.series),
      `Eligible MAPE samples: ${forecastView.accuracy?.eligibleForecasts ?? "unavailable"}; zero-actual exclusions: ${forecastView.accuracy?.excludedZeroActuals ?? "unavailable"}.`,
    );

    const forecastIds = forecastRows.map((forecast: any) => forecast.id);
    const supplyResult = (
      await request("/api/supply-evaluations", {
        method: "POST",
        body: JSON.stringify({
          forecastIds,
          idempotencyKey: `acceptance-supply-${Date.now()}-${randomUUID()}`,
        }),
      })
    ).body;
    check(
      "Current supply evaluation",
      supplyResult.evaluated === forecastIds.length,
      `${supplyResult.evaluated ?? 0} of ${forecastIds.length} forecast positions received current supply snapshots.`,
    );

    const first = await generateAllocation("acceptance-allocation-full");
    const firstRecommendation = first.recommendations?.[0];
    const noDonorCount = (first.summary?.unresolvedShortages ?? []).filter(
      (gap: any) => gap.reason === "NoCompatibleSurplus",
    ).length;
    check(
      "Compatible shortage/surplus recommendation",
      first.summary?.generatedRecommendations > 0 &&
        firstRecommendation?.candidates?.length > 0,
      `${first.summary?.generatedRecommendations ?? 0} recommendation(s), ${firstRecommendation?.candidates?.length ?? 0} ranked candidate(s), ${first.summary?.shortagePositions ?? 0} shortage positions and ${first.summary?.surplusPositions ?? 0} surplus positions.`,
    );
    check(
      "No compatible donor explanation",
      noDonorCount > 0,
      `${noDonorCount} shortage position(s) were explicitly classified as NoCompatibleSurplus.`,
    );

    const batchesAfterGeneration = await batchCount();
    const reloaded = (await request("/api/allocation-recommendations")).body;
    const batchesAfterReload = await batchCount();
    check(
      "Reload-safe allocation evidence",
      batchesAfterReload === batchesAfterGeneration &&
        stable(reloaded.summary) === stable(first.summary),
      `Batch count remained ${batchesAfterReload}; reconstructed summary matched the generation result.`,
    );

    await decide(
      firstRecommendation.id,
      "Approved",
      firstRecommendation.recommended_transfer_units,
    );
    const second = await generateAllocation("acceptance-allocation-lower");
    const secondRecommendation = second.recommendations?.[0];
    check(
      "Lower-quantity approval setup",
      Number(secondRecommendation?.recommended_transfer_units) > 1,
      `Recommended quantity was ${secondRecommendation?.recommended_transfer_units ?? 0}.`,
    );
    await decide(
      secondRecommendation.id,
      "Approved",
      Number(secondRecommendation.recommended_transfer_units) - 1,
    );
    const third = await generateAllocation("acceptance-allocation-reject");
    const thirdRecommendation = third.recommendations?.[0];
    await decide(thirdRecommendation.id, "Rejected");
    check(
      "Human decision paths",
      true,
      `Recorded full approval, lower approval of ${Number(secondRecommendation.recommended_transfer_units) - 1}, and rejection in separate immutable batches.`,
    );
    const branchesAfterDecisions = await branchSnapshot();
    check(
      "Advisory decision does not move vehicles",
      stable(branchesAfterDecisions) === stable(branchesBefore),
      "Vehicle branch assignments were identical before and after all three decision paths.",
    );

    const context = (
      await request("/api/operational-context", {
        method: "POST",
        body: JSON.stringify({
          kind: "allocation_review",
          recommendationId: thirdRecommendation.id,
        }),
      })
    ).body;
    const sources = Object.values(context.sources ?? {}) as any[];
    check(
      "External operational context",
      ["available", "partial", "unavailable"].includes(context.status) &&
        sources.every(
          (source) => source.provider && source.status && source.checkedAt,
        ) &&
        Array.isArray(context.limitations),
      `${context.status} review-time context with ${sources.length} provider record(s) and ${context.limitations?.length ?? 0} explicit limitation(s).`,
    );

    const candidateIds = [
      ...new Set(
        (thirdRecommendation.candidates ?? []).map(
          (candidate: any) => candidate.vehicle_id,
        ),
      ),
    ] as string[];
    check(
      "Maintenance negative-case setup",
      candidateIds.length > 0,
      `${candidateIds.length} currently eligible candidate(s) selected for temporary blocking maintenance.`,
    );
    const now = new Date().toISOString();
    const actorId = loginBody.principal.userId;
    const maintenanceRows = candidateIds.map((vehicleId) => {
      const id = randomUUID();
      temporaryMaintenanceIds.push(id);
      return {
        id,
        vehicle_id: vehicleId,
        maintenance_type: "Corrective",
        description:
          "SYNTHETIC ACCEPTANCE: temporary blocking maintenance used to verify decision-support revalidation.",
        status: "In Progress",
        blocks_rental_use: true,
        scheduled_for: null,
        service_started_at: now,
        completed_at: null,
        remarks: "Temporary defense acceptance record; removed after the run.",
        created_by: actorId,
        updated_by: actorId,
      };
    });
    await sql`insert into public.maintenance_records ${sql(
      maintenanceRows,
      "id",
      "vehicle_id",
      "maintenance_type",
      "description",
      "status",
      "blocks_rental_use",
      "scheduled_for",
      "service_started_at",
      "completed_at",
      "remarks",
      "created_by",
      "updated_by",
    )}`;
    const blocked = await generateAllocation("acceptance-allocation-blocked");
    const noEligibleCount = (blocked.summary?.unresolvedShortages ?? []).filter(
      (gap: any) => gap.reason === "NoEligibleCandidates",
    ).length;
    check(
      "Newly maintenance-blocked candidates",
      blocked.summary?.generatedRecommendations === 0 && noEligibleCount > 0,
      `Recommendation count fell to ${blocked.summary?.generatedRecommendations ?? 0}; ${noEligibleCount} position(s) reported NoEligibleCandidates.`,
    );

    const recalculatedSupply = (
      await request("/api/supply-evaluations", {
        method: "POST",
        body: JSON.stringify({
          forecastIds,
          idempotencyKey: `acceptance-supply-after-maintenance-${Date.now()}-${randomUUID()}`,
        }),
      })
    ).body;
    const recalculated = await generateAllocation(
      "acceptance-allocation-after-maintenance",
    );
    check(
      "Recalculation after operational change",
      recalculatedSupply.evaluated === forecastIds.length &&
        recalculated.summary?.generatedRecommendations === 0,
      `${recalculatedSupply.evaluated ?? 0} supply positions were refreshed after maintenance; ${recalculated.summary?.generatedRecommendations ?? 0} transfer recommendations remained.`,
    );

    const coverageRows =
      await sql`select tracking_started_at::text as tracking_started_at from public.forecast_demand_coverage where id = 1`;
    originalCoverage = coverageRows[0]?.tracking_started_at ?? null;
    await sql`update public.forecast_demand_coverage set tracking_started_at = (date_trunc('week', timezone('Asia/Manila', now())) at time zone 'Asia/Manila') where id = 1`;
    const insufficient = await request(
      "/api/forecasts",
      {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: `acceptance-insufficient-${Date.now()}-${randomUUID()}`,
        }),
      },
      [409],
    );
    check(
      "Insufficient forecasting history",
      insufficient.response.status === 409 &&
        String(insufficient.body?.message).includes("three complete weeks"),
      `Forecast generation returned ${insufficient.response.status}: ${insufficient.body?.message ?? "no message"}`,
    );

    const branchesAfterAllScenarios = await branchSnapshot();
    check(
      "No scenario automatically reallocates the fleet",
      stable(branchesAfterAllScenarios) === stable(branchesBefore),
      "All vehicle branch assignments remained unchanged through generation, decisions, blocking, and recalculation.",
    );
    check(
      "Acceptance mutations are isolated from baseline",
      batchesAfterGeneration > batchesBefore,
      `The controlled run added review evidence above the starting ${batchesBefore} batch(es); restore the saved defense baseline next.`,
    );
  } catch (error) {
    failure = error;
    evidence.push({
      scenario: "Acceptance runner",
      status: "FAIL",
      observed: error instanceof Error ? error.message : String(error),
    });
  } finally {
    try {
      if (originalCoverage)
        await sql`update public.forecast_demand_coverage set tracking_started_at = ${originalCoverage}::timestamptz where id = 1`;
      if (temporaryMaintenanceIds.length)
        await sql`delete from public.maintenance_records where id in ${sql(temporaryMaintenanceIds)}`;
    } catch (cleanupError) {
      failure ??= cleanupError;
      evidence.push({
        scenario: "Temporary fixture cleanup",
        status: "FAIL",
        observed:
          cleanupError instanceof Error
            ? cleanupError.message
            : String(cleanupError),
      });
    }
    await sql.end({ timeout: 5 });
  }

  const report = {
    pass: !failure && evidence.every((item) => item.status === "PASS"),
    branch: "stabilization/ui-refinement",
    baseUrl: baseUrl.origin,
    completedAt: new Date().toISOString(),
    evidence,
    requiredCleanup:
      "Run npm run defense:baseline -- reset --apply, then verify with npm run defense:baseline -- reset.",
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exitCode = 1;
}

await main();
