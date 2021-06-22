create index "index_sample__study_id" on "sample"("study_id");
create index "index_proteome__study_id_gene_id" on "proteome"("study_id", "gene_id");
create index "index_phosphoproteome__study_id_gene_id" on "phosphoproteome"("study_id", "gene_id");
