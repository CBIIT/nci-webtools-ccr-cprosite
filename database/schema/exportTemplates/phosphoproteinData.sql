-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  replace(regexp_replace(c.ppid, '[-_][[:alpha:]]{2}[[:space:]]*$', ''), '.', '-') as participantId,
  avg(c.PPvalue) as value,
  regexp_like(c.ppid, '[-_]tu[[:space:]]*$', 'i') as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from <%= sourceTable %> c
inner join geneName g on g.name = c.Ppgene
where 
  c.ppid not like 'LungTumor%' and  
  c.ppid not like 'QC%' and
  c.PPvalue between -30 and 30
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

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
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;


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
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;