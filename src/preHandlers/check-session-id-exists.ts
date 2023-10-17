import { FastifyReply, FastifyRequest } from 'fastify'

export async function checkSessionIdExists(
  req: FastifyRequest,
  replay: FastifyReply,
) {
  const { sessionId } = req.cookies
  if (!sessionId) {
    return replay.status(401).send()
  }
}
