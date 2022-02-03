-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  c.CCid as participantId,
  avg(c.CCvalue) as value
from <%= sourceTable %> c
inner join geneName g on g.name = c.CCgene
where 
  c.CCid not like 'LungTumor%' and
  c.CCid not like 'QC%' and
  c.CCvalue between -30 and 30
group by geneId, participantId;

-- insert protein abundances 
insert into proteinData(cancerId, geneId, participantId, normalValue, tumorValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    0 as normalValue, 
    value as tumorValue
  from <%= tempTable %>
) as new
on duplicate key update 
  normalValue = new.normalValue,
  tumorValue = new.tumorValue;