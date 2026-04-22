export interface Chef {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  departement: 'INFORMATIQUE' | 'ELECTRIQUE' | 'INDUS';
}