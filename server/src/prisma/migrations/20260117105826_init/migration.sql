-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('offboarding', 'onboarding');


CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "employee_forms" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "form_type" "FormType" NOT NULL DEFAULT 'offboarding',

    CONSTRAINT "employee_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "form_field_id" SERIAL NOT NULL,
    "description" TEXT,
    "order_index" INTEGER,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

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

    CONSTRAINT "form_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(55) NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "email" CITEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "employee_forms" ADD CONSTRAINT "employee_forms_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_employee_forms" FOREIGN KEY ("employee_form_id") REFERENCES "employee_forms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "form_inputs" ADD CONSTRAINT "form_inputs_form_fields" FOREIGN KEY ("form_field_id") REFERENCES "form_fields"("form_field_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
