-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  replace(regexp_replace(c.CCid, '[-_][[:alpha:]]{2}[[:space:]]*$', ''), '.', '-') as participantId,
  avg(c.CCvalue) as value,
  regexp_like(c.CCid, '[-_]tu[[:space:]]*$', 'i') as isTumor
from <%= sourceTable %> c
inner join geneName g on g.name = c.CCgene
where 
  c.CCid not like 'LungTumor%' and
  c.CCid not like 'QC%' and
  c.CCvalue between -30 and 30
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from <%= tempTable %>
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from <%= tempTable %>
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;