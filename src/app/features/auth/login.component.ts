import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from './auth.service';
import {ButtonComponent} from '../../components/button/button.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, ReactiveFormsModule],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    loginForm: FormGroup;
    error = signal('');
    isLoading = signal(false);

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    async login(): Promise<void> {
        this.error.set('');

        if (!this.loginForm.valid) {
            this.error.set('Veuillez vérifier les champs du formulaire.');
            return;
        }

        this.isLoading.set(true);

        const {email, password} = this.loginForm.value;
        const result = await this.authService.login(email, password);

        if (result.success) {
            await this.router.navigate(['']);
        } else {
            this.error.set(result.error || 'Erreur de connexion');
        }

        this.isLoading.set(false);
    }
}
