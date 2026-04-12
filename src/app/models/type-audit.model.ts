export interface TypeAudit {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface AddTypeAuditDto {
  name: string;
  description: string;
  color: string;
}

export interface UpdateTypeAuditDto {
  name?: string;
  description?: string;
  color?: string;
}
