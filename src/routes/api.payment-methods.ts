import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/auth.server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const fail = (message: string, status = 400) =>
  Response.json({ message }, { status });
const qrBucket = "payment-method-qr";
const qrMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxQrImageSize = 5 * 1024 * 1024;
const paymentMethodSelect =
  "id,code,label,recipient_name,account_number,qr_image_path,is_active,created_at";

export const Route = createFileRoute("/api/payment-methods")({
  server: { handlers: { GET: listMethods, POST: saveMethod } },
});

async function listMethods() {
  try {
    await requireRole("Owner/Admin");
    // Supabase storage metadata is not part of the generated database types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;
    const result = await client
      .from("payment_methods")
      .select(paymentMethodSelect)
      .order("label");
    if (result.error) return fail("Unable to load payment methods.", 503);
    return Response.json({
      paymentMethods: await attachQrUrls(client, result.data ?? []),
    });
  } catch (cause) {
    return fail(
      cause instanceof Error && cause.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      cause instanceof Error && cause.message === "forbidden" ? 403 : 401,
    );
  }
}

async function saveMethod({ request }: { request: Request }) {
  try {
    await requireRole("Owner/Admin");
    const form = await request.formData();
    const action = text(form.get("action"));
    const label = text(form.get("label"), 100);
    const isActiveValue = text(form.get("isActive"), 5);
    const isActive = isActiveValue === "true";
    const recipientName = nullableText(form.get("recipientName"), 120);
    const accountNumber = nullableText(form.get("accountNumber"), 120);
    const qrImage = form.get("qrImage");
    const qrError = validateQrImage(qrImage);

    if (!label) return fail("A payment method label is required.");
    if (isActiveValue !== "true" && isActiveValue !== "false") {
      return fail(
        "Choose whether this payment method is available to customers.",
      );
    }
    if (qrError) return fail(qrError);

    // Supabase storage metadata is not part of the generated database types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getSupabaseServerClient() as any;

    if (action === "create") {
      if (!(qrImage instanceof File) || qrImage.size === 0) {
        return fail("Upload a QR image for this payment method.");
      }
      const created = await createPaymentMethod(client, {
        label,
        recipientName,
        accountNumber,
        isActive,
      });
      if (created instanceof Response) return created;

      const uploaded = await uploadQrImage(
        client,
        created.id as string,
        qrImage,
      );
      if (uploaded instanceof Response) {
        await client.from("payment_methods").delete().eq("id", created.id);
        return uploaded;
      }
      const saved = await client
        .from("payment_methods")
        .update({ qr_image_path: uploaded })
        .eq("id", created.id)
        .select(paymentMethodSelect)
        .single();
      if (saved.error) {
        await client.storage.from(qrBucket).remove([uploaded]);
        await client.from("payment_methods").delete().eq("id", created.id);
        return fail("Unable to save the payment QR image.", 503);
      }
      return Response.json(
        { paymentMethod: await attachQrUrl(client, saved.data) },
        { status: 201 },
      );
    }

    if (action === "update") {
      const id = text(form.get("id"), 100);
      if (!id) return fail("Payment method reference is required.");
      const current = await client
        .from("payment_methods")
        .select("id,qr_image_path")
        .eq("id", id)
        .maybeSingle();
      if (current.error)
        return fail("Unable to update the payment method.", 503);
      if (!current.data) return fail("Payment method not found.", 404);
      if (
        !current.data.qr_image_path &&
        (!(qrImage instanceof File) || qrImage.size === 0)
      ) {
        return fail("Upload a QR image for this payment method.");
      }

      let qrImagePath = current.data.qr_image_path;
      if (qrImage instanceof File && qrImage.size > 0) {
        const uploaded = await uploadQrImage(client, id, qrImage);
        if (uploaded instanceof Response) return uploaded;
        qrImagePath = uploaded;
      }
      const saved = await client
        .from("payment_methods")
        .update({
          label,
          recipient_name: recipientName,
          account_number: accountNumber,
          instructions: "",
          is_demo: false,
          is_active: isActive,
          qr_image_path: qrImagePath,
        })
        .eq("id", id)
        .select(paymentMethodSelect)
        .maybeSingle();
      if (saved.error) {
        if (qrImagePath !== current.data.qr_image_path) {
          await client.storage.from(qrBucket).remove([qrImagePath]);
        }
        return fail("Unable to update the payment method.", 503);
      }
      if (!saved.data) return fail("Payment method not found.", 404);
      if (
        current.data.qr_image_path &&
        qrImagePath !== current.data.qr_image_path
      ) {
        await client.storage
          .from(qrBucket)
          .remove([current.data.qr_image_path]);
      }
      return Response.json({
        paymentMethod: await attachQrUrl(client, saved.data),
      });
    }
    return fail("Invalid payment method action.");
  } catch (cause) {
    return fail(
      cause instanceof Error && cause.message === "forbidden"
        ? "Forbidden."
        : "Authentication required.",
      cause instanceof Error && cause.message === "forbidden" ? 403 : 401,
    );
  }
}

async function createPaymentMethod(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  input: {
    label: string;
    recipientName: string | null;
    accountNumber: string | null;
    isActive: boolean;
  },
): Promise<Record<string, unknown> | Response> {
  const baseCode = paymentMethodCodeBase(input.label);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${crypto.randomUUID().slice(0, 6)}`;
    const code = `${baseCode.slice(0, 64 - suffix.length)}${suffix}`;
    const created = await client
      .from("payment_methods")
      .insert({
        code,
        label: input.label,
        recipient_name: input.recipientName,
        account_number: input.accountNumber,
        instructions: "",
        is_demo: false,
        is_active: input.isActive,
        qr_image_path: null,
      })
      .select(paymentMethodSelect)
      .single();
    if (!created.error) return created.data;
    if (created.error.code !== "23505") {
      return fail("Unable to create the payment method.", 503);
    }
  }
  return fail(
    "Unable to generate a unique payment method key. Try saving again.",
    409,
  );
}

function paymentMethodCodeBase(label: string) {
  const slug = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "payment-method";
}

async function uploadQrImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  methodId: string,
  file: File,
): Promise<string | Response> {
  const extension = qrExtension(file);
  const path = `${methodId}/${crypto.randomUUID()}.${extension}`;
  const upload = await client.storage
    .from(qrBucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  return upload.error
    ? fail("Unable to store the payment QR image.", 503)
    : path;
}

function validateQrImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  if (!qrMimeTypes.has(value.type)) {
    return "Use a JPEG, PNG, or WebP image for the payment QR code.";
  }
  if (value.size > maxQrImageSize) {
    return "The payment QR image must be 5 MiB or smaller.";
  }
  return null;
}

function qrExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function attachQrUrls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  methods: Array<Record<string, unknown>>,
) {
  return Promise.all(methods.map((method) => attachQrUrl(client, method)));
}

async function attachQrUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  method: Record<string, unknown>,
) {
  const path =
    typeof method.qr_image_path === "string" ? method.qr_image_path : null;
  if (!path) return { ...method, qr_image_url: null };
  const signed = await client.storage
    .from(qrBucket)
    .createSignedUrl(path, 3600);
  return { ...method, qr_image_url: signed.data?.signedUrl ?? null };
}

function text(value: FormDataEntryValue | null, limit = 10_000) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function nullableText(value: FormDataEntryValue | null, limit: number) {
  const result = text(value, limit);
  return result || null;
}
