const fs = require("fs");
const _ = require("lodash");

const config = [
  {
    cancer: "cancer_breast",
    proteinTable: "breastcptac2prodata",
    phosphoproteinTable: "breastcptac2phosphodata",
    rnaTable: "breastcptac2rnadata",
    tcgaRnaTable: "breastdata",
  },

  {
    cancer: "cancer_colon",
    proteinTable: "coloncptac2prodata",
    phosphoproteinTable: "coloncptac2phosphodata",
    rnaTable: "coloncptac2rnadata",
    tcgaRnaTable: "colondata",
  },

  {
    cancer: "cancer_head_and_neck",
    proteinTable: "hncptac3prodata",
    phosphoproteinTable: "hncptac3phosphodata",
    rnaTable: "hncptac3rnadata",
    tcgaRnaTable: "hndata",
  },
  {
    cancer: "cancer_kidney",
    proteinTable: "ccrcccptac3prodata",
    phosphoproteinTable: "ccrcccptac3phosphodata",
    rnaTable: "ccrcccptac3rnadata",
  },

  {
    cancer: "cancer_liver",
    proteinTable: "liverhcccptacprodata",
    rnaTable: "liverhcccptacrnadata",
    tcgaRnaTable: "liverhccdata",
  },

  {
    cancer: "cancer_lung_adenocarcinoma",
    proteinTable: "lungadcptac3prodata",
    phosphoproteinTable: "lungadcptac3phosphodata",
    rnaTable: "lungadcptac3rnadata",
    tcgaRnaTable: "lungaddata",
  },

  {
    cancer: "cancer_lung_squamous_cell_carcinoma",
    proteinTable: "lungsqcptac3prodata",
    phosphoproteinTable: "lungsqcptac3phosphodata",
    rnaTable: "lungsqcptac3rnadata",
    tcgaRnaTable: "lungsqdata",
  },

  {
    cancer: "cancer_ovarian",
    proteinTable: "ovcptac2prodata",
    phosphoproteinTable: "ovcptac2phosphodata",
    rnaTable: "ovcptac2rnadata",
    tcgaRnaTable: "ovdata",
  },

  {
    cancer: "cancer_pancreas",
    proteinTable: "pdaccptac3prodata",
    phosphoproteinTable: "pdaccptac3phosphodata",
    rnaTable: "pdaccptac3rnadata",
    tcgaRnaTable: "pancreasdata",
  },

  {
    cancer: "cancer_stomach",
    proteinSinglePoolTable: "stomachcptac3prodata",
    phosphoproteinSinglePoolTable: "stomachcptac3phosphodata",
    tcgaRnaTable: "stomachdata",
  },

  {
    cancer: "cancer_uterine",
    proteinTable: "uterinecptac3prodata",
    rnaTable: "uterinecptac3rnadata",
    tcgaRnaTable: "uterinedata",
  },
];

const mainTableTemplate = _.template(`

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
  accession varchar(50),
  phosphorylationSite varchar(50),
  phosphopeptide varchar(500)
);

create unique index phosphoproteinData_unique_index on phosphoproteinData(cancerId, geneId, participantId, accession, phosphorylationSite, phosphopeptide);

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
`);

const proteinImportTemplate = _.template(`
-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from <%= sourceTable %> c
inner join geneMap g on g.name = c.CCgene
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
  and value between -3 and 3
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
  and value between -3 and 3
) as new
on duplicate key update tumorValue = new.tumorValue;
`);

const proteinSinglePoolImportTemplate = _.template(`
-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  c.CCid as participantId,
  avg(c.CCvalue) as value
from <%= sourceTable %> c
inner join geneMap g on g.name = c.CCgene
group by geneId, participantId;

-- insert protein abundances 
insert into proteinData(cancerId, geneId, participantId, normalValue, tumorValue)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    1 as normalValue, 
    value as tumorValue
  from <%= tempTable %>
  where value between -3 and 3
) as new
on duplicate key update 
  normalValue = new.normalValue,
  tumorValue = new.tumorValue;
`);

const phosphoproteinImportTemplate = _.template(`
-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.PPvalue) as value,
  c.ppid like '%-Tu' as isTumor,
  substring_index(c.NPid, ':', 1) as accession,
  substring_index(c.NPid, ':', -1) as phosphorylationSite,
  c.Ppep as phosphopeptide
from <%= sourceTable %> c
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as normalValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
  where isTumor = 0
  and value between -3 and 3
) as new
on duplicate key update
  normalValue = new.normalValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;


insert into phosphoproteinData(cancerId, geneId, participantId, tumorValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    value as tumorValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
  where isTumor = 1
  and value between -3 and 3
) as new
on duplicate key update
  tumorValue = new.tumorValue,
  accession = new.accession,
  phosphorylationSite = new.phosphorylationSite,
  phosphopeptide = new.phosphopeptide;
`);

const phosphoproteinSinglePoolImportTemplate = _.template(`
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
inner join geneMap g on g.name = c.Ppgene
group by geneId, participantId, accession, phosphorylationSite, phosphopeptide;

insert into phosphoproteinData(cancerId, geneId, participantId, normalValue, tumorValue, accession, phosphorylationSite, phosphopeptide)
select * from (
  select 
    <%= cancerId %> as cancerId,
    geneId, 
    participantId, 
    1 as normalValue, 
    value as tumorValue, 
    accession, 
    phosphorylationSite, 
    phosphopeptide
  from <%= tempTable %>
  where value between -3 and 3
) as new
on duplicate key update
    normalValue = new.normalValue,
    tumorValue = new.tumorValue,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;
`);

const rnaImportTemplate = _.template(`
-- create temporary table for rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
  g.id as geneId,
  regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as participantId,
  avg(c.value) as value,
  c.paid like '%-Tu' as isTumor
from <%= sourceTable %> c
inner join geneMap g on g.name = c.gene
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
`);

const tcgaRnaImportTemplate = _.template(`
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
inner join genemap g on c.gene = g.name;

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
`);

function generateExportSql(config) {
  let sql = mainTableTemplate();

  for (let i = 0; i < config.length; i++) {
    const cancerId = i + 1;
    const {
      proteinTable,
      phosphoproteinTable,
      proteinSinglePoolTable,
      phosphoproteinSinglePoolTable,
      rnaTable,
      tcgaRnaTable,
    } = config[i];

    sql += [
      proteinTable &&
        proteinImportTemplate({
          sourceTable: proteinTable,
          tempTable: `${proteinTable}_temp`,
          cancerId,
        }),
      phosphoproteinTable &&
        phosphoproteinImportTemplate({
          sourceTable: phosphoproteinTable,
          tempTable: `${phosphoproteinTable}_temp`,
          cancerId,
        }),
      proteinSinglePoolTable &&
        proteinSinglePoolImportTemplate({
          sourceTable: proteinSinglePoolTable,
          tempTable: `${proteinSinglePoolTable}_temp`,
          cancerId,
        }),
      phosphoproteinSinglePoolTable &&
        phosphoproteinSinglePoolImportTemplate({
          sourceTable: phosphoproteinSinglePoolTable,
          tempTable: `${phosphoproteinSinglePoolTable}_temp`,
          cancerId,
        }),
      rnaTable &&
        rnaImportTemplate({
          sourceTable: rnaTable,
          tempTable: `${rnaTable}_temp`,
          cancerId,
        }),
      tcgaRnaTable &&
        tcgaRnaImportTemplate({
          sourceTable: tcgaRnaTable,
          tempTable: `${tcgaRnaTable}_temp`,
          cancerId,
        }),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return sql;
}

fs.writeFileSync("export.sql", generateExportSql(config));
