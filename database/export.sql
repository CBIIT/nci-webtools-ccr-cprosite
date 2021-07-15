
drop table if exists cancer_breast;
create table cancer_breast (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_breast_geneId_caseId_uindex	
on cancer_breast (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists breastcptac2prodata_temp;
create table breastcptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from breastcptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_breast(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from breastcptac2prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_breast(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from breastcptac2prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists breastcptac2phosphodata_temp;
create table breastcptac2phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from breastcptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_breast(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from breastcptac2phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_breast(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from breastcptac2phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists breastcptac2rnadata_temp;
create table breastcptac2rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from breastcptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_breast(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from breastcptac2rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_breast(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from breastcptac2rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists breastdata_temp;
create table breastdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from breastdata c
inner join genemap g on c.gene = g.name;

insert into cancer_breast(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from breastdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_breast(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from breastdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_ccrcc;
create table cancer_ccrcc (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_ccrcc_geneId_caseId_uindex	
on cancer_ccrcc (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists ccrcccptac3prodata_temp;
create table ccrcccptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from ccrcccptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_ccrcc(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from ccrcccptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_ccrcc(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from ccrcccptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists ccrcccptac3phosphodata_temp;
create table ccrcccptac3phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from ccrcccptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_ccrcc(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from ccrcccptac3phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_ccrcc(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from ccrcccptac3phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists ccrcccptac3rnadata_temp;
create table ccrcccptac3rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from ccrcccptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_ccrcc(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from ccrcccptac3rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_ccrcc(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from ccrcccptac3rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;

drop table if exists cancer_colon;
create table cancer_colon (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_colon_geneId_caseId_uindex	
on cancer_colon (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists coloncptac2prodata_temp;
create table coloncptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from coloncptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_colon(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from coloncptac2prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_colon(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from coloncptac2prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists coloncptac2phosphodata_temp;
create table coloncptac2phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from coloncptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_colon(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from coloncptac2phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_colon(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from coloncptac2phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists coloncptac2rnadata_temp;
create table coloncptac2rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from coloncptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_colon(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from coloncptac2rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_colon(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from coloncptac2rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists colondata_temp;
create table colondata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from colondata c
inner join genemap g on c.gene = g.name;

insert into cancer_colon(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from colondata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_colon(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from colondata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_head_and_neck;
create table cancer_head_and_neck (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_head_and_neck_geneId_caseId_uindex	
on cancer_head_and_neck (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists hncptac3prodata_temp;
create table hncptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from hncptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_head_and_neck(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from hncptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_head_and_neck(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from hncptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists hncptac3phosphodata_temp;
create table hncptac3phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from hncptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_head_and_neck(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from hncptac3phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_head_and_neck(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from hncptac3phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for tcga rna levels
drop table if exists hndata_temp;
create table hndata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from hndata c
inner join genemap g on c.gene = g.name;

insert into cancer_head_and_neck(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from hndata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_head_and_neck(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from hndata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_liver;
create table cancer_liver (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_liver_geneId_caseId_uindex	
on cancer_liver (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists liverhcccptacprodata_temp;
create table liverhcccptacprodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from liverhcccptacprodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_liver(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from liverhcccptacprodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_liver(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from liverhcccptacprodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for tcga rna levels
drop table if exists liverhccdata_temp;
create table liverhccdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from liverhccdata c
inner join genemap g on c.gene = g.name;

insert into cancer_liver(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from liverhccdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_liver(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from liverhccdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_lung_adenocarcinoma;
create table cancer_lung_adenocarcinoma (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_lung_adenocarcinoma_geneId_caseId_uindex	
on cancer_lung_adenocarcinoma (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists lungadcptac3prodata_temp;
create table lungadcptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from lungadcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_lung_adenocarcinoma(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from lungadcptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_lung_adenocarcinoma(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from lungadcptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists lungadcptac3phosphodata_temp;
create table lungadcptac3phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from lungadcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_lung_adenocarcinoma(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from lungadcptac3phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_lung_adenocarcinoma(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from lungadcptac3phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists lungadcptac3rnadata_temp;
create table lungadcptac3rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from lungadcptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_lung_adenocarcinoma(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from lungadcptac3rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_lung_adenocarcinoma(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from lungadcptac3rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists lungaddata_temp;
create table lungaddata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from lungaddata c
inner join genemap g on c.gene = g.name;

insert into cancer_lung_adenocarcinoma(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from lungaddata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_lung_adenocarcinoma(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from lungaddata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_lung_squamous_cell_carcinoma;
create table cancer_lung_squamous_cell_carcinoma (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_lung_squamous_cell_carcinoma_geneId_caseId_uindex	
on cancer_lung_squamous_cell_carcinoma (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists lungsqcptac3prodata_temp;
create table lungsqcptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from lungsqcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from lungsqcptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from lungsqcptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists lungsqcptac3phosphodata_temp;
create table lungsqcptac3phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from lungsqcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from lungsqcptac3phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from lungsqcptac3phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists lungsqcptac3rnadata_temp;
create table lungsqcptac3rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from lungsqcptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from lungsqcptac3rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from lungsqcptac3rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists lungsqdata_temp;
create table lungsqdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from lungsqdata c
inner join genemap g on c.gene = g.name;

insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from lungsqdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_lung_squamous_cell_carcinoma(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from lungsqdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_ovarian;
create table cancer_ovarian (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_ovarian_geneId_caseId_uindex	
on cancer_ovarian (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists ovcptac2prodata_temp;
create table ovcptac2prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from ovcptac2prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_ovarian(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from ovcptac2prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_ovarian(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from ovcptac2prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists ovcptac2phosphodata_temp;
create table ovcptac2phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from ovcptac2phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_ovarian(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from ovcptac2phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_ovarian(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from ovcptac2phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for rna levels
drop table if exists ovcptac2rnadata_temp;
create table ovcptac2rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from ovcptac2rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_ovarian(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from ovcptac2rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_ovarian(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from ovcptac2rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists ovdata_temp;
create table ovdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from ovdata c
inner join genemap g on c.gene = g.name;

insert into cancer_ovarian(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from ovdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_ovarian(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from ovdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_pancreas;
create table cancer_pancreas (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_pancreas_geneId_caseId_uindex	
on cancer_pancreas (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists pdaccptac3prodata_temp;
create table pdaccptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from pdaccptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_pancreas(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from pdaccptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_pancreas(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from pdaccptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists pdaccptac3phosphodata_temp;
create table pdaccptac3phosphodata_temp as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from pdaccptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into cancer_pancreas(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from pdaccptac3phosphodata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into cancer_pancreas(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from pdaccptac3phosphodata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;



-- create temporary table for tcga rna levels
drop table if exists pancreasdata_temp;
create table pancreasdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from pancreasdata c
inner join genemap g on c.gene = g.name;

insert into cancer_pancreas(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from pancreasdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_pancreas(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from pancreasdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_stomach;
create table cancer_stomach (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_stomach_geneId_caseId_uindex	
on cancer_stomach (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists stomachcptac3prodata_temp;
create table stomachcptac3prodata_temp as
select distinct 
  g.id as geneId,
  c.CCid as caseId,
  avg(c.CCvalue) as value
from stomachcptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId;

-- insert protein abundances 
insert into cancer_stomach(geneId, caseId, normalProteinLogRatio, tumorProteinLogRatio)
select * from (
    select geneId, caseId, 1 as normalProteinLogRatio, value as tumorProteinLogRatio
    from stomachcptac3prodata_temp
) as new
on duplicate key update 
  normalProteinLogRatio = new.normalProteinLogRatio,
  tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for phosphoprotein abundances
drop table if exists stomachcptac3phosphodata_temp;
create table stomachcptac3phosphodata_temp as
select distinct
    g.id as geneId,
    c.ppid as caseId,
    avg(c.PPvalue) as value,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from stomachcptac3phosphodata c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, accession, phosphorylationSite, phosphopeptide;

insert into cancer_stomach(geneId, caseId, normalPhosphoproteinLogRatio, tumorPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, 1 as normalPhosphoproteinLogRatio, value as tumorPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from stomachcptac3phosphodata_temp
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;



-- create temporary table for tcga rna levels
drop table if exists stomachdata_temp;
create table stomachdata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from stomachdata c
inner join genemap g on c.gene = g.name;

insert into cancer_stomach(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from stomachdata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_stomach(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from stomachdata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  

drop table if exists cancer_uterine;
create table cancer_uterine (
    geneId integer,
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaBarcode varchar(1000),
    normalTcgaRnaValue float,
    tumorTcgaBarcode varchar(1000),
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);
create unique index cancer_uterine_geneId_caseId_uindex	
on cancer_uterine (geneId, caseId);



-- create temporary table for protein abundances
drop table if exists uterinecptac3prodata_temp;
create table uterinecptac3prodata_temp as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from uterinecptac3prodata c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into cancer_uterine(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from uterinecptac3prodata_temp
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into cancer_uterine(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from uterinecptac3prodata_temp
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;



-- create temporary table for rna levels
drop table if exists uterinecptac3rnadata_temp;
create table uterinecptac3rnadata_temp as
select g.id as geneId,
      regexp_replace(c.value, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from uterinecptac3rnadata c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into cancer_uterine(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from uterinecptac3rnadata_temp
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into cancer_uterine(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from uterinecptac3rnadata_temp
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;



-- create temporary table for tcga rna levels
drop table if exists uterinedata_temp;
create table uterinedata_temp as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from uterinedata c
inner join genemap g on c.gene = g.name;

insert into cancer_uterine(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from uterinedata_temp
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into cancer_uterine(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from uterinedata_temp
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  
