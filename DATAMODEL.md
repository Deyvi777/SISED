# Modelo de Datos (DATAMODEL.md)

Este documento describe la estructura de la base de datos (SQLite) del sistema SISED gestionada a través de Prisma ORM.


## Entidades Principales

### 1. Teacher (Docente)
Gestiona la información de acceso de los profesores y sirve como propietario de las evaluaciones.
- `id`: Identificador único (UUID).
- `name`: Nombre completo del profesor.
- `email`: Correo electrónico (Único) utilizado para inicio de sesión.
- `password`: Hash de la contraseña.
- `subject`: Asignatura o materia (Opcional).
- `createdAt` y `updatedAt`: Trazabilidad temporal.
- **Relaciones:** Un profesor tiene múltiples evaluaciones (`evaluations`).

### 2. Evaluation (Evaluación/Examen)
Representa una prueba creada por el profesor.
- `id`: Identificador único (UUID).
- `title`: Título o nombre de la evaluación.
- `duration`: Tiempo límite asignado (en minutos).
- `teacherId`: Clave foránea al docente propietario.
- `allowMultipleAttempts`: Determina si se permiten múltiples intentos (Por defecto `false`).
- `showScoreAtEnd`: Determina si el alumno ve su nota al concluir la evaluación (Por defecto `true`).
- `showCorrectAnswers`: Determina si el alumno puede revisar las respuestas correctas al finalizar (Por defecto `false`).
- `shuffleQuestions`: Mezcla aleatoria de preguntas al inicializar el examen (Por defecto `false`).
- `createdAt` y `updatedAt`: Trazabilidad temporal.
- **Relaciones:** 
  - Pertenece a un `Teacher`.
  - Tiene múltiples cursos asignados (`courses` -> `EvaluationCourse`).
  - Tiene múltiples preguntas (`questions` -> `Question`).
  - Acumula múltiples resultados de estudiantes (`results` -> `StudentResult`).

### 3. Question (Pregunta)
Define cada ítem o pregunta que forma parte de una evaluación.
- `id`: Identificador único (UUID).
- `type`: Tipo de pregunta (ej: `'MULTIPLE_CHOICE'`, `'FILL_IN_BLANKS'`, `'OPEN'`).
- `content`: El enunciado o contenido principal de la pregunta.
- `options`: Opciones disponibles separadas por comas (para selección múltiple). Puede ser nulo.
- `correctAnswer`: La respuesta válida con la que se contrastan las entradas del estudiante.
- `points`: El valor numérico (puntaje) que otorga la pregunta (Float, por defecto `1.0`).
- `evaluationId`: Clave foránea a la evaluación (`Evaluation`).

### 4. EvaluationCourse (Curso de Evaluación)
Tabla pivote / relación que asigna una evaluación a un curso específico.
- `id`: Identificador único (UUID).
- `courseName`: Nombre del curso al que va dirigida la evaluación.
- `evaluationId`: Clave foránea a la evaluación (`Evaluation`).

### 5. StudentResult (Resultado del Estudiante)
Almacena la calificación y la constancia de que un estudiante rindió una prueba.
- `id`: Identificador único (UUID).
- `studentId`: Identificador opcional del estudiante (UUID).
- `studentName`: Nombre del estudiante ingresado al momento de dar la prueba.
- `listNumber`: Número de lista del estudiante en su curso (Opcional).
- `courseName`: Nombre del curso al que pertenece el estudiante durante la evaluación (Opcional).
- `score`: Puntaje obtenido (Float).
- `evaluationId`: Clave foránea de la evaluación tomada (`Evaluation`).
- `completedAt`: Fecha y hora de envío de la evaluación.

### 6. Student (Estudiante)
Entidad diseñada para manejar un padrón formal de alumnos.
- `id`: Identificador único (UUID).
- `fullName`: Nombre completo.
- `email`: Correo electrónico (Opcional, Único).
- `studentId`: Matrícula o identificador de la institución (Único).
- `ci`: Cédula de identidad o DNI (Opcional, Único).
- `gender`: Género (Opcional).
- `course`: Curso al que pertenece (Opcional).
- `birthDate`: Fecha de nacimiento (Opcional).
- `listNumber`: Número de lista en su curso correspondiente (Opcional).
- `isActive`: Estado del estudiante (Por defecto `true`).
- `createdAt` y `updatedAt`: Trazabilidad temporal.

### 7. GameConfig (Configuración de Juego)
Gestiona la disponibilidad y parámetros de los juegos educativos por curso.
- `id`: Identificador único (UUID).
- `gameId`: Identificador del juego (ej: `'hardware_classification'`).
- `courseName`: Nombre del curso al que aplica la configuración.
- `maxAttempts`: Intentos máximos permitidos (Por defecto `3`).
- `isActive`: Estado de activación del juego para el curso (Por defecto `true`).
- `maxPoints`: Puntaje máximo configurable para el juego (Por defecto `45`).
- `createdAt` y `updatedAt`: Trazabilidad temporal.
- **Restricción:** Combinación única de `gameId` y `courseName`.

### 8. GameScore (Puntaje de Juego)
Almacena el progreso y resultados de los estudiantes en los juegos.
- `id`: Identificador único (UUID).
- `gameId`: Identificador del juego.
- `studentName`: Nombre del estudiante.
- `courseName`: Nombre del curso.
- `score`: Puntaje obtenido (Entero).
- `levelReached`: Nivel o fase máxima alcanzada.
- `attemptsUsed`: Intentos consumidos (Por defecto `1`).
- `completedAt`: Fecha y hora de registro del puntaje.
