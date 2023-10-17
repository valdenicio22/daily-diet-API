import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export const snacksRoutes = async (app: FastifyInstance) => {
  app.post('/', async (req, replay) => {
    const getSnacksBodyData = z.object({
      description: z.string(),
      on_diet: z.boolean(),
    })
    const getSnacksUserSession = z.object({
      sessionId: z.string(),
    })
    const { description, on_diet } = getSnacksBodyData.parse(req.body)
    const { sessionId } = getSnacksUserSession.parse(req.cookies)

    const user = await knex('users').where('session_id', sessionId).select()

    if (!user.length) {
      return replay.status(404).send({
        message: 'User not found',
      })
    }
    await knex('snacks').insert({
      id: randomUUID(),
      description,
      on_diet,
      user_id: user[0].id,
    })
    return replay.status(201).send()
  })

  app.put('/:id', async (req, replay) => {
    const getSnacksParamsData = z.object({
      id: z.string(),
    })
    const getSnacksUserSession = z.object({
      sessionId: z.string(),
    })
    const getSnacksUserBody = z.object({
      description: z.string(),
      on_diet: z.boolean(),
    })
    const { id: snackId } = getSnacksParamsData.parse(req.params)
    const { sessionId } = getSnacksUserSession.parse(req.cookies)
    const { description, on_diet } = getSnacksUserBody.parse(req.body)

    const user = await knex('users').where('session_id', sessionId).select()

    // validate if there is not user

    const userSnacks = await knex('snacks')
      .where('user_id', user[0].id)
      .select()
    const snack = userSnacks.find((item) => item.id === snackId)
    if (!snack) return replay.status(404).send()

    const updatedSnack = {
      ...snack,
      description,
      on_diet,
      updated_at: String(new Date()),
    }
    await knex('snacks').where('id', snackId).update(updatedSnack)
    return replay.status(200).send({
      message: 'Snack updated successfully',
    })
  })

  app.get('/', async (req, replay) => {
    const { sessionId } = req.cookies
    if (!sessionId) {
      return replay.status(401).send({
        message: 'User not authorized',
      })
    }
    const user = await knex('users').where('session_id', sessionId).select()

    if (!user.length) {
      return replay.status(303).send({
        message: 'user has not meals stored',
      })
    }

    const userSnacks = await knex('snacks')
      .where('user_id', user[0].id)
      .select()

    return {
      userSnacks,
    }
  })
}
