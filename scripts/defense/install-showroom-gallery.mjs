import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const root = "output/fleet-showroom-2026-10-05";
const project = "vkfacfjkwomhfvrieaza";
const api = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
if (!api || new URL(api).hostname !== `${project}.supabase.co`)
  throw Error("Unexpected project");
const url = new URL(readFileSync("supabase/.temp/pooler-url", "utf8").trim());
if (decodeURIComponent(url.username) !== `postgres.${project}`)
  throw Error("Database project mismatch");
url.password ||= process.env.SUPABASE_DB_PASSWORD;
const sql = postgres(url.toString(), {
  ssl: "require",
  max: 1,
  prepare: false,
});
const client = createClient(api, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const manifest = JSON.parse(
  readFileSync(`${root}/gallery-final-manifest.json`),
);
const specs = JSON.parse(readFileSync(`${root}/demo-specifications.json`));
const initial = JSON.parse(readFileSync(`${root}/installed.json`));
const apply = process.argv.includes("--apply");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const views = ["rear", "front-cabin", "passenger-cabin"];
const labels = {
  rear: "rear exterior",
  "front-cabin": "dashboard and front seats",
  "passenger-cabin": "passenger seating",
};
mkdirSync("backup-artifacts/vehicle-photos", { recursive: true });

try {
  const vehicles =
    await sql`select * from public.vehicles where is_active order by id`;
  const previous =
    await sql`select * from public.vehicle_images where vehicle_id in (select id from public.vehicles where is_active) order by id`;
  if (
    vehicles.length !== 12 ||
    specs.vehicles.length !== 12 ||
    manifest.images.length !== 36
  )
    throw Error("Expected twelve vehicles and thirty-six images");
  if (previous.length !== 12)
    throw Error(
      "Expected existing one-photo galleries; review changed galleries before installation",
    );
  for (const v of vehicles) {
    const spec = specs.vehicles.find((s) => s.vehicleId === v.id);
    const cover = previous.filter((i) => i.vehicle_id === v.id);
    const old = initial.images.find((i) => i.vehicleId === v.id);
    if (
      !spec ||
      spec.name !== v.name ||
      spec.plate !== v.license_plate ||
      spec.transmission !== v.transmission ||
      spec.fuelType !== v.fuel_type ||
      spec.seatCapacity !== v.seat_capacity
    )
      throw Error(`Fleet specification mismatch: ${v.name}`);
    if (
      cover.length !== 1 ||
      !cover[0].is_cover ||
      cover[0].sort_order !== 0 ||
      cover[0].id !== old?.id ||
      cover[0].public_url !== v.image_url
    )
      throw Error(`Existing cover mismatch: ${v.name}`);
  }
  const plan = specs.vehicles.flatMap((v) =>
    views.map((view, index) => {
      if (
        manifest.images.filter((i) => i.slug === v.slug && i.view === view)
          .length !== 1
      )
        throw Error(`Missing or duplicate generated view: ${v.slug}/${view}`);
      const bytes = readFileSync(`${root}/gallery-web/${v.slug}-${view}.jpg`);
      if (bytes.length > 5 * 1024 * 1024)
        throw Error("Image exceeds upload limit");
      return {
        id: randomUUID(),
        vehicleId: v.vehicleId,
        name: v.name,
        slug: v.slug,
        view,
        sortOrder: index + 1,
        bytes,
        sha256: digest(bytes),
        storagePath: `${v.vehicleId}/showroom-gallery-2026-10-05-${view}-${randomUUID()}.jpg`,
      };
    }),
  );
  if (!apply) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          vehicles: vehicles.length,
          additionalPhotos: plan.length,
          preserveExistingCovers: true,
        },
        null,
        2,
      ),
    );
  } else {
    const backup = `backup-artifacts/vehicle-photos/before-gallery-${new Date().toISOString().replaceAll(":", "-")}.json`;
    writeFileSync(
      backup,
      JSON.stringify(
        {
          project,
          createdAt: new Date().toISOString(),
          vehicles,
          vehicle_images: previous,
        },
        null,
        2,
      ),
      { flag: "wx", mode: 0o600 },
    );
    const uploadManifest = `${root}/gallery-upload-progress.json`;
    for (const image of plan) {
      const upload = await client.storage
        .from("vehicle-images")
        .upload(image.storagePath, image.bytes, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
      if (upload.error) throw upload.error;
      image.publicUrl = client.storage
        .from("vehicle-images")
        .getPublicUrl(image.storagePath).data.publicUrl;
      // Record each successful upload for recovery without deleting existing files.
      writeFileSync(
        uploadManifest,
        JSON.stringify(
          {
            project,
            backup,
            images: plan.filter((i) => i.publicUrl).map(({ bytes, ...i }) => i),
          },
          null,
          2,
        ),
      );
      const response = await fetch(image.publicUrl);
      if (
        !response.ok ||
        digest(Buffer.from(await response.arrayBuffer())) !== image.sha256
      )
        throw Error(`Upload verification failed: ${image.name}/${image.view}`);
      console.log(`Uploaded and verified ${image.name}: ${image.view}`);
    }
    await sql.begin(async (tx) => {
      await tx`set local lock_timeout='10s'`;
      await tx`set local statement_timeout='30s'`;
      await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
      await tx`lock table public.vehicles, public.vehicle_images in share row exclusive mode`;
      const current =
        await tx`select * from public.vehicles where is_active order by id`;
      const galleries =
        await tx`select * from public.vehicle_images where vehicle_id in (select id from public.vehicles where is_active) order by id`;
      if (
        JSON.stringify(current) !== JSON.stringify(vehicles) ||
        JSON.stringify(galleries) !== JSON.stringify(previous)
      )
        throw Error(
          "Fleet or galleries changed during upload; installation stopped",
        );
      for (const image of plan) {
        await tx`insert into public.vehicle_images(id,vehicle_id,storage_path,public_url,alt_text,sort_order,is_cover) values (${image.id},${image.vehicleId},${image.storagePath},${image.publicUrl},${`AI-generated illustrative ${image.name}: ${labels[image.view]}`},${image.sortOrder},false)`;
      }
      const result =
        await tx`select v.id,v.image_url,count(i.id)::int as photos,count(i.id) filter (where i.is_cover)::int as covers,max(i.public_url) filter (where i.is_cover) as cover_url from public.vehicles v join public.vehicle_images i on i.vehicle_id=v.id where v.is_active group by v.id`;
      if (
        result.length !== 12 ||
        result.some(
          (v) =>
            v.photos !== 4 || v.covers !== 1 || v.image_url !== v.cover_url,
        )
      )
        throw Error("Gallery verification failed");
    });
    writeFileSync(
      `${root}/gallery-installed.json`,
      JSON.stringify(
        {
          project,
          installedAt: new Date().toISOString(),
          backup,
          images: plan.map(({ bytes, ...image }) => image),
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: all twelve galleries contain four photos; existing covers and vehicle records preserved.",
    );
  }
} finally {
  await sql.end();
}
