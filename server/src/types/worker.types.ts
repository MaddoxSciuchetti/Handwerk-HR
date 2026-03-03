export type InsertWorker = {
    type: string;
    vorname: string;
    nachname: string;
    email: string;
    geburtsdatum: string;
    adresse: string;
    eintrittsdatum: string;
    position: string;
};

export type InsertWorkerResponse = {
    worker: {
        id: number;
        vorname: string;
        nachname: string;
    };
    employee_form: number;
};
export type WorkerForm = {
    id: number;
    editcomment: string;
    select_option: string;
};
