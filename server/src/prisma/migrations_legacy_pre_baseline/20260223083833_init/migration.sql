-- CreateEnum
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE "UserRole" AS ENUM ('MITARBEITER', 'CHEF');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('ONBOARDING', 'OFFBOARDING');

-- CreateTable
CREATE TABLE "employee_forms" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "form_type" TEXT NOT NULL,

    CONSTRAINT "employee_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "form_field_id" SERIAL NOT NULL,
    "description" TEXT,
    "order_index" INTEGER,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "owner" TEXT NOT NULL DEFAULT 'cmknti1f800028tmmhf5u5627',
    "template_type" "TemplateType" DEFAULT 'ONBOARDING',

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("form_field_id")
);

-- CreateTable
CREATE TABLE "form_inputs" (
    "id" SERIAL NOT NULL,
    "employee_form_id" INTEGER NOT NULL,
    "form_field_id" INTEGER NOT NULL,
    "status" VARCHAR(55),
    "edit" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "form_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" CITEXT,
    "adresse" TEXT NOT NULL,
    "austrittsdatum" DATE,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eintrittsdatum" DATE NOT NULL,
    "geburtsdatum" DATE NOT NULL,
    "nachname" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "vorname" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + '30 days'::interval),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "vorname" VARCHAR(55) NOT NULL DEFAULT 'TestVorname',
    "nachname" VARCHAR(55) NOT NULL DEFAULT 'TestVorname',
    "cloud_url" VARCHAR(500) NOT NULL DEFAULT 'something',
    "email" CITEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_permission" "UserRole" NOT NULL DEFAULT 'MITARBEITER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeStatus" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "absence" TEXT,
    "absencetype" TEXT,
    "absencebegin" TIMESTAMP(3),
    "absenceEnd" TIMESTAMP(3),
    "substitute" TEXT,

    CONSTRAINT "EmployeeStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryFormData" (
    "id" SERIAL NOT NULL,
    "form_input_id" INTEGER NOT NULL,
    "status" VARCHAR(55),
    "edit" TEXT,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "changed_by" TEXT,

    CONSTRAINT "HistoryFormData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerFiles" (
    "id" SERIAL NOT NULL,
    "employee_form_id" INTEGER NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "content_type" VARCHAR(100) NOT NULL,
    "cloud_url" VARCHAR(500) NOT NULL,
    "cloud_key" VARCHAR(500) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeStatus_userId_key" ON "EmployeeStatus"("userId");

-- CreateIndex
CREATE INDEX "EmployeeStatus_userId_idx" ON "EmployeeStatus"("userId");

-- CreateIndex
CREATE INDEX "VerificationCode_userId_idx" ON "VerificationCode"("userId");

-- AddForeignKey
ALTER TABLE "employee_forms" ADD CONSTRAINT "employee_forms_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_employee_forms" FOREIGN KEY ("employee_form_id") REFERENCES "employee_forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_form_fields" FOREIGN KEY ("form_field_id") REFERENCES "form_fields"("form_field_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeStatus" ADD CONSTRAINT "EmployeeStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeStatus" ADD CONSTRAINT "EmployeeStatus_substitute_fkey" FOREIGN KEY ("substitute") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryFormData" ADD CONSTRAINT "HistoryFormData_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryFormData" ADD CONSTRAINT "HistoryFormData_form_input_id_fkey" FOREIGN KEY ("form_input_id") REFERENCES "form_inputs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerFiles" ADD CONSTRAINT "WorkerFiles_employee_form_id_fkey" FOREIGN KEY ("employee_form_id") REFERENCES "employee_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
