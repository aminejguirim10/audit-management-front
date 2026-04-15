export interface CorrectiveActionItem {
  id: number;
  title: string;
  description: string;
  tempsEstime: string;
  priority: string;
}

export interface AuditCorrectiveActionsCard {
  auditId: number;
  auditTitle: string;
  dateDebut: string;
  dateFin: string;
  auditeurName: string | null;
  typeAuditName: string | null;
  correctiveActions: CorrectiveActionItem[];
}
