import {
  BackendBulletinError,
  getBackendBulletinSnapshot,
} from "../../../lib/backend-bulletin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getBackendBulletinSnapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const backendError =
      error instanceof BackendBulletinError
        ? error
        : new BackendBulletinError("DATA_UNAVAILABLE", 503, true);
    console.error("Unable to fetch bulletin backend", {
      code: backendError.code,
      status: backendError.status,
      retryable: backendError.retryable,
    });
    return Response.json(
      {
        error: {
          code: backendError.code,
          message: "Dữ liệu bản tin chưa sẵn sàng.",
          retryable: backendError.retryable,
        },
      },
      {
        status: backendError.status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
