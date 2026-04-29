'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function registerTeacher(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const subject = formData.get('subject') as string

  if (!name || !email || !password) {
    return { success: false, error: 'Nombre, email y contraseña son obligatorios.' }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Intentando crear docente:', { name, email, subject })
    const teacher = await prisma.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subject,
      },
    })
    console.log('Docente creado con éxito:', teacher.id)
    return { success: true, teacherId: teacher.id }
  } catch (error: unknown) {
    const e = error as Error & { code?: string };
    console.error('ERROR DETALLADO EN REGISTRO:', e)
    // Devolvemos el error real para depuración
    return { 
      success: false, 
      error: e.message || 'Error interno del servidor.',
      code: e.code
    }
  }
}

export async function loginTeacher(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    })

    if (!teacher) {
      return { success: false, error: 'Credenciales inválidas.' }
    }

    const isValid = await bcrypt.compare(password, teacher.password)
    if (!isValid) {
      return { success: false, error: 'Credenciales inválidas.' }
    }

    return { success: true, teacher: { id: teacher.id, name: teacher.name } }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Error al intentar iniciar sesión.' }
  }
}

export async function getStudentsByCourse(course: string) {
  try {
    const students = await prisma.student.findMany({
      where: { course },
      orderBy: { listNumber: 'asc' },
      select: {
        listNumber: true,
        fullName: true,
      }
    })
    return students
  } catch (error) {
    console.error('Error fetching students:', error)
    return []
  }
}

export async function getStudentsDetailedByCourse(course: string) {
  try {
    const students = await prisma.student.findMany({
      where: { course },
      orderBy: { listNumber: 'asc' },
    })
    return students
  } catch (error) {
    console.error('Error fetching detailed students:', error)
    return []
  }
}

export async function validateStudentPassword(fullName: string, course: string, passwordDate: string) {
  try {
    const student = await prisma.student.findFirst({
      where: { fullName, course }
    })
    if (!student) return { success: false, error: 'Estudiante no encontrado.' }
    if (!student.birthDate) return { success: false, error: 'El estudiante no tiene una fecha de nacimiento registrada (contraseña no configurada).' }

    const bd = student.birthDate
    const dd = String(bd.getUTCDate()).padStart(2, '0')
    const mm = String(bd.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = bd.getUTCFullYear()
    const expected = `${dd}-${mm}-${yyyy}`
    
    if (passwordDate === expected) {
      return { success: true }
    } else {
      return { success: false, error: 'Contraseña incorrecta. Recuerda que el formato es DD-MM-YYYY.' }
    }
  } catch (err) {
    console.error('Error en validateStudentPassword:', err)
    return { success: false, error: 'Error en el servidor al validar la contraseña.' }
  }
}

export async function getCourses() {
  try {
    const courses = await prisma.student.findMany({
      select: { course: true },
      distinct: ['course'],
    })
    return courses.map(c => c.course as string).sort()
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export async function createEvaluation(data: {
  title: string,
  duration: number,
  teacherId: string,
  courses: string[],
  allowMultipleAttempts: boolean,
  showScoreAtEnd: boolean,
  showCorrectAnswers: boolean,
  shuffleQuestions: boolean,
  questions: { type: string, content: string, options?: string, correctAnswer: string, points: number }[]
}) {
  try {
    const evaluation = await prisma.evaluation.create({
      data: {
        title: data.title,
        duration: data.duration,
        teacherId: data.teacherId,
        courses: {
          create: data.courses.map(course => ({ courseName: course }))
        },
        questions: {
          create: data.questions
        },
        allowMultipleAttempts: data.allowMultipleAttempts,
        showScoreAtEnd: data.showScoreAtEnd,
        showCorrectAnswers: data.showCorrectAnswers,
        shuffleQuestions: data.shuffleQuestions
      }
    })
    return { success: true, evaluationId: evaluation.id }
  } catch (error) {
    console.error('Error creating evaluation:', error)
    return { success: false, error: 'Error al crear la evaluación.' }
  }
}

export async function getEvaluationsByCourse(courseName: string) {
  try {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        courses: {
          some: { courseName }
        }
      },
      include: {
        teacher: {
          select: { name: true, subject: true }
        },
        results: true,
        questions: {
          select: { points: true }
        }
      }
    })

    const evaluationsWithTotal = evaluations.map(ev => ({
      ...ev,
      totalPossible: ev.questions.reduce((sum, q) => sum + (q.points || 0), 0)
    }))

    return evaluationsWithTotal
  } catch (error) {
    console.error('Error fetching evaluations:', error)
    return []
  }
}

