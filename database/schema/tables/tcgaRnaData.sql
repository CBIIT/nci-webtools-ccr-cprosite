-- create temporary table for tcga rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  substr(paid,1,instr(paid,(select substr(s, instr(s,'-')+1) From (Select SUBSTR(SUBSTR(paid, INSTR(paid, '-') +1), INSTR(SUBSTR(paid, INSTR(paid, '-') +1), '-') +1) as s)))-2) as participantId,
  substr((select substr(s, instr(s,'-')+1) from (Select SUBSTR(SUBSTR(paid, INSTR(paid, '-') +1), INSTR(SUBSTR(paid, INSTR(paid, '-') +1), '-') +1) as s)),1,2) as sampleType,
  c.paid as sampleBarcode,
  c.value as value
from <%= sourceTable %> c
inner join geneName g on c.gene = g.name;

PRAGMA foreign_keys = OFF;
insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
 select
    <%= cancerId %> as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
	  replace(group_concat(distinct sampleBarcode) ,',',';') as normalSampleBarcode
  from (select * from <%= tempTable %> order by sampleBarcode Asc)
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set 
  normalValue = excluded.normalValue,
  normalSampleBarcode = excluded.normalSampleBarcode; 

insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
 select
    <%= cancerId %> as cancerId,
    geneId,
    participantId,
    avg(value) as tumorValue,
	  replace(group_concat(distinct sampleBarcode) ,',',';') as tumorSampleBarcode
  from (select * from <%= tempTable %> order by sampleBarcode Asc)
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
where true
on CONFLICT(cancerId, geneId, participantId) DO update set 
  tumorValue = excluded.tumorValue,
  tumorSampleBarcode = excluded.tumorSampleBarcode; 
