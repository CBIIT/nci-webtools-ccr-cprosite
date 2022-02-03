# Import Process

1. Create a MySQL database from the dump files provided by our client
2. Run the `export.sql` script against the imported database. If our client has provided additional datasets, modify the `generateExport.js` script and run it to regenerate the `export.sql` script
3. Create a data/ folder
4. Export the following four tables to the data/ folder as csv files: phosphoproteinData.csv, proteinData.csv, rnaData.csv, tcgaRnaData.csv
5. Download the following csv files to the data/ folder: gene.csv, geneAlias.csv, cancer.csv
6. Confirm that `sources.json` contains valid references to files in the data/ folder
7. Run the import.js script to generate the sqlite database (`cprosite.db` if no filename argument is provided)
