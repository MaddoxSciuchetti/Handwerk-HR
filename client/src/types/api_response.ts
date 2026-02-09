export type APIResponse = SuccessResponse | ErrorResponse;

export type SuccessResponse = {
    success: true;
    affectedRows: number;
};

export type ErrorResponse = {
    success: false;
    error: string;
};

export type delete_user = {
    id: number;
    vorname: string;
    nachname: string;
    email: string | null;
    adresse: string;
    austrittsdatum: Date | null;
    createdAt: Date;
    eintrittsdatum: Date;
    geburtsdatum: Date;
    position: string;
    updatedAt: Date;
};

export type TOffboardingItemUser = {
    success: {
        id: number;
        vorname: string;
        nachname: string;
    };
};
