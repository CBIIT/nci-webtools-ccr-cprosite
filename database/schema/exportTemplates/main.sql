
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


drop table if exists gene;
create table gene as (
  select distinct cast(substring_index(id, ':', -1) as unsigned) as id, name, description from geneSource
);

drop table if exists geneName;
create table geneName as (
  select distinct cast(substring_index(id, ':', -1) as unsigned) as id, name from geneSource where name != ''
  union
  select distinct cast(substring_index(id, ':', -1) as unsigned) as id, previousName as name from geneSource where previousName != ''
);

create index geneName_id_name_index on geneName (id, name);