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
