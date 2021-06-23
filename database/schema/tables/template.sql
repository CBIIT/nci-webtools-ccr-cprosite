create table "TABLE_PREFIX_case"
(
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "proteinLogRatioControl" real,
    "proteinLogRatioCase" real,
    "proteinLogRatioChange" real,
    "phosphoproteinLogRatioControl" real,
    "phosphoproteinLogRatioCase" real,
    "phosphoproteinLogRatioChange" real,
    "accession" text,
    "phosphorylationSite" text,
    "phosphopeptide" text,
    "copyNumberVariations" integer,
    "rnaValue" integer
);
create unique index "index_TABLE_PREFIX_case_unique" on "TABLE_PREFIX_case"("geneId", "cancerId", "name");

create table "TABLE_PREFIX_mutation"
(
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "caseId" integer references "TABLE_PREFIX_case"("id"),
    "name" text,
    "positionStart" integer,
    "positionEnd" integer,
    "positionCDNA" integer,
    "positionProtein" integer
);
