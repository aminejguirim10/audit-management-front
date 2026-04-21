// Enums
export type IdeaStatus = 'ENCOURS' | 'ACCEPTE' | 'REJETE';
export type CategoryIdea = 'SERVICES' | 'INSTALLATIONS' | 'ACADEMIQUE' | 'AUTRES';
export type Department = 'INFORMATIQUE' | 'ELECTRIQUE' | 'INDUS';

// ===== Idea Models =====
export interface Idea {
  id: number;
  title: string;
  description: string;
  category: CategoryIdea;
  status: IdeaStatus;
  department: Department;
  studentName: string;
  voteCount: number;
  comments: CommentSummary[];
}

export interface AddIdeaDto {
  title: string;
  description: string;
  category: CategoryIdea;
  department: Department;
}

export interface FindOneIdeaDto {
  id?: number; // Optionnel pour compatibilité
  title: string;
  description: string;
  category: CategoryIdea;
  status: IdeaStatus;
  department: Department;
  voteCount: number;
  comments: CommentSummary[];
  studentName: string;
}

export interface IdeaStatusUpdateDto {
  ideaId: number;
  status: IdeaStatus;
}

// ===== Comment Models =====
export interface CommentSummary {
  content: string;
  createdAt: string;
  studentName: string;
}

export interface AddCommentDto {
  content: string;
  ideaId: number;
}

// ===== Vote Models =====
export interface AddVoteDto {
  ideaId: number;
}

// ===== Category & Department Labels =====
export const CATEGORY_LABELS: Record<CategoryIdea, string> = {
  SERVICES: '🏢 Services',
  INSTALLATIONS: '🔧 Installations',
  ACADEMIQUE: '📚 Académique',
  AUTRES: '📌 Autres',
};

export const CATEGORY_COLORS: Record<CategoryIdea, string> = {
  SERVICES: 'bg-blue-100 text-blue-700 border-blue-300',
  INSTALLATIONS: 'bg-orange-100 text-orange-700 border-orange-300',
  ACADEMIQUE: 'bg-purple-100 text-purple-700 border-purple-300',
  AUTRES: 'bg-gray-100 text-gray-700 border-gray-300',
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  INFORMATIQUE: 'Informatique',
  ELECTRIQUE: 'Électrique',
  INDUS: 'Industrielle',
};

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  ENCOURS: '⏳ En cours',
  ACCEPTE: '✅ Acceptée',
  REJETE: '❌ Rejetée',
};

export const STATUS_COLORS: Record<IdeaStatus, string> = {
  ENCOURS: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  ACCEPTE: 'bg-green-100 text-green-700 border-green-300',
  REJETE: 'bg-red-100 text-red-700 border-red-300',
};
