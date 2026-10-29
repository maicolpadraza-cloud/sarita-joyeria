import type { ZodType } from "zod";

const maximumJsonBodyBytes = 16 * 1024;

export type JsonBodyResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  invalidMessage = "Los datos enviados no son válidos.",
): Promise<JsonBodyResult<T>> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return {
      success: false,
      response: Response.json(
        { error: "El tipo de contenido debe ser JSON." },
        { status: 415 },
      ),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > maximumJsonBodyBytes)
  ) {
    return {
      success: false,
      response: Response.json(
        { error: "La solicitud es demasiado grande." },
        { status: 413 },
      ),
    };
  }

  if (!request.body) {
    return {
      success: false,
      response: Response.json(
        { error: "El cuerpo de la solicitud no contiene JSON válido." },
        { status: 400 },
      ),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let body: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumJsonBodyBytes) {
        await reader.cancel();
        return {
          success: false,
          response: Response.json(
            { error: "La solicitud es demasiado grande." },
            { status: 413 },
          ),
        };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return {
      success: false,
      response: Response.json(
        { error: "El cuerpo de la solicitud no contiene JSON válido." },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: Response.json({ error: invalidMessage }, { status: 400 }),
    };
  }

  return { success: true, data: result.data };
}
