/*

drop table if exists TUMOR_PREFIX;
create table TUMOR_PREFIX (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index TUMOR_PREFIX_gene_caseId_unique_index
on TUMOR_PREFIX(gene, caseId);


insert into TUMOR_PREFIX(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from TUMOR_PREFIXprodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into TUMOR_PREFIX(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from TUMOR_PREFIXprodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into TUMOR_PREFIX(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from TUMOR_PREFIXphosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into TUMOR_PREFIX(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from TUMOR_PREFIXphosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into TUMOR_PREFIX(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from TUMOR_PREFIXRNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into TUMOR_PREFIX(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from TUMOR_PREFIXRNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;


-- eg: 
['breastcptac2', 'ccrcccptac3', 'coloncptac2', 'HNCPTAC3', 'liverHCCcptac', 'lungadcptac3', 'lungsqcptac3', 'ovcptac2', 'PDACcptac3', 'stomachcptac3', 'uterinecptac3'].map(e => sqltemplate.replace(/TUMOR_PREFIX/g, e)).join('\n\n')
*/


drop table if exists breastcptac2;
create table breastcptac2 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index breastcptac2_gene_caseId_unique_index
on breastcptac2(gene, caseId);


insert into breastcptac2(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from breastcptac2prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into breastcptac2(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from breastcptac2prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into breastcptac2(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from breastcptac2phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into breastcptac2(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from breastcptac2phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into breastcptac2(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from breastcptac2RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into breastcptac2(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from breastcptac2RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists ccrcccptac3;
create table ccrcccptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index ccrcccptac3_gene_caseId_unique_index
on ccrcccptac3(gene, caseId);


insert into ccrcccptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from ccrcccptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into ccrcccptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from ccrcccptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into ccrcccptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from ccrcccptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into ccrcccptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from ccrcccptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into ccrcccptac3(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from ccrcccptac3RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into ccrcccptac3(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from ccrcccptac3RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists coloncptac2;
create table coloncptac2 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index coloncptac2_gene_caseId_unique_index
on coloncptac2(gene, caseId);


insert into coloncptac2(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from coloncptac2prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into coloncptac2(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from coloncptac2prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into coloncptac2(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from coloncptac2phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into coloncptac2(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from coloncptac2phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into coloncptac2(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from coloncptac2RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into coloncptac2(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from coloncptac2RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists HNCPTAC3;
create table HNCPTAC3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index HNCPTAC3_gene_caseId_unique_index
on HNCPTAC3(gene, caseId);


insert into HNCPTAC3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from HNCPTAC3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into HNCPTAC3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from HNCPTAC3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into HNCPTAC3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from HNCPTAC3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into HNCPTAC3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from HNCPTAC3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


-- insert into HNCPTAC3(gene, caseId, normalRnaValue)
-- select * from (
--     select
--         gene,
--         regexp_replace(paid, '-No$', '') as caseId,
--         avg(value) as normalRnaValue
--     from HNCPTAC3RNAdata where paid like '%-No'
--     group by gene, caseId
-- ) as new
-- on duplicate key update normalRnaValue = new.normalRnaValue;

-- insert into HNCPTAC3(gene, caseId, tumorRnaValue)
-- select * from (
--     select 
--         gene, 
--         regexp_replace(paid, '-Tu$', '') as caseId, 
--         avg(value) as tumorRnaValue
--     from HNCPTAC3RNAdata where paid like '%-Tu'
--     group by gene, caseId              
-- ) as new
-- on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists liverHCCcptac;
create table liverHCCcptac (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index liverHCCcptac_gene_caseId_unique_index
on liverHCCcptac(gene, caseId);


insert into liverHCCcptac(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from liverHCCcptacprodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into liverHCCcptac(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from liverHCCcptacprodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


-- insert into liverHCCcptac(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
-- select * from (
--     select
--         PPgene as gene,
--         regexp_replace(PPid, '-No$', '') as caseId,
--         avg(PPvalue) as normalPhosphoproteinLogRatio,
--         substring_index(NPid, ':', 1) as accession,
--         substring_index(NPid, ':', -1) as phosphorylationSite,
--         Ppep as phosphopeptide
--     from liverHCCcptacphosphodata where PPid like '%-No'
--     group by gene, caseId, accession, phosphorylationSite, phosphopeptide
-- ) as new
-- on duplicate key update 
--     normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
--     accession = new.accession,
--     phosphorylationSite = new.phosphorylationSite,
--     phosphopeptide = new.phosphopeptide;

-- insert into liverHCCcptac(gene, caseId, tumorPhosphoproteinLogRatio)
-- select * from (
--     select
--         PPgene as gene,
--         regexp_replace(PPid, '-Tu$', '') as caseId,
--         avg(PPvalue) as tumorPhosphoproteinLogRatio
--     from liverHCCcptacphosphodata where PPid like '%-Tu'
--     group by gene, caseId
-- ) as new
-- on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


-- insert into liverHCCcptac(gene, caseId, normalRnaValue)
-- select * from (
--     select
--         gene,
--         regexp_replace(paid, '-No$', '') as caseId,
--         avg(value) as normalRnaValue
--     from liverHCCcptacRNAdata where paid like '%-No'
--     group by gene, caseId
-- ) as new
-- on duplicate key update normalRnaValue = new.normalRnaValue;

-- insert into liverHCCcptac(gene, caseId, tumorRnaValue)
-- select * from (
--     select 
--         gene, 
--         regexp_replace(paid, '-Tu$', '') as caseId, 
--         avg(value) as tumorRnaValue
--     from liverHCCcptacRNAdata where paid like '%-Tu'
--     group by gene, caseId              
-- ) as new
-- on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists lungadcptac3;
create table lungadcptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index lungadcptac3_gene_caseId_unique_index
on lungadcptac3(gene, caseId);


insert into lungadcptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from lungadcptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into lungadcptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from lungadcptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into lungadcptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from lungadcptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into lungadcptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from lungadcptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into lungadcptac3(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from lungadcptac3RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into lungadcptac3(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from lungadcptac3RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists lungsqcptac3;
create table lungsqcptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index lungsqcptac3_gene_caseId_unique_index
on lungsqcptac3(gene, caseId);


insert into lungsqcptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from lungsqcptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into lungsqcptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from lungsqcptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into lungsqcptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from lungsqcptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into lungsqcptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from lungsqcptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into lungsqcptac3(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from lungsqcptac3RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into lungsqcptac3(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from lungsqcptac3RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists ovcptac2;
create table ovcptac2 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index ovcptac2_gene_caseId_unique_index
on ovcptac2(gene, caseId);


insert into ovcptac2(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from ovcptac2prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into ovcptac2(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from ovcptac2prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into ovcptac2(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from ovcptac2phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into ovcptac2(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from ovcptac2phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into ovcptac2(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from ovcptac2RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into ovcptac2(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from ovcptac2RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists PDACcptac3;
create table PDACcptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index PDACcptac3_gene_caseId_unique_index
on PDACcptac3(gene, caseId);


insert into PDACcptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from PDACcptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into PDACcptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from PDACcptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into PDACcptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from PDACcptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into PDACcptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from PDACcptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


-- insert into PDACcptac3(gene, caseId, normalRnaValue)
-- select * from (
--     select
--         gene,
--         regexp_replace(paid, '-No$', '') as caseId,
--         avg(value) as normalRnaValue
--     from PDACcptac3RNAdata where paid like '%-No'
--     group by gene, caseId
-- ) as new
-- on duplicate key update normalRnaValue = new.normalRnaValue;

-- insert into PDACcptac3(gene, caseId, tumorRnaValue)
-- select * from (
--     select 
--         gene, 
--         regexp_replace(paid, '-Tu$', '') as caseId, 
--         avg(value) as tumorRnaValue
--     from PDACcptac3RNAdata where paid like '%-Tu'
--     group by gene, caseId              
-- ) as new
-- on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists stomachcptac3;
create table stomachcptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index stomachcptac3_gene_caseId_unique_index
on stomachcptac3(gene, caseId);


insert into stomachcptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from stomachcptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into stomachcptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from stomachcptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into stomachcptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from stomachcptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into stomachcptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from stomachcptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


-- insert into stomachcptac3(gene, caseId, normalRnaValue)
-- select * from (
--     select
--         gene,
--         regexp_replace(paid, '-No$', '') as caseId,
--         avg(value) as normalRnaValue
--     from stomachcptac3RNAdata where paid like '%-No'
--     group by gene, caseId
-- ) as new
-- on duplicate key update normalRnaValue = new.normalRnaValue;

-- insert into stomachcptac3(gene, caseId, tumorRnaValue)
-- select * from (
--     select 
--         gene, 
--         regexp_replace(paid, '-Tu$', '') as caseId, 
--         avg(value) as tumorRnaValue
--     from stomachcptac3RNAdata where paid like '%-Tu'
--     group by gene, caseId              
-- ) as new
-- on duplicate key update tumorRnaValue = new.tumorRnaValue;

drop table if exists uterinecptac3;
create table uterinecptac3 (
    gene varchar(100),
    caseId varchar(50),
    normalProteinLogRatio float,
    tumorProteinLogRatio float,
    normalPhosphoproteinLogRatio float,
    tumorPhosphoproteinLogRatio float,
    normalRnaValue float,
    tumorRnaValue float,
    normalTcgaRnaValue float,
    tumorTcgaRnaValue float,
    accession varchar(100),
    phosphorylationSite varchar(100),
    phosphopeptide varchar(2000)
);

create unique index uterinecptac3_gene_caseId_unique_index
on uterinecptac3(gene, caseId);


insert into uterinecptac3(gene, caseId, normalProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-No$', '') as caseId,
        avg(CCvalue) as normalProteinLogRatio
    from uterinecptac3prodata where CCid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalProteinLogRatio = new.normalProteinLogRatio;

insert into uterinecptac3(gene, caseId, tumorProteinLogRatio)
select * from (
    select 
        CCgene as gene,
        regexp_replace(CCid, '-Tu$', '') as caseId,
        avg(CCvalue) as tumorProteinLogRatio
    from uterinecptac3prodata where CCid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorProteinLogRatio = new.tumorProteinLogRatio;


insert into uterinecptac3(gene, caseId, normalPhosphoproteinLogRatio, accession, phosphorylationSite, phosphopeptide)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-No$', '') as caseId,
        avg(PPvalue) as normalPhosphoproteinLogRatio,
        substring_index(NPid, ':', 1) as accession,
        substring_index(NPid, ':', -1) as phosphorylationSite,
        Ppep as phosphopeptide
    from uterinecptac3phosphodata where PPid like '%-No'
    group by gene, caseId, accession, phosphorylationSite, phosphopeptide
) as new
on duplicate key update 
    normalPhosphoproteinLogRatio = new.normalPhosphoproteinLogRatio,
    accession = new.accession,
    phosphorylationSite = new.phosphorylationSite,
    phosphopeptide = new.phosphopeptide;

insert into uterinecptac3(gene, caseId, tumorPhosphoproteinLogRatio)
select * from (
    select
        PPgene as gene,
        regexp_replace(PPid, '-Tu$', '') as caseId,
        avg(PPvalue) as tumorPhosphoproteinLogRatio
    from uterinecptac3phosphodata where PPid like '%-Tu'
    group by gene, caseId
) as new
on duplicate key update tumorPhosphoproteinLogRatio = new.tumorPhosphoproteinLogRatio;


insert into uterinecptac3(gene, caseId, normalRnaValue)
select * from (
    select
        gene,
        regexp_replace(paid, '-No$', '') as caseId,
        avg(value) as normalRnaValue
    from uterinecptac3RNAdata where paid like '%-No'
    group by gene, caseId
) as new
on duplicate key update normalRnaValue = new.normalRnaValue;

insert into uterinecptac3(gene, caseId, tumorRnaValue)
select * from (
    select 
        gene, 
        regexp_replace(paid, '-Tu$', '') as caseId, 
        avg(value) as tumorRnaValue
    from uterinecptac3RNAdata where paid like '%-Tu'
    group by gene, caseId              
) as new
on duplicate key update tumorRnaValue = new.tumorRnaValue;

