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
const manifest = JSON.parse(readFileSync(`${root}/generation-manifest.json`));
const apply = process.argv.includes("--apply");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
mkdirSync("backup-artifacts/vehicle-photos", { recursive: true });
try {
  const vehicles =
    await sql`select * from public.vehicles where is_active order by name`;
  if (vehicles.length !== 12 || manifest.images.length !== 12)
    throw Error("Expected original twelve-car fleet");
  const previous =
    await sql`select * from public.vehicle_images where vehicle_id in (select id from public.vehicles where is_active) order by vehicle_id,sort_order`;
  if (previous.length)
    throw Error(
      "Existing galleries require review before installing this one-photo set",
    );
  const plan = vehicles.map((v) => {
    const slug = v.name.toLowerCase().replaceAll(" ", "-");
    if (!manifest.images.some((i) => i.slug === slug))
      throw Error(`No generated image for ${v.name}`);
    const bytes = readFileSync(`${root}/web/${slug}.jpg`);
    return {
      id: randomUUID(),
      vehicleId: v.id,
      name: v.name,
      plate: v.license_plate,
      slug,
      bytes,
      sha256: digest(bytes),
      storagePath: `${v.id}/showroom-2026-10-05-${randomUUID()}.jpg`,
    };
  });
  if (!apply) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          vehicles: plan.map(({ name, plate, sha256 }) => ({
            name,
            plate,
            sha256,
          })),
        },
        null,
        2,
      ),
    );
  } else {
    const backup = `backup-artifacts/vehicle-photos/before-showroom-${new Date().toISOString().replaceAll(":", "-")}.json`;
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
      const response = await fetch(image.publicUrl);
      if (
        !response.ok ||
        digest(Buffer.from(await response.arrayBuffer())) !== image.sha256
      )
        throw Error(`Upload verification failed: ${image.name}`);
      console.log(`Uploaded and verified ${image.name}`);
    }
    await sql.begin(async (tx) => {
      await tx`set local lock_timeout='10s'`;
      await tx`select pg_advisory_xact_lock(hashtext('synthetic-defense-baseline'))`;
      await tx`lock table public.vehicles, public.vehicle_images in share row exclusive mode`;
      const current =
        await tx`select id,image_url,is_active from public.vehicles where is_active`;
      if (
        current.length !== 12 ||
        current.some(
          (v) =>
            !vehicles.some(
              (old) => old.id === v.id && old.image_url === v.image_url,
            ),
        )
      )
        throw Error("Fleet changed during upload");
      const galleries =
        await tx`select id from public.vehicle_images where vehicle_id in (select id from public.vehicles where is_active)`;
      if (galleries.length) throw Error("Gallery changed during upload");
      for (const image of plan) {
        await tx`insert into public.vehicle_images(id,vehicle_id,storage_path,public_url,alt_text,sort_order,is_cover) values (${image.id},${image.vehicleId},${image.storagePath},${image.publicUrl},${`AI-generated illustrative ${image.name} in a modern showroom`},0,true)`;
        await tx`update public.vehicles set image_url=${image.publicUrl} where id=${image.vehicleId} and is_active`;
      }
      const covers =
        await tx`select v.id from public.vehicles v join public.vehicle_images i on i.vehicle_id=v.id and i.is_cover and i.public_url=v.image_url where v.is_active`;
      if (covers.length !== 12) throw Error("Cover verification failed");
    });
    const result = {
      project,
      installedAt: new Date().toISOString(),
      backup,
      images: plan.map(({ bytes, ...image }) => image),
    };
    writeFileSync(`${root}/installed.json`, JSON.stringify(result, null, 2));
    console.log(
      "PASS: twelve matching gallery covers and legacy image URLs installed; old files preserved.",
    );
  }
} finally {
  await sql.end();
}
