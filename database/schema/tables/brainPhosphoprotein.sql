-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
CREATE TABLE <%= tempTable %> AS
select distinct
  geneName.id as geneId, 
  SUBSTR(c.case_id, length(c.case_id)-2, -length(c.case_id)) as participantId,
  instr(c.case_id, '-Tu') as isTumor,
  avg(c.value) as value,
  SUBSTR(c.Phosphosite, 1, instr(c.Phosphosite, ':')-1) as accession,
  SUBSTR(c.Phosphosite, instr(c.Phosphosite, ':')+1) as phosphorylationSite,
  c.Peptide as phosphopeptide
from <%= sourceTable %> c
inner join geneName on geneName.name = c.Gene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

PRAGMA foreign_keys = OFF;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
  where isTumor = 0
) as new
where true
on CONFLICT(cancerId, geneId, participantId, accession, phosphorylationSite, phosphopeptide) DO update set 
  normalValue = excluded.normalValue,
  accession = excluded.accession,
  phosphorylationSite = excluded.phosphorylationSite,
  phosphopeptide = excluded.phosphopeptide;


insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as tumorValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
  where isTumor >= 1
) as new
where true
on CONFLICT(cancerId, geneId, participantId, accession, phosphorylationSite, phosphopeptide) DO update set 
  tumorValue = excluded.tumorValue,
  accession = excluded.accession,
  phosphorylationSite = excluded.phosphorylationSite,
  phosphopeptide = excluded.phosphopeptide;