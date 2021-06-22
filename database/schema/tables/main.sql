create table "gene"
(
    "id" integer primary key,
    "symbol" text,
    "name" text
);

create table "study"
(
    "id" integer primary key,
    "name" text,
    "cancer" text
);

create table "sample"
(
    "id" integer primary key,
    "study_id" integer,
    "case_id" text,
    "is_tumor" boolean,
    foreign key("study_id") references "study"("id")
);

create table "proteome"
(
    "id" integer primary key,
    "study_id" integer,
    "gene_id" integer,
    "sample_id" integer,
    "log_ratio" real,
    "unshared_log_ratio" real,
    foreign key("study_id") references "study"("id"),
    foreign key("gene_id") references "gene"("id"),
    foreign key("sample_id") references "sample"("id")
);

create table "phosphoproteome"
(
    "id" integer primary key,
    "study_id" integer,
    "gene_id" integer,
    "sample_id" integer,
    "peptide" text,
    "phosphorylation_site" text,
    "log_ratio" real,
    foreign key("study_id") references "study"("id"),
    foreign key("gene_id") references "gene"("id"),
    foreign key("sample_id") references "sample"("id")
);
