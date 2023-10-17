import { FastifyReply, FastifyRequest } from 'fastify'
import { checkSessionIdExists } from './check-session-id-exists'

export async function getUser(req: FastifyRequest, replay: FastifyReply) {
  checkSessionIdExists(req, replay)
}
