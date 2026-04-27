import { NextRequest, NextResponse } from "next/server";
import { createEmptyState } from "../../../lib/club-data";
import type { AppState } from "../../../lib/club-types";

function getApiServiceUrl() {
  return (process.env.API_SERVICE_URL || "http://localhost:4000").replace(/\/$/, "");
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_STATE_TABLE || "club_state";
  const rowId = process.env.STATE_ROW_ID || "main";

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
    table,
    rowId
  };
}

function buildSupabaseHeaders(serviceRoleKey: string, extra?: HeadersInit) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function getSupabaseState() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?select=payload&id=eq.${encodeURIComponent(
      config.rowId
    )}&limit=1`,
    {
      cache: "no-store",
      headers: buildSupabaseHeaders(config.serviceRoleKey)
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase read failed (${response.status}): ${detail}`);
  }

  const rows = (await response.json()) as Array<{ payload?: AppState }>;
  return rows[0]?.payload ?? createEmptyState();
}

async function putSupabaseState(nextState: AppState) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?on_conflict=id`,
    {
      method: "POST",
      headers: buildSupabaseHeaders(config.serviceRoleKey, {
        Prefer: "resolution=merge-duplicates,return=representation"
      }),
      body: JSON.stringify([
        {
          id: config.rowId,
          payload: nextState,
          updated_at: new Date().toISOString()
        }
      ])
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase write failed (${response.status}): ${detail}`);
  }

  const rows = (await response.json()) as Array<{ payload?: AppState }>;
  return rows[0]?.payload ?? nextState;
}

export async function GET() {
  try {
    const supabaseState = await getSupabaseState();

    if (supabaseState) {
      return NextResponse.json({
        ok: true,
        state: supabaseState,
        backend: "supabase"
      });
    }

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
    const requestState = (await request.json()) as AppState;
    const supabaseState = await putSupabaseState(requestState);

    if (supabaseState) {
      return NextResponse.json({
        ok: true,
        state: supabaseState,
        backend: "supabase"
      });
    }

    const payload = JSON.stringify(requestState);
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
