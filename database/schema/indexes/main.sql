create unique index "proteinDataUniqueIndex" on "proteinData"("cancerId", "geneId",  "participantId");
create unique index "phosphoproteinDataUniqueIndex" on "phosphoproteinData"("cancerId", "geneId",  "participantId");
create unique index "rnaDataUniqueIndex" on "rnaData"("cancerId", "geneId",  "participantId");
create unique index "tcgaRnaDataUniqueIndex" on "tcgaRnaData"("cancerId", "geneId",  "participantId");
create unique index "proteinDataSummaryUniqueIndex" on "proteinDataSummary"("geneId", "cancerId");
create unique index "phosphoproteinDataSummaryUniqueIndex" on "phosphoproteinDataSummary"("geneId", "cancerId");
create unique index "rnaDataSummaryUniqueIndex" on "rnaDataSummary"("geneId", "cancerId");
create unique index "tcgaRnaDataSummaryUniqueIndex" on "tcgaRnaDataSummary"("geneId", "cancerId");