export async function getTeacherStats(teacherId: string) {
  try {
    const evaluationsCount = await prisma.evaluation.count({
      where: { teacherId }
    })
    
    // Simplificado por ahora
    const studentsCount = await prisma.studentResult.count({
      where: { 
        evaluation: { teacherId }
      }
    })

    return {
      evaluationsCount,
      completedEvals: studentsCount,
      activeCourses: await prisma.evaluationCourse.count({
        where: { evaluation: { teacherId } }
      })
    }
  } catch {
    return { evaluationsCount: 0, completedEvals: 0, activeCourses: 0 }
  }
}

export async function getTeacherEvaluations(teacherId: string) {
  try {
    const evaluations = await prisma.evaluation.findMany({
      where: { teacherId },
      include: {
        courses: true,
        questions: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return evaluations
  } catch (error) {
    console.error('Error fetching teacher evaluations:', error)
    return []
  }
}

export async function getEvaluationById(id: string) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        courses: true,
        questions: true
      }
    })
    return evaluation
  } catch {
    return null
  }
}

export async function updateEvaluation(id: string, data: {
  title: string,
  duration: number,
  courses: string[],
  allowMultipleAttempts: boolean,
  showScoreAtEnd: boolean,
  showCorrectAnswers: boolean,
  shuffleQuestions: boolean,
  questions: { id?: string, type: string, content: string, options?: string, correctAnswer: string, points: number }[]
}) {
  try {
    await prisma.$transaction(async (tx) => {
      // Primero eliminamos cursos y preguntas anteriores
      await tx.evaluationCourse.deleteMany({ where: { evaluationId: id } })
      await tx.question.deleteMany({ where: { evaluationId: id } })

      // Actualizamos la evaluación y creamos los nuevos registros
      await tx.evaluation.update({
        where: { id },
        data: {
          title: data.title,
          duration: data.duration,
          allowMultipleAttempts: data.allowMultipleAttempts,
          showScoreAtEnd: data.showScoreAtEnd,
          showCorrectAnswers: data.showCorrectAnswers,
          shuffleQuestions: data.shuffleQuestions,
          courses: {
            create: data.courses.map(course => ({ courseName: course }))
          },
          questions: {
            create: data.questions.map(q => ({
              type: q.type,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              points: q.points
            }))
          }
        }
      })
    })
    
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating evaluation:', error)
    return { success: false, error: (error as Error).message || 'Error al actualizar la evaluación.' }
  }
}
export async function submitStudentEvaluation(
  evaluationId: string, 
  studentName: string, 
  answers: { questionId: string, answer: string }[],
  courseName?: string,
  listNumber?: number
) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { questions: true }
    })

    if (!evaluation) return { success: false, error: 'Evaluación no encontrada.' }

    let score = 0
    const questionsWithFeedback = evaluation.questions.map(q => {
      const studentAnswer = answers.find(a => a.questionId === q.id)?.answer
      const isCorrect = studentAnswer === q.correctAnswer
      if (isCorrect) score += q.points
      
      return {
        id: q.id,
        content: q.content,
        studentAnswer,
        correctAnswer: evaluation.showCorrectAnswers ? q.correctAnswer : null,
        isCorrect,
        points: q.points
      }
    })

    await prisma.studentResult.create({
      data: {
        evaluationId,
        studentName,
        studentId: null, // Campo opcional pero aseguramos nulo para evitar errores de validación
        courseName,
        listNumber,
        score: score
      }
    })

    return { 
      success: true, 
      score, 
      totalPossible: evaluation.questions.reduce((acc, q) => acc + q.points, 0),
      showScoreAtEnd: evaluation.showScoreAtEnd,
      showCorrectAnswers: evaluation.showCorrectAnswers,
      feedback: questionsWithFeedback
    }
  } catch (error) {
    console.error('Error submitting evaluation:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al enviar la evaluación.' }
  }
}

