export interface Audit {
  id: number;
  title: string;
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINEE';
  department: 'INFORMATIQUE' | 'ELECTRIQUE' | 'INDUS';
  dateDebut?: string;
  dateFin?: string;
  scoreTotal?: number;
  typeAuditName: string;
  typeAuditColor?: string;
  auditeurName: string;
  auditeName: string;
}