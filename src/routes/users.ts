import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../preHandlers/check-session-id-exists'

export const usersRoutes = async (app: FastifyInstance) => {
  app.get('/', async (req) => {
    const { sessionId } = req.cookies

    if (!sessionId) {
      const allUsers = await knex('users').select()
      return {
        allUsers,
      }
    }
    const users = await knex('users').where('session_id', sessionId).select()

    return {
      users,
    }
  })
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      username: z.string(),
    })

    const { username } = createUserBodySchema.parse(request.body)

    let user = await knex('users')
      .where({
        username,
      })
      .first()

    if (!user) {
      const result = await knex('users')
        .insert({
          id: randomUUID(),
          username,
          session_id: randomUUID(),
        })
        .returning('*')
      user = result[0]
    }

    reply.cookie('sessionId', user.session_id as string)

    reply.status(201).send({
      status: 'success',
      data: user.username,
    })
  })
  app.get(
    '/summary/:userId',
    { preHandler: [checkSessionIdExists] },
    async (req, replay) => {
      const { sessionId } = req.cookies
      const user = await knex('users').where('session_id', sessionId).select()
      const meals = await knex('meals').where('user_id', user[0].id).select()

      let auxSequence = 0
      const summary = meals.reduce(
        (acc, meal) => {
          if (meal.on_diet) {
            acc.onDiet++
            auxSequence++
          } else {
            auxSequence = 0
            acc.offDiet++
          }
          acc.bestSequence =
            auxSequence > acc.bestSequence ? auxSequence : acc.bestSequence
          return acc
        },
        {
          totalMeals: meals.length,
          onDiet: 0,
          offDiet: 0,
          bestSequence: 0,
        },
      )

      replay.status(200).send(summary)
    },
  )
}
