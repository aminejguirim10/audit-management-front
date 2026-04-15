import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { Student } from '../models/student.model';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private url = `${API_BASE_URL}/utilisateurs`;

  findAll(): Observable<Student[]> {
    return this.http.get<ApiResponse<Student[]>>(`${this.url}?role=ETUDIANT`).pipe(
      map(res => res.data ?? [])
    );
  }
  
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  create(studentData: Partial<Student>): Observable<Student> {
    return this.http.post<ApiResponse<Student>>(`${API_BASE_URL}/auth/register`, {
      name: studentData.name,
      email: studentData.email,
      phoneNumber: studentData.phoneNumber,
      department: studentData.departement,
      role: 'ETUDIANT',
      password: 'Enicar2020'
    }).pipe(
      map(res => res.data as Student)
    );
  }
}
