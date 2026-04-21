export type AuditStatus = 'PLANIFIE' | 'EN_COURS' | 'TERMINEE';

export interface AuditSummary {
  id: number;
  title: string;
  status: AuditStatus;
  typeAuditName: string;
  department: string;
  auditeName: string;
  auditeurName: string;
}

export interface AddOptionDto {
  label: string;
  sortOrder: number;
}

export interface AddQuestionDto {
  title: string;
  type: 'TRUE_FALSE' | 'RADIO';
  options: AddOptionDto[];
}

export interface AddAuditDto {
  title: string;
  department: string;
  typeAuditId: number;
  auditeId: number;
  dateDebut: string;
  dateFin: string;
  questions: AddQuestionDto[];
}

export interface Audite {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  role: string;
  departement: string;
}

export interface QuestionOption {
  id: number;
  label: string;
  sortOrder?: number;
  order?: number;
}

export interface Question {
  id: number;
  title: string;
  options: QuestionOption[];
  reponseId?: number | null;
  optionChoisieId?: number | null;
  selectedOptionId?: number | null;
  score: number | null;
}

export interface AuditDetails {
  title: string;
  status: AuditStatus;
  typeAuditName: string;
  department: string;
  auditeName: string;
  auditeurName: string;
  dateDebut: string;
  dateFin: string;
  scoreTotal: number;
  auditResult: string | null;
  questions: Question[];
}

export interface UpdateAuditDto {
  auditId: number;
  title: string;
  typeAuditId: number;
  department: string;
  dateDebut: string;
  dateFin: string;
}
