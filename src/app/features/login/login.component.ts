import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {ButtonComponent} from '../../components/button/button.component';
import {FieldErrorComponent} from '../../components/form-error/field-error.component';
import {FormErrorComponent} from '../../components/form-error/form-error.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonComponent, ReactiveFormsModule, FieldErrorComponent, FormErrorComponent],
    templateUrl: './login.component.html',
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private fb = inject(FormBuilder);

    loginForm: FormGroup;
    errorMessage = signal('');
    isLoading = signal(false);

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
        });
    }

    async login(): Promise<void> {
        this.errorMessage.set('');

        if (!this.loginForm.valid) {
            this.errorMessage.set('Veuillez vérifier les champs du formulaire.');
            return;
        }

        this.isLoading.set(true);

        const {email, password} = this.loginForm.value;
        const {error} = await this.authService.signInWithPassword(email, password);

        if (error) {
            this.errorMessage.set(error.message || 'Erreur lors de la connexion.');
            this.isLoading.set(false);
            return;
        }

        await this.router.navigate(['']);
        this.isLoading.set(false);
    }
}
