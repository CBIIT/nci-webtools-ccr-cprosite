
create table "TABLE_PREFIX_proteome"(
    id integer primary key,
    gene_id integer,
    participant_sample_id integer,
    log_ratio decimal,
    unshared_log_ratio decimal,
    foreign key(gene_id) references "gene"(id),
    foreign key(participant_sample_id) references "TABLE_PREFIX_participant_sample"(id)
);

create table "TABLE_PREFIX_phosphoproteome"(
    id integer primary key,
    gene_id integer,
    participant_sample_id integer,
    peptide text,
    phosphorylation_site text,
    log_ratio decimal,
    foreign key(gene_id) references "gene"(id),
    foreign key(participant_sample_id) references "TABLE_PREFIX_participant_sample"(id)
);

create view "v_TABLE_PREFIX_proteome_tumor_control_paired_log_ratio" as 
with tumor_log_ratio as (
    select case_id,
           gene_id,
           p.log_ratio
    from luad_proteome p
    join luad_participant_sample ps on p.participant_sample_id = ps.id and ps.is_tumor = 1
), control_log_ratio as (
    select
        case_id,
        gene_id,
        log_ratio
    from luad_proteome p
    join luad_participant_sample ps on p.participant_sample_id = ps.id and ps.is_tumor = 0
) 
select 
    t.case_id as case_id, 
    t.gene_id as gene_id, 
    t.log_ratio as tumor_log_ratio, 
    c.log_ratio as control_log_ratio
from tumor_log_ratio t 
    join control_log_ratio c on t.case_id = c.case_id and t.gene_id = c.gene_id;
