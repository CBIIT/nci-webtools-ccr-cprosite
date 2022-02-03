-- create temporary table for rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  replace(regexp_replace(c.paid, '[-_][[:alpha:]]{2}[[:space:]]*$', ''), '.', '-') as participantId,
  avg(c.value) as value,
  regexp_like(c.paid, '[-_]tu[[:space:]]*$', 'i') as isTumor
from <%= sourceTable %> c
inner join geneName g on g.name = c.gene
where 
  c.paid not like 'LungTumor%' and  
  c.paid not like 'QC%'
group by geneId, participantId, isTumor;

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
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from <%= tempTable %>
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;