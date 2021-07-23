

drop table if exists proteinData;
create table proteinData (
  id integer auto_increment primary key,
  cancerId integer,
  geneId integer,
  participantId varchar(100),
  normalValue float,
  tumorValue float
);

create unique index proteinData_unique_index on proteinData(cancerId, geneId, participantId);

drop table if exists phosphoproteinData;
create table phosphoproteinData (
  id integer auto_increment primary key,
  cancerId integer,
  geneId integer,
  participantId varchar(100),
  normalValue float,
  tumorValue float,
  accession text,
  phosphorylationSite varchar(100),
  phosphopeptide varchar(1000)
);

create unique index phosphoproteinData_unique_index on phosphoproteinData(cancerId, geneId, participantId);

drop table if exists rnaData;
create table rnaData (
  id integer auto_increment primary key,
  cancerId integer,
  geneId integer,
  participantId varchar(100),
  normalValue float,
  tumorValue float
);

create unique index rnaData_unique_index on rnaData(cancerId, geneId, participantId);

drop table if exists tcgaRnaData;
create table tcgaRnaData (
  id integer auto_increment primary key,
  cancerId integer,
  geneId integer,
  participantId varchar(100),
  normalValue float,
  tumorValue float,
  normalSampleBarcode varchar(100),
  tumorSampleBarcode varchar(100)
);

create unique index tcgaRnaData_unique_index on tcgaRnaData(cancerId, geneId, participantId);

-- create temporary table for protein abundances
drop table if exists breastcptac2prodata_temp;
create table breastcptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from breastcptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from breastcptac2prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from breastcptac2prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists breastcptac2phosphodata_temp;
create table breastcptac2phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from breastcptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from breastcptac2phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from breastcptac2phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists breastcptac2rnadata_temp;
create table breastcptac2rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from breastcptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from breastcptac2rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    1 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from breastcptac2rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists breastdata_temp;
create table breastdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from breastdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    1 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from breastdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      1 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from breastdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists coloncptac2prodata_temp;
create table coloncptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from coloncptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from coloncptac2prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from coloncptac2prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists coloncptac2phosphodata_temp;
create table coloncptac2phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from coloncptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from coloncptac2phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from coloncptac2phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists coloncptac2rnadata_temp;
create table coloncptac2rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from coloncptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from coloncptac2rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    2 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from coloncptac2rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists colondata_temp;
create table colondata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from colondata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    2 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from colondata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      2 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from colondata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists hncptac3prodata_temp;
create table hncptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from hncptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    3 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from hncptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    3 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from hncptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists hncptac3phosphodata_temp;
create table hncptac3phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from hncptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    3 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from hncptac3phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    3 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from hncptac3phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists hndata_temp;
create table hndata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from hndata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    3 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from hndata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      3 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from hndata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists ccrcccptac3prodata_temp;
create table ccrcccptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from ccrcccptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from ccrcccptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from ccrcccptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists ccrcccptac3phosphodata_temp;
create table ccrcccptac3phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from ccrcccptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from ccrcccptac3phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from ccrcccptac3phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists ccrcccptac3rnadata_temp;
create table ccrcccptac3rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from ccrcccptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from ccrcccptac3rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    4 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from ccrcccptac3rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;

-- create temporary table for protein abundances
drop table if exists liverhcccptacprodata_temp;
create table liverhcccptacprodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from liverhcccptacprodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    5 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from liverhcccptacprodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    5 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from liverhcccptacprodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists liverhccdata_temp;
create table liverhccdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from liverhccdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    5 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from liverhccdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      5 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from liverhccdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists lungadcptac3prodata_temp;
create table lungadcptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from lungadcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from lungadcptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from lungadcptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists lungadcptac3phosphodata_temp;
create table lungadcptac3phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from lungadcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from lungadcptac3phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from lungadcptac3phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists lungadcptac3rnadata_temp;
create table lungadcptac3rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from lungadcptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from lungadcptac3rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    6 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from lungadcptac3rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists lungaddata_temp;
create table lungaddata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from lungaddata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    6 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from lungaddata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      6 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from lungaddata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists lungsqcptac3prodata_temp;
create table lungsqcptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from lungsqcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from lungsqcptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from lungsqcptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists lungsqcptac3phosphodata_temp;
create table lungsqcptac3phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from lungsqcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from lungsqcptac3phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from lungsqcptac3phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists lungsqcptac3rnadata_temp;
create table lungsqcptac3rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from lungsqcptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from lungsqcptac3rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    7 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from lungsqcptac3rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists lungsqdata_temp;
create table lungsqdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from lungsqdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    7 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from lungsqdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      7 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from lungsqdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists ovcptac2prodata_temp;
create table ovcptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from ovcptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from ovcptac2prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from ovcptac2prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists ovcptac2phosphodata_temp;
create table ovcptac2phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from ovcptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from ovcptac2phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from ovcptac2phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists ovcptac2rnadata_temp;
create table ovcptac2rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from ovcptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from ovcptac2rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    8 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from ovcptac2rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists ovdata_temp;
create table ovdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from ovdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    8 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from ovdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      8 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from ovdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists pdaccptac3prodata_temp;
create table pdaccptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from pdaccptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    9 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from pdaccptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    9 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from pdaccptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists pdaccptac3phosphodata_temp;
create table pdaccptac3phosphodata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from pdaccptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    9 as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from pdaccptac3phosphodata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    9 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from pdaccptac3phosphodata_temp
  where isTumor = 1
) as new
on duplicate key update
    tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists pancreasdata_temp;
