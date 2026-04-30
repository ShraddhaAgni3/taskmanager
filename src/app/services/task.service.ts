import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tasks } from '../core/models/tasks.model';
import { Task as SingleTask } from '../core/models/task.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // 🔐 AUTH HEADER
  private getHeaders() {
    const token = sessionStorage.getItem('token');

    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  }

  // ➕ CREATE
  createTask(task: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, task, this.getHeaders());
  }

  // 📋 ALL TASKS
  getAllTasks(): Observable<Tasks> {
    return this.http.get<Tasks>(this.apiUrl, this.getHeaders());
  }

  // ✅ COMPLETED TASKS (FIXED)
  getCompletedTasks(
  page: number,
  limit: number,
  search: string = '',
  priority: string = ''
): Observable<Tasks> {

  let url = `${this.apiUrl}/completed?page=${page}&limit=${limit}`;

  if (search) {
    url += `&search=${search}`;
  }

  if (priority) {
    url += `&priority=${priority.toLowerCase()}`;
  }

  return this.http.get<Tasks>(url, this.getHeaders());
}
  // ⏳ PENDING TASKS (FIXED)
 getPendingTasks(
  page: number,
  limit: number,
  search: string = '',
  priority: string = '',
  sortBy: string = 'deadline',
  order: string = 'asc'
): Observable<Tasks> {

  let url = `${this.apiUrl}/ongoing?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`;

  if (search) {
    url += `&search=${search}`;
  }

  if (priority) {
    url += `&priority=${priority.toLowerCase()}`;
  }

  return this.http.get<Tasks>(url, this.getHeaders());
}
  // 👤 USER TASKS
  getUserTasks(page: number, limit: number): Observable<Tasks> {
    return this.http.get<Tasks>(
      `${this.apiUrl}/user?page=${page}&limit=${limit}`,
      this.getHeaders()
    );
  }

  // 🔍 GET BY ID
  getTaskById(id: string): Observable<SingleTask> {
    return this.http.get<SingleTask>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    );
  }

  // ✏️ UPDATE
  updateTask(id: string, task: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      task,
      this.getHeaders()
    );
  }

  // ❌ DELETE
  deleteTask(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    );
  }

  // 📊 STATS
  getTaskStats(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/summary/stats`,
      this.getHeaders()
    );
  }

  // 📝 ACTIVITIES
  getTaskActivities(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}/activities`,
      this.getHeaders()
    );
  }
}
