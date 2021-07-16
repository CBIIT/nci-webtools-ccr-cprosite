create table `<%= proteinDataTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "normalValue" real,
    "tumorValue" real
);

create unique index "<%= proteinDataTable %>_unique_index" on "<%= proteinDataTable %>"("geneId", "cancerId", "name");


create table `<%= phosphoproteinDataTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "normalValue" real,
    "tumorValue" real,
    "accession" text,
    "phosphorylationSite" text,
    "phosphopeptide" text
);

create unique index "<%= phosphoproteinDataTable %>_unique_index" on "<%= phosphoproteinDataTable %>"("geneId", "cancerId", "name");


create table `<%= rnaDataTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "normalValue" real,
    "tumorValue" real
);

create unique index "<%= rnaDataTable %>_unique_index" on "<%= rnaDataTable %>"("geneId", "cancerId", "name");


create table `<%= tcgaRnaDataTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "normalValue" real,
    "tumorValue" real,
    "normalTcgaBarcode" text,
    "tumorTcgaBarcode" text
);

create unique index "<%= tcgaRnaDataTable %>_unique_index" on "<%= tcgaRnaDataTable %>"("geneId", "cancerId", "name");


create table `<%= proteinDataSummaryTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleStandardError" real,
    "pValue" real
);

create unique index "<%= proteinDataSummaryTable %>_unique_index" on "<%= proteinDataSummaryTable %>"("geneId", "cancerId");


create table `<%= phosphoproteinDataSummaryTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleStandardError" real,
    "pValue" real
);

create unique index "<%= phosphoproteinDataSummaryTable %>_unique_index" on "<%= phosphoproteinDataSummaryTable %>"("geneId", "cancerId");


create table `<%= rnaDataSummaryTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleStandardError" real,
    "pValue" real
);

create unique index "<%= rnaDataSummaryTable %>_unique_index" on "<%= rnaDataSummaryTable %>"("geneId", "cancerId");


create table `<%= tcgaRnaDataSummaryTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "normalSampleCount" integer,
    "normalSampleMean" real,
    "normalSampleStandardError" real,
    "tumorSampleCount" integer,
    "tumorSampleMean" real,
    "tumorSampleStandardError" real,
    "pValue" real
);

create unique index "<%= tcgaRnaDataSummaryTable %>_unique_index" on "<%= tcgaRnaDataSummaryTable %>"("geneId", "cancerId");


create table `<%= caseTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "name" text,
    "normalProteinLogRatio" real,
    "tumorProteinLogRatio" real,
    "normalPhosphoproteinLogRatio" real,
    "tumorPhosphoproteinLogRatio" real,
    "normalRnaValue" real,
    "tumorRnaValue" real,
    "normalTcgaBarcode" text,
    "normalTcgaRnaValue" real,
    "tumorTcgaBarcode" text,
    "tumorTcgaRnaValue" real,
    "accession" text,
    "phosphorylationSite" text,
    "phosphopeptide" text
);

create unique index "<%= caseTable %>_unique_index" on "<%= caseTable %>"("geneId", "cancerId", "name");

create table `<%= caseSummaryTable %>` (
    "id" integer primary key,
    "geneId" integer references "gene"("id"),
    "cancerId" integer references "cancer"("id"),
    "normalProteinLogRatioCount" real,
    "normalProteinLogRatioMean" real,
    "normalProteinLogRatioStandardError" real,
    "tumorProteinLogRatioCount" real,
    "tumorProteinLogRatioMean" real,
    "tumorProteinLogRatioStandardError" real,
    "proteinLogRatioP" real,
    "normalPhosphoproteinLogRatioCount" real,
    "normalPhosphoproteinLogRatioMean" real,
    "normalPhosphoproteinLogRatioStandardError" real,
    "tumorPhosphoproteinLogRatioCount" real,
    "tumorPhosphoproteinLogRatioMean" real,
    "tumorPhosphoproteinLogRatioStandardError" real,
    "phosphoproteinLogRatioP" real,
    "normalRnaValueCount" real,
    "normalRnaValueMean" real,
    "normalRnaValueStandardError" real,
    "tumorRnaValueCount" real,
    "tumorRnaValueMean" real,
    "tumorRnaValueStandardError" real,
    "rnaValueP" real,
    "normalTcgaRnaValueCount" real,
    "normalTcgaRnaValueMean" real,
    "normalTcgaRnaValueStandardError" real,
    "tumorTcgaRnaValueCount" real,
    "tumorTcgaRnaValueMean" real,
    "tumorTcgaRnaValuStandardError" real,
    "tcgaRnaValueP" real
);

create unique index "<%= caseSummaryTable %>_unique_index" on "<%= caseSummaryTable %>"("geneId", "cancerId");
