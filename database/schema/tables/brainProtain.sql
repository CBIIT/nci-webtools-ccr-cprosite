drop table if exists <%= tempTable %>;
CREATE TABLE <%= tempTable %> AS
select distinct 
  geneName.id as geneId, 
  SUBSTR(c.Case_id, length(c.Case_id)-2, -length(c.Case_id)) as participantId,
  instr(c.Case_id, '-Tu') as isTumor,
  avg(c.value) as value
from <%= sourceTable %> c
inner join geneName on geneName.name = c.Gene
group by geneId, participantId, isTumor;
 
-- create temporary table for protein abundances
-- drop table if exists brainProtain_temp
-- create table brainProtain_temp as
-- select distinct 
--   g.id as geneId,
--  replace(regexp_replace(c.Case_id, '[-_][[:alpha:]]{2}[[:space:]]*$', ''), '.', '-') as participantId,
--   avg(c.value) as value,
--   regexp_like(c.Case_id, '[-_]tu[[:space:]]*$', 'i') as isTumor
-- from brainprotain c
-- inner join geneName g on g.name = c.Gene
-- where 
--   c.Case_id not like 'LungTumor%' and
--   c.Case_id not like 'QC%' and
--   c.value between -30 and 30
-- group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
PRAGMA foreign_keys = OFF;
-- insert into proteinData (cancerId, geneId, participantId, normalValue) VALUES(12,3,'edc',0.5);


insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    <%= cancerId %>  as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from <%= tempTable %>
  where isTumor = 0
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set normalValue = excluded.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    cast(<%= cancerId %> as integer) as cancerId,
    cast(geneId as integer), 
    participantId, 
    value as normalValue
  from <%= tempTable %>
  where isTumor >= 1
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set tumorValue = excluded.tumorValue;

-- copy table into cprosite.DATABASE
--INSERT INTO destDB.cancer(id,name) VALUES(12,'Brain Cancer')
--INSERT INTO destDB.proteinData(cancerId, geneId, participantId,normalValue, tumorValue) 
--SELECT cancerId, geneId, participantId,normalValue, tumorValue FROM proteinData;

