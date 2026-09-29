import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "vehicle-images";
const MAX_IMAGES = 5;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function error(message: string, status = 400) {
  return Response.json({ message }, { status });
}

async function owner() {
  try {
    return await requireRole("Owner/Admin");
  } catch (cause) {
    return cause instanceof Error && cause.message === "forbidden"
      ? null
      : null;
  }
}

export const Route = createFileRoute("/api/vehicle-images")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const vehicleId = new URL(request.url).searchParams.get("vehicleId");
        if (!vehicleId) return error("Vehicle is required.");
        const client = getSupabaseServerClient() as any;
        const result = await client
          .from("vehicle_images")
          .select("id, vehicle_id, public_url, alt_text, sort_order, is_cover")
          .eq("vehicle_id", vehicleId)
          .order("is_cover", { ascending: false })
          .order("sort_order");
        return result.error
          ? error("Unable to load vehicle photos.", 503)
          : Response.json({ images: result.data ?? [] });
      },
      POST: async ({ request }) => {
        if (!(await owner())) return error("Forbidden.", 403);
        const form = await request.formData();
        const vehicleId = String(form.get("vehicleId") ?? "");
        const file = form.get("file");
        if (!vehicleId || !(file instanceof File)) return error("Choose an image to upload.");
        if (!ALLOWED_TYPES.has(file.type) || file.size > 5 * 1024 * 1024)
          return error("Use a JPG, PNG, or WebP image up to 5 MB.");
        const client = getSupabaseServerClient() as any;
        const current = await client
          .from("vehicle_images")
          .select("id, sort_order")
          .eq("vehicle_id", vehicleId);
        if (current.error) return error("Unable to check vehicle photos.", 503);
        if ((current.data?.length ?? 0) >= MAX_IMAGES) return error("A vehicle can have up to five photos.", 409);
        const usedSortOrders = new Set(
          (current.data ?? []).map((image: { sort_order: number }) => image.sort_order),
        );
        const sortOrder = Array.from({ length: MAX_IMAGES }, (_, index) => index).find(
          (index) => !usedSortOrders.has(index),
        );
        if (sortOrder === undefined) return error("A vehicle can have up to five photos.", 409);
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = `${vehicleId}/${crypto.randomUUID()}.${extension}`;
        const upload = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) return error("Unable to store vehicle photo.", 503);
        const publicUrl = client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const record = await client.from("vehicle_images").insert({
          vehicle_id: vehicleId,
          storage_path: path,
          public_url: publicUrl,
          sort_order: sortOrder,
          is_cover: (current.data?.length ?? 0) === 0,
        }).select("id, vehicle_id, public_url, alt_text, sort_order, is_cover").single();
        if (record.error) {
          await client.storage.from(BUCKET).remove([path]);
          return error("Unable to save vehicle photo.", 503);
        }
        if (record.data.is_cover) {
          const legacyCover = await client
            .from("vehicles")
            .update({ image_url: publicUrl })
            .eq("id", vehicleId);
          if (legacyCover.error) return error("Photo uploaded, but the customer catalog could not be updated.", 503);
        }
        return Response.json({ image: record.data }, { status: 201 });
      },
      PATCH: async ({ request }) => {
        if (!(await owner())) return error("Forbidden.", 403);
        const body = await request.json().catch(() => null) as { imageId?: string; vehicleId?: string; action?: string } | null;
        if (!body?.imageId || !body.vehicleId || body.action !== "set-cover") return error("Invalid photo action.");
        const client = getSupabaseServerClient() as any;
        const target = await client.from("vehicle_images").select("public_url").eq("id", body.imageId).eq("vehicle_id", body.vehicleId).single();
        if (target.error || !target.data) return error("Vehicle photo was not found.", 404);
        const clearedCover = await client
          .from("vehicle_images")
          .update({ is_cover: false })
          .eq("vehicle_id", body.vehicleId);
        if (clearedCover.error) return error("Unable to update the cover photo.", 503);
        const updated = await client.from("vehicle_images").update({ is_cover: true }).eq("id", body.imageId).eq("vehicle_id", body.vehicleId);
        if (updated.error) return error("Unable to update the cover photo.", 503);
        const legacyCover = await client
          .from("vehicles")
          .update({ image_url: target.data.public_url })
          .eq("id", body.vehicleId);
        if (legacyCover.error) return error("Cover photo was updated, but the customer catalog could not be updated.", 503);
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        if (!(await owner())) return error("Forbidden.", 403);
        const body = await request.json().catch(() => null) as { imageId?: string; vehicleId?: string } | null;
        if (!body?.imageId || !body.vehicleId) return error("Vehicle photo is required.");
        const client = getSupabaseServerClient() as any;
        const found = await client.from("vehicle_images").select("storage_path, is_cover").eq("id", body.imageId).eq("vehicle_id", body.vehicleId).single();
        if (found.error || !found.data) return error("Vehicle photo was not found.", 404);
        const removed = await client.from("vehicle_images").delete().eq("id", body.imageId);
        if (removed.error) return error("Unable to remove vehicle photo.", 503);
        const storageRemoval = await client.storage.from(BUCKET).remove([found.data.storage_path]);
        if (storageRemoval.error) return error("Photo was removed, but its stored file could not be removed.", 503);
        if (found.data.is_cover) {
          const next = await client.from("vehicle_images").select("id, public_url").eq("vehicle_id", body.vehicleId).order("sort_order").limit(1).maybeSingle();
          if (next.error) return error("Photo was removed, but the next cover photo could not be selected.", 503);
          if (next.data) {
            const nextCover = await client.from("vehicle_images").update({ is_cover: true }).eq("id", next.data.id);
            if (nextCover.error) return error("Photo was removed, but the next cover photo could not be set.", 503);
            const legacyCover = await client.from("vehicles").update({ image_url: next.data.public_url }).eq("id", body.vehicleId);
            if (legacyCover.error) return error("Photo was removed, but the customer catalog could not be updated.", 503);
          } else {
            const legacyCover = await client.from("vehicles").update({ image_url: null }).eq("id", body.vehicleId);
            if (legacyCover.error) return error("Photo was removed, but the customer catalog could not be updated.", 503);
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
