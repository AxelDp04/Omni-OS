import { dbConn } from './db';
import * as schema from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Data Contract Layer
 * Mapea payloads crudos (Raw JSON) de APIs externas hacia el modelo estándar de Omni-OS
 * usando diccionarios almacenados en PostgreSQL por cada empresa.
 */
export class DataContractEngine {

  /**
   * Translates an external JSON using the active data contract for the company and workflow
   */
  async normalize(companyId: string, workflowType: string, rawPayload: Record<string, any>): Promise<Record<string, any>> {
    const contract = await dbConn.query.dataContracts.findFirst({
      where: and(
        eq(schema.dataContracts.companyId, companyId),
        eq(schema.dataContracts.workflowType, workflowType)
      )
    });

    // Si no hay contrato, devolvemos el payload tal como entró asumiendo que ya viene en formato estándar
    if (!contract || !contract.mappingPayload) {
      return rawPayload;
    }

    const mapping = contract.mappingPayload as Record<string, string>; // Ej: { "sueldo_bruto": "salary", "cargo": "position" }
    const normalizedPayload: Record<string, any> = { ...rawPayload }; // Heredamos lo que ya coincida

    // Extraer y reemplazar según el diccionario
    for (const [externalKey, internalKey] of Object.entries(mapping)) {
      if (rawPayload[externalKey] !== undefined) {
        normalizedPayload[internalKey] = rawPayload[externalKey];
        delete normalizedPayload[externalKey]; // Limpiar la llave sucia
      }
    }

    return normalizedPayload;
  }
}

export const dataContractLayer = new DataContractEngine();
