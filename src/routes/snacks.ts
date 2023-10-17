import { randomUUID } from 'crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../preHandlers/check-session-id-exists'

type SnackParams = {
  snackId?: string
}
type SnackBody = {
  description: string
  on_diet: boolean
  user_id?: string
}

const validateSnacksParamsData = (params: SnackParams) => {
  const schema = z.object({
    snackId: z.string().uuid(),
  })

  const schemaParsed = schema.safeParse(params)

  const { success } = schemaParsed
  if (!success) {
    return
  }

  return schemaParsed.data.snackId
}

const validateSnacksBodyData = (body: SnackBody) => {
  const getSnacksBodyData = z.object({
    description: z.string(),
    on_diet: z.boolean(),
  })
  return getSnacksBodyData.parse(body)
}

const getUserBySessionId = async (sessionId: string, replay: FastifyReply) => {
  const user = await knex('users').where('session_id', sessionId).select()
  if (!user) {
    return replay.status(403).send({
      message: 'User not found',
    })
  }
  return user[0]
}

export const snacksRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: SnackBody }>(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, replay) => {
      const { description, on_diet } = validateSnacksBodyData(req.body)
      const { sessionId } = req.cookies

      const user = await getUserBySessionId(sessionId ?? '', replay)

      await knex('snacks').insert({
        id: randomUUID(),
        description,
        on_diet,
        user_id: user.id,
      })
      return replay.status(201).send()
    },
  )

  app.put<{ Params: SnackParams; Body: SnackBody }>(
    '/:snackId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const snackId = validateSnacksParamsData(req.params)

      const { sessionId } = req.cookies
      const { description, on_diet } = validateSnacksBodyData(req.body)

      const user = await getUserBySessionId(sessionId ?? '', replay)

      const userSnacks = await knex('snacks').where('user_id', user.id).select()
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
    },
  )

  app.get<{ Params: SnackParams }>(
    '/:userId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const { sessionId } = req.cookies
      const userId = validateSnacksParamsData(req.params)
      const user = await getUserBySessionId(sessionId ?? '', replay)

      if (userId && user) {
        const snack = await knex('snacks').where('user_id', userId).select()
        return {
          snack,
        }
      }

      if (!user) {
        return replay.status(303).send({
          message: 'user has not meals stored',
        })
      }

      const userSnacks = await knex('snacks').where('user_id', user.id).select()

      return {
        userSnacks,
      }
    },
  )

  app.delete<{ Params: SnackParams }>(
    '/:snackId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const snackId = validateSnacksParamsData(req.params)
      const { sessionId } = req.cookies
      await getUserBySessionId(sessionId ?? '', replay)

      await knex('snacks').delete().where('id', snackId)

      return replay.status(204).send()
    },
  )
}
