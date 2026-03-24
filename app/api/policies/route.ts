import { NextResponse } from 'next/server';
import { dbConn } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const policy = await dbConn.query.policies.findFirst({
      where: eq(schema.policies.companyId, 'DEFAULT_COMPANY')
    });
    if (!policy) return NextResponse.json({ success: true, policy: null, rules: [] });

    const rules = await dbConn.query.rules.findMany({
      where: eq(schema.rules.policyId, policy.id)
    });

    return NextResponse.json({ success: true, policy, rules });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { field, operator, value, severity, errorMessage } = body;

    let policy = await dbConn.query.policies.findFirst({
      where: eq(schema.policies.companyId, 'DEFAULT_COMPANY')
    });
    
    // Auto-Crear la Política Maestro si es la primera vez que se usa la plataforma
    if (!policy) {
      try {
        await dbConn.insert(schema.companies).values({ id: 'DEFAULT_COMPANY', name: 'Omni-OS Standard' });
      } catch(e) {}
      await dbConn.insert(schema.policies).values({ id: 'pol_1', companyId: 'DEFAULT_COMPANY', version: 1, isActive: true });
      policy = { id: 'pol_1' } as any;
    }

    // Casteo automático
    let parsedValue: any = value;
    if (!isNaN(Number(value))) parsedValue = Number(value);
    else if (value.toLowerCase() === 'true') parsedValue = true;
    else if (value.toLowerCase() === 'false') parsedValue = false;

    await dbConn.insert(schema.rules).values({
      id: `R_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      policyId: policy.id,
      field,
      operator,
      value: parsedValue,
      severity,
      priority: 100,
      action: severity === 'BLOCKER' ? 'REJECT' : 'WARNING',
      errorMessage: errorMessage || `Violación de política en campo ${field}`
    });

    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