create table pancreasdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from pancreasdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    9 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from pancreasdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      9 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from pancreasdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists stomachcptac3prodata_temp;
create table stomachcptac3prodata_temp as
select distinct 
  g.id as geneId,
  c.CCid as participantId,
  avg(c.CCvalue) as value
from stomachcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId;

-- insert protein abundances 
insert into proteinData(cancerId, geneId, participantId, normalValue, tumorValue)
select * from (
  select 
    10 as cancerId,
    geneId, 
    participantId, 
    1 as normalValue, 
    value as tumorValue
  from stomachcptac3prodata_temp
) as new
on duplicate key update 
  normalValue = new.normalValue,
  tumorValue = new.tumorValue;



-- create temporary table for phosphoprotein abundances
drop table if exists stomachcptac3phosphodata_temp;
create table stomachcptac3phosphodata_temp as
select distinct
  g.id as geneId,
  c.ppid as participantId,
  avg(c.PPvalue) as value,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from stomachcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, tumorValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    10 as cancerId,
    geneId, 
    participantId, 
    1 as normalValue, 
    value as tumorValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from stomachcptac3phosphodata_temp
) as new
on duplicate key update
    normalValue = new.normalValue,
    tumorValue = new.tumorValue,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;



-- create temporary table for tcga rna levels
drop table if exists stomachdata_temp;
create table stomachdata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from stomachdata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    10 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from stomachdata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      10 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from stomachdata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  

-- create temporary table for protein abundances
drop table if exists uterinecptac3prodata_temp;
create table uterinecptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from uterinecptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId, isTumor;

-- insert protein abundances for normal tissue samples
insert into proteinData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    11 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from uterinecptac3prodata_temp
  where isTumor = 0
) as new
on duplicate key update normalValue = new.normalValue;

-- insert protein abundances for tumor tissue samples
insert into proteinData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    11 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue
  from uterinecptac3prodata_temp
  where isTumor = 1
) as new
on duplicate key update tumorValue = new.tumorValue;



-- create temporary table for rna levels
drop table if exists uterinecptac3rnadata_temp;
create table uterinecptac3rnadata_temp as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from uterinecptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, participantId, isTumor;

insert into rnaData(cancerId, geneId, participantId, normalValue)
select * from (
  select 
    11 as cancerId,
    geneId, 
    participantId, 
    value as normalValue
  from uterinecptac3rnadata_temp
  where isTumor = 0
) as new
on duplicate key update
  normalValue = new.normalValue;

insert into rnaData(cancerId, geneId, participantId, tumorValue)
select * from (
  select 
    11 as cancerId,
    geneId, 
    participantId, 
    value as tumorValue 
  from uterinecptac3rnadata_temp
  where isTumor = 1
) as new
on duplicate key update
  tumorValue = new.tumorValue;



-- create temporary table for tcga rna levels
drop table if exists uterinedata_temp;
create table uterinedata_temp as
select distinct
  g.id as geneId,
  substring_index(paid, '-', 3) as participantId,
  substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
  c.paid as sampleBarcode,
  c.value
from uterinedata c
inner join genemap g on c.gene = g.name;

insert into tcgaRnaData(cancerId, geneId, participantId, normalValue, normalSampleBarcode)
select * from (
  select
    11 as cancerId,
    geneId,
    participantId,
    avg(value) as normalValue,
    group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as normalSampleBarcode
  from uterinedata_temp
  where sampleType = '11'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  normalValue = new.normalValue,
  normalSampleBarcode = new.normalSampleBarcode;


insert into tcgaRnaData(cancerId, geneId, participantId, tumorValue, tumorSampleBarcode)
select * from (
  select
      11 as cancerId,
      geneId,
      participantId,
      avg(value) as tumorValue,
      group_concat(distinct sampleBarcode order by sampleBarcode asc separator ';') as tumorSampleBarcode
  from uterinedata_temp
  where sampleType = '01'
  group by cancerId, geneId, participantId
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  tumorSampleBarcode = new.tumorSampleBarcode;  
