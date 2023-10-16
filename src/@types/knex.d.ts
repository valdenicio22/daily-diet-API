// eslint-disable-next-line
import knex from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      username: string
      session_id?: string
    }
    snacks: {
      id: string
      description?: string
      isOnTheDiet: boolean
      created_at: string
      updated_at: string
      session_id?: string
    }
  }
}
