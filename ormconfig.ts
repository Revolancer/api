import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export = {
  type: 'postgres',
  host: process.env.DB_POSTGRES_HOST ?? 'db',
  port: process.env.DB_POSTGRES_PORT ?? 5432,
  username: process.env.DB_POSTGRES_USER ?? 'postgres',
  password: process.env.DB_POSTGRES_PASS ?? 'postgres',
  db: process.env.DB_POSTGRES_DB ?? 'postgres',
  entities: [
    /*...*/
  ],
  migrations: [
    /*...*/
  ],
  migrationsTableName: 'orm_migrations',
} as PostgresConnectionOptions;
