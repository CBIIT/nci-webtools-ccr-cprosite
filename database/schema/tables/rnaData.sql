-- create temporary table for rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  SUBSTR(c.paid, length(c.paid)-2, -length(c.paid)) as participantId,
  instr(c.paid, '-Tu') as isTumor,
  avg(c.value) as value
from <%= sourceTable %> c
inner join geneName g on g.name = c.gene
-- where 
--   c.paid not like 'LungTumor%' and  
--   c.paid not like 'QC%'
group by geneId, participantId, isTumor;

PRAGMA foreign_keys = OFF;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from <%= tempTable %>
  where isTumor = 0
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set normalValue = excluded.normalValue;


insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from <%= tempTable %>
  where isTumor >= 1
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set tumorValue = excluded.tumorValue;
