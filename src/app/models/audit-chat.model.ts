export type AuditStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINEE';

export interface ChatAuditSummary {
  id: number;
  title: string;
  status: AuditStatus;
  department: 'INFORMATIQUE' | 'ELECTRIQUE' | 'INDUS';
  dateDebut: string;
  dateFin: string;
  typeAuditName: string | null;
  auditeId: number | null;
  auditeName: string | null;
  auditeurId: number | null;
  auditeurName: string | null;
}
