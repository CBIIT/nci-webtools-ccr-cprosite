-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  c.ppid as participantId,
  avg(c.PPvalue) as value,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from <%= sourceTable %> c
inner join geneName g on g.name = c.Ppgene
where 
  c.ppid not like 'LungTumor%' and  
  c.ppid not like 'QC%' and
  c.PPvalue between -30 and 30  
group by geneId, participantId, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, tumorValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    0 as normalValue, 
    value as tumorValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
) as new
on duplicate key update
    normalValue = new.normalValue,
    tumorValue = new.tumorValue,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;