// eslint-disable-next-line
import knex from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      username: string
      session_id: string
    }
    snacks: {
      id: string
      description: string
      on_diet: boolean
      created_at: string
      updated_at: string
      user_id: string
    }
  }
}
