export const FORM_ERRORS = {
    REQUIRED: 'Veuillez remplir tous les champs obligatoires.',
    SUBSCRIPTION_REQUIRED: 'Veuillez choisir un abonnement.',
} as const;

export function creationError(resource: string): string {
    return `Erreur lors de la création de ${resource}.`;
}

export function deletionError(): string {
    return 'Erreur lors de la suppression.';
}
