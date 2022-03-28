import { Children } from "react";
import * as XLSX from "xlsx";

export function exportExcelFile(filename, sheets) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, dataSet }) => {
    const { columns, data } = dataSet[0];
    const sheetColumns = columns.map((c) => c.title);
    const sheetData = data.map((row) => row.map((cell) => cell.value));
    const sheetRows = [sheetColumns, ...sheetData];
    const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
    sheet["!cols"] = columns.map(({ width }) => ({ wpx: width.wpx }));

    XLSX.utils.book_append_sheet(workbook, sheet, name);
  });
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function ExcelFile({ filename, element, children }) {
  const sheets = Children.map(children, (child) => child.props);
  return <span onClick={() => exportExcelFile(filename, sheets)}>{element}</span>;
}

export function ExcelSheet({ name, dataSet }) {
  return null;
}
