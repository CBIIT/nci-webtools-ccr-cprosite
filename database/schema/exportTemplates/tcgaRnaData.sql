-- create temporary table for tcga rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from <%= sourceTable %> c
inner join geneName g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    <%= cancerId %> as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from <%= tempTable %>
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      <%= cancerId %> as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from <%= tempTable %>
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  