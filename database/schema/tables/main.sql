create table "cancer"
(
    "id" integer primary key,
    "name" text,
    "description" text,
    "study" text,
    "singlePool" integer
);

create table "gene"
(
    "id" integer primary key,
    "name" text,
    "description" text
);

create table "geneName"
(
    "id" integer,
    "name" text
);

create table "proteinData" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "participantId" text,
    "normalValue" real,
    "tumorValue" real
);

create table "phosphoproteinData" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "participantId" text,
    "normalValue" real,
    "tumorValue" real,
    "accession" text,
    "phosphorylationSite" text,
    "phosphopeptide" text
);

create table "phosphoproteinRatioData" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "participantId" text,
    "normalValue" real,
    "tumorValue" real,
    "accession" text,
    "phosphorylationSite" text,
    "phosphopeptide" text
);

create table "rnaData" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "participantId" text,
    "normalValue" real,
    "tumorValue" real
);

create table "tcgaRnaData" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "participantId" text,
    "normalValue" real,
    "tumorValue" real,
    "normalSampleBarcode" text,
    "tumorSampleBarcode" text
);

create table "proteinDataSummary" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleMedian" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleMedian" real,
    "tumorSampleStandardError" real,
    "pValuePaired" real,
    "pValueUnpaired" real
);

create table "phosphoproteinDataSummary" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "accession" text,
    "phosphorylationSite" text default('all'),
    "phosphopeptide" text,
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleMedian" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleMedian" real,
    "tumorSampleStandardError" real,
    "pValuePaired" real,
    "pValueUnpaired" real
);

create table "phosphoproteinRatioDataSummary" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "accession" text,
    "phosphorylationSite" text default('all'),
    "phosphopeptide" text,
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleMedian" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleMedian" real,
    "tumorSampleStandardError" real,
    "pValuePaired" real,
    "pValueUnpaired" real
);

create table "rnaDataSummary" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleMedian" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleMedian" real,
    "tumorSampleStandardError" real,
    "pValuePaired" real,
    "pValueUnpaired" real
);

create table "tcgaRnaDataSummary" (
    "id" integer primary key,
    "cancerId" integer references "cancer"("id"),
    "geneId" integer references "gene"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleMedian" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleMedian" real,
    "tumorSampleStandardError" real,
    "pValuePaired" real,
    "pValueUnpaired" real
);