export async function getTeacherResults(teacherId: string) {
  try {
    const results = await prisma.studentResult.findMany({
      where: {
        evaluation: {
          teacherId: teacherId
        }
      },
      include: {
        evaluation: {
          include: {
            courses: true,
            questions: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })
    
    // Calcular el puntaje total posible para cada evaluación
    const resultsWithTotal = results.map(res => {
      const totalPossible = res.evaluation.questions.reduce((acc, q) => acc + q.points, 0)
      return {
        id: res.id,
        studentName: res.studentName,
        courseName: res.courseName,
        listNumber: res.listNumber,
        score: res.score,
        completedAt: res.completedAt,
        totalPossible,
        evaluation: {
          id: res.evaluation.id,
          title: res.evaluation.title
        }
      }
    })

    return resultsWithTotal
  } catch (error) {
    console.error('Error fetching teacher results:', error)
    return []
  }
}

export async function deleteStudentResult(id: string) {
  try {
    await prisma.studentResult.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting student result:', error)
    return { success: false, error: 'Error al eliminar el resultado.' }
  }
}

export async function getGameConfigs(gameId: string) {
  try {
    const configs = await prisma.gameConfig.findMany({
      where: { gameId }
    })
    return configs
  } catch (error) {
    console.error('Error fetching game configs:', error)
    return []
  }
}

export async function saveGameConfig(gameId: string, courseName: string, maxAttempts: number, isActive: boolean) {
  try {
    const existing = await prisma.gameConfig.findFirst({
      where: { gameId, courseName }
    })

    if (existing) {
      await prisma.gameConfig.update({
        where: { id: existing.id },
        data: { maxAttempts, isActive }
      })
    } else {
      await prisma.gameConfig.create({
        data: { gameId, courseName, maxAttempts, isActive }
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Error saving game config:', error)
    return { success: false, error: 'Error al guardar la configuración del juego.' }
  }
}

export async function saveAllGameConfigs(gameId: string, configs: { courseName: string, maxAttempts: number, isActive: boolean, maxPoints: number }[]) {
  try {
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE GameConfig ADD COLUMN maxPoints INTEGER DEFAULT 45')
    } catch (e) {
      // Ignorar si la columna ya existe
    }

    for (const conf of configs) {
      const existing = await prisma.gameConfig.findFirst({
        where: { gameId, courseName: conf.courseName }
      })

      if (existing) {
        await prisma.$executeRaw`UPDATE GameConfig SET maxAttempts = ${conf.maxAttempts}, isActive = ${conf.isActive ? 1 : 0}, maxPoints = ${conf.maxPoints}, updatedAt = CURRENT_TIMESTAMP WHERE id = ${existing.id}`
      } else {
        const newId = crypto.randomUUID()
        await prisma.$executeRaw`INSERT INTO GameConfig (id, gameId, courseName, maxAttempts, isActive, maxPoints, createdAt, updatedAt) VALUES (${newId}, ${gameId}, ${conf.courseName}, ${conf.maxAttempts}, ${conf.isActive ? 1 : 0}, ${conf.maxPoints}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      }
    }
    return { success: true }
  } catch (error) {
    console.error('Error saving all game configs:', error)
    return { success: false, error: 'Error al guardar las configuraciones: ' + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function getGameScoreForStudent(gameId: string, studentName: string, courseName: string) {
  try {
    const score = await prisma.gameScore.findFirst({
      where: { gameId, studentName, courseName }
    })
    return score
  } catch (error) {
    console.error('Error fetching game score:', error)
    return null
  }
}

export async function saveGameScore(gameId: string, studentName: string, courseName: string, score: number, levelReached: number) {
  try {
    const existing = await prisma.gameScore.findFirst({
      where: { gameId, studentName, courseName }
    })

    if (existing) {
      await prisma.gameScore.update({
        where: { id: existing.id },
        data: {
          score: Math.max(existing.score, score),
          levelReached: Math.max(existing.levelReached, levelReached),
          attemptsUsed: existing.attemptsUsed + 1,
          completedAt: new Date()
        }
      })
    } else {
      await prisma.gameScore.create({
        data: {
          gameId,
          studentName,
          courseName,
          score,
          levelReached,
          attemptsUsed: 1
        }
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Error saving game score:', error)
    return { success: false, error: 'Error al registrar puntaje del juego.' }
  }
}

export async function getAllGameScores(gameId: string) {
  try {
    const scores = await prisma.gameScore.findMany({
      where: { gameId },
      orderBy: { score: 'desc' }
    })

    const enrichedScores = await Promise.all(
      scores.map(async (score) => {
        const student = await prisma.student.findFirst({
          where: {
            fullName: score.studentName,
            course: score.courseName
          }
        })
        return {
          ...score,
          listNumber: student?.listNumber || null
        }
      })
    )
    return enrichedScores
  } catch (error) {
    console.error('Error fetching game scores:', error)
    return []
  }
}export async function resetGameScore(gameId: string, studentName: string, courseName: string) {
  try {
    await prisma.gameScore.deleteMany({
      where: { gameId, studentName, courseName }
    })
    return { success: true }
  } catch (error) {
    console.error('Error resetting game score:', error)
    return { success: false, error: 'Error al reiniciar la puntuación.' }
  }
}
