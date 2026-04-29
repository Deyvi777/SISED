const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('🚀 Iniciando configuración de la base de datos...');

// 1. Crear archivo .env si no existe
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env creado.');
  } else {
    console.log('⚠️ No se encontró .env.example. Creando .env por defecto...');
    fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\n');
    console.log('✅ Archivo .env creado con valores por defecto.');
  }
} else {
  console.log('ℹ️ El archivo .env ya existe.');
}

// 2. Crear base de datos y generar cliente Prisma
try {
  console.log('📦 Creando base de datos vacía y aplicando esquema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Base de datos creada y esquema aplicado.');

  console.log('⚙️ Generando Cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma generado correctamente.');
  
  console.log('\n🎉 ¡Configuración completada con éxito!');
} catch (error) {
  console.error('❌ Error durante la configuración:', error.message);
  process.exit(1);
}
