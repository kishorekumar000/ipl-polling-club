import { NextRequest, NextResponse } from "next/server";

function getApiServiceUrl() {
  return (process.env.API_SERVICE_URL || "http://localhost:4000").replace(/\/$/, "");
}

export async function GET() {
  try {
    const response = await fetch(`${getApiServiceUrl()}/state`, {
      cache: "no-store"
    });
    const payload = await response.text();

    return new NextResponse(payload, {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Could not reach shared API."
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.text();
    const response = await fetch(`${getApiServiceUrl()}/state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: payload
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Could not update shared API."
      },
      { status: 500 }
    );
  }
}
