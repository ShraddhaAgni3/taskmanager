import { Component, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;

  error = signal<string>('');
  showPassword = signal<boolean>(false);
  loading = signal<boolean>(false);

  isLoading = computed(() => this.loading());

  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  constructor() {
    this.loginForm = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8), // 🔥 FIX (backend match)
      ]),
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((state) => !state);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormTouched();
      return;
    }

    this.loading.set(true);
    const data = this.loginForm.value;

    this.authService.login(data).subscribe({
      next: () => {
        this.loading.set(false);
        this.notificationService.success(
          'Welcome back!',
          'Login Successful'
        );
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);

        const msg =
          err?.error?.message ||
          'Invalid email or password';

        this.error.set(msg);
        this.notificationService.error(msg, 'Login Failed');
      },
    });
  }

  private markFormTouched() {
    Object.values(this.loginForm.controls).forEach((control) =>
      control.markAsTouched()
    );
  }
}
