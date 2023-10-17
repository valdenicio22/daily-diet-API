import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { snacksRoutes } from './routes/snacks'
import { usersRoutes } from './routes/users'

export const app = fastify()

app.register(cookie)
app.register(usersRoutes, {
  prefix: 'users',
})
app.register(snacksRoutes, {
  prefix: 'snacks',
})
