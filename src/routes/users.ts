import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'

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
}
