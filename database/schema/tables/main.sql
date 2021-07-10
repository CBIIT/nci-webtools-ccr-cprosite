create table "gene"
(
    "id" integer primary key,
    "name" text,
    "description" text
);

create table "cancer"
(
    "id" integer primary key,
    "name" text,
    "study" text,
    "rnaValueSource" text
);
