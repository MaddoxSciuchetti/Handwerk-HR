import type {
    AbsenceType,
    DocumentFileType,
    EngagementType,
    IssuePriority,
    WorkerStatus,
} from "@prisma/client";

export type {
    AbsenceType,
    DocumentFileType,
    EngagementType,
    IssuePriority,
    WorkerStatus,
};


export interface CreateWorkerInput {
    organizationId: string;
    createdByUserId: string; // from auth / req.user
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    birthday?: Date;
    position?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    entryDate?: Date;
    exitDate?: Date;
    engagementType: EngagementType;
    responsibleUserId: string;
    startDate?: Date;
    endDate?: Date;
    templateId?: string;
}

export interface UpdateWorkerInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    birthday?: Date;
    position?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    entryDate?: Date;
    exitDate?: Date;
}

export interface GetWorkersInput {
    organizationId: string;
    status?: WorkerStatus; // Prisma enum — safe to use directly
    search?: string;
    page?: number;
    limit?: number;
    includeArchived?: boolean;
}

export interface ArchiveWorkerInput {
    workerId: string;
    organizationId: string;
}

export interface UnarchiveWorkerInput {
    workerId: string;
    organizationId: string;
}

export interface DeleteWorkerInput {
    workerId: string;
    organizationId: string;
}


export interface CreateEngagementInput {
    workerId: string;
    organizationId: string;
    responsibleUserId: string; // required
    statusId: string; // required FK → EngagementStatus
    type: EngagementType; // not "engagementType"
    startDate?: Date;
    endDate?: Date;
    completedAt?: Date;
}

export interface UpdateEngagementInput {
    engagementId: string;
    workerId: string;
    organizationId: string;
    responsibleUserId?: string;
    statusId?: string;
    type?: EngagementType;
    startDate?: Date;
    endDate?: Date;
    completedAt?: Date;
}


export interface CreateIssueInput {
    workerEngagementId: string; // required — no workerId on Issue
    createdByUserId: string; // required
    statusId: string; // required FK → IssueStatus
    title: string;
    assigneeUserId?: string;
    templateItemId?: string;
    description?: string;
    priority?: IssuePriority;
    dueDate?: Date;
}

export interface UpdateIssueInput {
    issueId: string;
    workerEngagementId: string; // used to scope the lookup
    /** Set by controller from auth — written to IssueAuditLog */
    actorUserId: string;
    title?: string;
    description?: string;
    assigneeUserId?: string;
    statusId?: string;
    priority?: IssuePriority;
    dueDate?: Date;
}


export interface CreateAbsenceInput {
    userId: string; // User.id — not workerId
    orgId: string; // Organization.id — not organizationId
    absenceType: AbsenceType; // Prisma enum: SICK | VACATION | PARENTAL_LEAVE | UNPAID | OTHER
    startDate: Date;
    endDate: Date;
    substituteId?: string; // User.id of substitute
}

export interface UpdateAbsenceInput {
    absenceId: string;
    absenceType?: AbsenceType;
    startDate?: Date;
    endDate?: Date;
    substituteId?: string;
}


export interface UploadWorkerDocumentInput {
    workerId: string;
    organizationId: string; // for ownership check only — not on WorkerDocument
    uploadedByUserId: string; // required
    name: string;
    fileUrl: string; // S3 URL or key stored as full URL
    fileType: DocumentFileType; // Prisma enum: contract | id | certificate | other
    fileSizeBytes?: number;
    mimeType?: string;
}


/** Worker columns + `responsibleUserId` (updates latest engagement). */
export type WorkerDataPointField =
    | keyof UpdateWorkerInput
    | "responsibleUserId";

export interface UpdateDataPointInput {
    workerId: string;
    organizationId: string;
    field: WorkerDataPointField;
    value: string | number | boolean | Date | null;
}


export interface InsertWorker {
    vorname: string;
    nachname: string;
    email: string;
    geburtsdatum: string;
    adresse: string;
    eintrittsdatum: string;
    position: string;
    type: string;
}

export interface InsertWorkerResponse {
    worker: { id: number; vorname: string; nachname: string };
    employee_form: number;
}

export interface WorkerForm {
    id: number;
    select_option: string;
    editcomment: string;
}
