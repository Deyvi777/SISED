/* eslint-disable @typescript-eslint/no-require-imports */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public/NOMINA.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('--- ANALISIS DE NOMINA.xlsx ---');
console.log('Nombre de la hoja:', sheetName);
console.log('Total de registros:', data.length);
console.log('Columnas encontradas:', Object.keys(data[0] || {}));
console.log('Primeros 5 registros:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));
