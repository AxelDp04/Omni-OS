import { NextResponse } from 'next/server';
import { dbConn } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workflowType = searchParams.get('workflowType');
  if (!workflowType) return NextResponse.json({ success: false, error: 'Falta workflowType' }, { status: 400 });

  try {
    const contract = await dbConn.query.dataContracts.findFirst({
      where: and(
        eq(schema.dataContracts.companyId, 'DEFAULT_COMPANY'),
        eq(schema.dataContracts.workflowType, workflowType)
      )
    });

    return NextResponse.json({ success: true, contract });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { workflowType, mappingPayload } = await req.json();

    const existing = await dbConn.query.dataContracts.findFirst({
      where: and(
        eq(schema.dataContracts.companyId, 'DEFAULT_COMPANY'),
        eq(schema.dataContracts.workflowType, workflowType)
      )
    });

    if (existing) {
      await dbConn.update(schema.dataContracts)
        .set({ mappingPayload })
        .where(eq(schema.dataContracts.id, existing.id));
    } else {
      await dbConn.insert(schema.dataContracts).values({
        id: `dc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        companyId: 'DEFAULT_COMPANY',
        workflowType,
        mappingPayload
      });
    }

    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
