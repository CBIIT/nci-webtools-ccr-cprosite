const fs = require('fs');
const _ = require('lodash');


const config = [
  {
    cancer: 'cancer_breast',
    proteinTable: 'breastcptac2prodata',
    phosphoproteinTable: 'breastcptac2phosphodata',
    rnaTable: 'breastcptac2rnadata',
    tcgaRnaTable: 'breastdata',
  },
  {
    cancer: 'cancer_ccrcc',
    proteinTable: 'ccrcccptac3prodata',
    phosphoproteinTable: 'ccrcccptac3phosphodata',
    rnaTable: 'ccrcccptac3rnadata',
  },
  
  {
    cancer: 'cancer_colon',
    proteinTable: 'coloncptac2prodata',
    phosphoproteinTable: 'coloncptac2phosphodata',
    rnaTable: 'coloncptac2rnadata',
    tcgaRnaTable: 'colondata',
  },
  
  {
    cancer: 'cancer_head_and_neck',
    proteinTable: 'hncptac3prodata',
    phosphoproteinTable: 'hncptac3phosphodata',
    tcgaRnaTable: 'hndata',
  },
  
  {
    cancer: 'cancer_liver',
    proteinTable: 'liverhcccptacprodata',
    tcgaRnaTable: 'liverhccdata',
  },
  
  {
    cancer: 'cancer_lung_adenocarcinoma',
    proteinTable: 'lungadcptac3prodata',
    phosphoproteinTable: 'lungadcptac3phosphodata',
    rnaTable: 'lungadcptac3rnadata',
    tcgaRnaTable: 'lungaddata',
  },
  
  {
    cancer: 'cancer_lung_squamous_cell_carcinoma',
    proteinTable: 'lungsqcptac3prodata',
    phosphoproteinTable: 'lungsqcptac3phosphodata',
    rnaTable: 'lungsqcptac3rnadata',
    tcgaRnaTable: 'lungsqdata',
  },
  
  {
    cancer: 'cancer_ovarian',
    proteinTable: 'ovcptac2prodata',
    phosphoproteinTable: 'ovcptac2phosphodata',
    rnaTable: 'ovcptac2rnadata',
    tcgaRnaTable: 'ovdata',
  },

  {
    cancer: 'cancer_pancreas',
    proteinTable: 'pdaccptac3prodata',
    phosphoproteinTable: 'pdaccptac3phosphodata',
    tcgaRnaTable: 'pancreasdata',
  },

  {
    cancer: 'cancer_stomach',
    proteinSinglePoolTable: 'stomachcptac3prodata',
    phosphoproteinSinglePoolTable: 'stomachcptac3phosphodata',
    tcgaRnaTable: 'stomachdata',
  },

  {
    cancer: 'cancer_uterine',
    proteinTable: 'uterinecptac3prodata',
    rnaTable: 'uterinecptac3rnadata',
    tcgaRnaTable: 'uterinedata',
  },

];

const mainTableTemplate = _.template(`
drop table if exists <%= mainTable %>;
create table <%= mainTable %> (
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
create unique index <%= mainTable %>_geneId_caseId_uindex	
on <%= mainTable %> (geneId, caseId);
`)

const proteinImportTemplate = _.template(`
-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  regexp_replace(c.CCid, '-[A-Za-z]{2}$', '') as caseId,
  avg(c.CCvalue) as value,
  c.CCid like '%-Tu' as isTumor
from <%= sourceTable %> c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId, isTumor;

-- insert protein abundances for normal tissue
insert into <%= mainTable %>(geneId, caseId, normalProteinLogRatio)
select * from (
    select geneId, caseId, value as normalProteinLogRatio
    from <%= tempTable %>
    where isTumor = 0
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

-- insert protein abundances for tumors
insert into <%= mainTable %>(geneId, caseId, tumorProteinLogRatio)
select * from (
    select geneId, caseId, value as tumorProteinLogRatio
    from <%= tempTable %>
    where isTumor = 1
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;
`);


const proteinSinglePoolImportTemplate = _.template(`
-- create temporary table for protein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct 
  g.id as geneId,
  c.CCid as caseId,
  avg(c.CCvalue) as value
from <%= sourceTable %> c
inner join geneMap g on g.name = c.CCgene
group by geneId, caseId;

-- insert protein abundances 
insert into <%= mainTable %>(geneId, caseId, normalProteinLogRatio, tumorProteinLogRatio)
select * from (
    select geneId, caseId, 1 as normalProteinLogRatio, value as tumorProteinLogRatio
    from <%= tempTable %>
) as new
on duplicate key update 
  normalProteinLogRatio = new.normalProteinLogRatio,
  tumorProteinLogRatio = new.tumorProteinLogRatio;
`);

const phosphoproteinImportTemplate = _.template(`
-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
    g.id as geneId,
    regexp_replace(c.ppid, '-[A-Za-z]{2}$', '') as caseId,
    avg(c.PPvalue) as value,
    c.ppid like '%-Tu' as isTumor,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from <%= sourceTable %> c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, isTumor, accession, phosphorylationSite, phosphopeptide;

insert into <%= mainTable %>(geneId, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, value as normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from <%= tempTable %>
    where isTumor = 0
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into <%= mainTable %>(geneId, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select geneId, caseId, value as tumorPhosphoproteinLogRatio
    from <%= tempTable %>
    where isTumor = 1
) as new
on duplicate key update
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;
`);


