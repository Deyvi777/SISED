/* eslint-disable @typescript-eslint/no-require-imports */
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'public/NOMINA.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Hojas encontradas:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    // Convertir a JSON para manipular fácilmente
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Limpiar y agregar la columna 'Curso'
    const updatedData = data.map(row => {
        const updatedRow = { ...row };
        delete updatedRow['Ordenado'];
        
        // Agregar el nombre de la hoja como curso
        updatedRow['Curso'] = sheetName;
        
        // Eliminar todas las columnas que empiecen con __EMPTY
        Object.keys(updatedRow).forEach(key => {
            if (key.startsWith('__EMPTY')) {
                delete updatedRow[key];
            }
        });
        
        return updatedRow;
    });

    // Crear una nueva hoja con los datos actualizados
    const newWorksheet = XLSX.utils.json_to_sheet(updatedData);
    
    // Reemplazar la hoja en el workbook
    workbook.Sheets[sheetName] = newWorksheet;
    console.log(`Columnas innecesarias eliminadas de la hoja: ${sheetName}`);
});

// Guardar los cambios
XLSX.writeFile(workbook, filePath);
console.log('Archivo NOMINA.xlsx actualizado correctamente.');
