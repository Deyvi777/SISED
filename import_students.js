/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const path = require('path');

const adapter = new PrismaBetterSqlite3({ url: 'file:dev.db' });
const prisma = new PrismaClient({ adapter });

function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date;
}

async function importData() {
    const filePath = path.join(__dirname, 'public/NOMINA.xlsx');
    const workbook = XLSX.readFile(filePath);
    let totalImported = 0;

    console.log('Iniciando importación...');

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Procesando hoja ${sheetName}: ${data.length} registros.`);

        for (const row of data) {
            try {
                // Mapeo de datos
                const studentData = {
                    listNumber: row.No ? Number(row.No) : null,
                    studentId: String(row.Rude || ''),
                    fullName: String(row.Nombre || ''),
                    ci: row.CI ? String(row.CI) : null,
                    gender: row.Género || null,
                    course: row.Curso || sheetName,
                    birthDate: excelDateToJSDate(row['F. Nac']),
                };

                if (!studentData.studentId || studentData.studentId === 'undefined' || studentData.studentId === '') {
                    console.log(`Saltando registro sin Rude: ${studentData.fullName}`);
                    continue;
                }

                console.log(`Importando: ${studentData.fullName} (${studentData.studentId})`);

                // Upsert para evitar duplicados por Rude (studentId)
                await prisma.student.upsert({
                    where: { studentId: studentData.studentId },
                    update: studentData,
                    create: studentData,
                });
                totalImported++;
            } catch (error) {
                console.error(`Error importando a ${row.Nombre}:`, error);
            }
        }
    }

    console.log(`--- IMPORTACIÓN FINALIZADA ---`);
    console.log(`Total de registros procesados con éxito: ${totalImported}`);
}

importData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