const phosphoproteinSinglePoolImportTemplate = _.template(`
-- create temporary table for phosphoprotein abundances
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
    g.id as geneId,
    c.ppid as caseId,
    avg(c.PPvalue) as value,
    c.Ppep as phosphopeptide,
    substring_index(c.NPid, ':', 1) as accession,
    substring_index(c.NPid, ':', -1) as phosphorylationSite
from <%= sourceTable %> c
inner join geneMap g on g.name = c.Ppgene
group by geneId, caseId, accession, phosphorylationSite, phosphopeptide;

insert into <%= mainTable %>(geneId, caseId, normalPhosphoproteinLogRatio, tumorPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select geneId, caseId, 1 as normalPhosphoproteinLogRatio, value as tumorPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide
    from <%= tempTable %>
) as new
on duplicate key update
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;
`);

const rnaImportTemplate = _.template(`
-- create temporary table for rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select g.id as geneId,
      regexp_replace(c.paid, '-[A-Za-z]{2}$', '') as caseId,
      avg(c.value) as value,
      c.paid like '%-Tu' as isTumor
from <%= sourceTable %> c
inner join geneMap g on g.name = c.gene
group by geneId, caseId, isTumor;

insert into <%= mainTable %>(geneId, caseId, normalRnaValue)
select * from (
    select geneId, caseId, value as normalRnaValue
    from <%= tempTable %>
    where isTumor = 0
) as new
on duplicate key update
    normalRnaValue = new.normalRnaValue;

insert into <%= mainTable %>(geneId, caseId, tumorRnaValue)
select * from (
    select geneId, caseId, value as tumorRnaValue
    from <%= tempTable %>
    where isTumor = 1
) as new
on duplicate key update
    tumorRnaValue = new.tumorRnaValue;
`);

const tcgaRnaImportTemplate = _.template(`
-- create temporary table for tcga rna levels
drop table if exists <%= tempTable %>;
create table <%= tempTable %> as
select distinct
    g.id as geneId,
    substring_index(paid, '-', 3) as caseId,
    substring(substring_index(paid, '-', -4), 1, 2) as sampleType,
    c.paid as tcgaBarcode,
    c.value
from <%= sourceTable %> c
inner join genemap g on c.gene = g.name;

insert into <%= mainTable %>(geneId, caseId, normalTcgaBarcode, normalTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as normalTcgaBarcode,
        avg(value) as normalTcgaRnaValue
    from <%= tempTable %>
    where sampleType = '11'
    group by geneId, caseId
) as new
on duplicate key update
    normalTcgaBarcode = new.normalTcgaBarcode,
    normalTcgaRnaValue = new.normalTcgaRnaValue;


insert into <%= mainTable %>(geneId, caseId, tumorTcgaBarcode, tumorTcgaRnaValue)
select * from (
    select
        geneId,
        caseId,
        group_concat(distinct tcgaBarcode order by tcgaBarcode asc separator ';') as tumorTcgaBarcode,
        avg(value) as tumorTcgaRnaValue
    from <%= tempTable %>
    where sampleType = '01'
    group by geneId, caseId
) as new
on duplicate key update
    tumorTcgaBarcode = new.tumorTcgaBarcode,
    tumorTcgaRnaValue = new.tumorTcgaRnaValue;  
`);


function generateExportSql(config) {
  let sql = '';

  for (const entry of config) {
    const {
      cancer: mainTable,
      proteinTable,
      phosphoproteinTable,
      proteinSinglePoolTable,
      phosphoproteinSinglePoolTable,
      rnaTable,
      tcgaRnaTable
    } = entry;

    sql += [
      mainTableTemplate({mainTable}),
      proteinTable && proteinImportTemplate({mainTable, sourceTable: proteinTable, tempTable: `${proteinTable}_temp` }),
      phosphoproteinTable && phosphoproteinImportTemplate({mainTable, sourceTable: phosphoproteinTable, tempTable: `${phosphoproteinTable}_temp` }),
      proteinSinglePoolTable && proteinSinglePoolImportTemplate({mainTable, sourceTable: proteinSinglePoolTable, tempTable: `${proteinSinglePoolTable}_temp` }),
      phosphoproteinSinglePoolTable && phosphoproteinSinglePoolImportTemplate({mainTable, sourceTable: phosphoproteinSinglePoolTable, tempTable: `${phosphoproteinSinglePoolTable}_temp` }),
      rnaTable && rnaImportTemplate({mainTable, sourceTable: rnaTable, tempTable: `${rnaTable}_temp` }),
      tcgaRnaTable && tcgaRnaImportTemplate({mainTable, sourceTable: tcgaRnaTable, tempTable: `${tcgaRnaTable}_temp` }),
    ].filter(Boolean).join('\n\n');
  }

  return sql;
}

fs.writeFileSync('export.sql', generateExportSql(config));