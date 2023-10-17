import { randomUUID } from 'crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../preHandlers/check-session-id-exists'

type MealParams = {
  mealId?: string
}
type MealBody = {
  name: string
  description: string
  on_diet: boolean
}

const validateMealsParamsData = (params: MealParams) => {
  const schema = z.object({
    mealId: z.string().uuid(),
  })

  const schemaParsed = schema.safeParse(params)

  const { success } = schemaParsed
  if (!success) {
    return
  }

  return schemaParsed.data.mealId
}

const validateMealsBodyData = (body: MealBody) => {
  const getMealsBodyData = z.object({
    name: z.string(),
    description: z.string(),
    on_diet: z.boolean(),
  })
  return getMealsBodyData.parse(body)
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

export const mealsRoutes = async (app: FastifyInstance) => {
  app.post<{ Body: MealBody }>(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, replay) => {
      const { description, on_diet, name } = validateMealsBodyData(req.body)
      const { sessionId } = req.cookies

      const user = await getUserBySessionId(sessionId ?? '', replay)

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        on_diet,
        user_id: user.id,
      })
      return replay.status(201).send()
    },
  )

  app.put<{ Params: MealParams; Body: MealBody }>(
    '/:mealId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const mealId = validateMealsParamsData(req.params)

      const { sessionId } = req.cookies
      const body = validateMealsBodyData(req.body)

      const user = await getUserBySessionId(sessionId ?? '', replay)

      const meal = await knex('meals')
        .where({ user_id: user.id, id: mealId })
        .select()

      if (!meal) return replay.status(404).send()

      const updatedMeal = {
        ...meal[0],
        ...body,
        updated_at: String(new Date()),
      }

      await knex('meals')
        .where({ user_id: user.id, id: mealId })
        .update(updatedMeal)

      return replay.status(200).send({
        message: 'Meal updated successfully',
      })
    },
  )

  app.get<{ Params: MealParams }>(
    '/:userId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const { sessionId } = req.cookies
      const userId = validateMealsParamsData(req.params)
      const user = await getUserBySessionId(sessionId ?? '', replay)

      if (userId && user) {
        const meal = await knex('meals').where('user_id', userId).select()
        return {
          meal,
        }
      }

      if (!user) {
        return replay.status(303).send({
          message: 'user has not meals stored',
        })
      }

      const userMeals = await knex('meals').where('user_id', user.id).select()

      return {
        userMeals,
      }
    },
  )

  app.delete<{ Params: MealParams }>(
    '/:mealId',
    { preHandler: checkSessionIdExists },
    async (req, replay) => {
      const mealId = validateMealsParamsData(req.params)
      const { sessionId } = req.cookies
      await getUserBySessionId(sessionId ?? '', replay)

      await knex('meals').delete().where('id', mealId)

      return replay.status(204).send()
    },
  )
}
