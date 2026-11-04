export const POSTGRES_URL: string = process.env.DATABASE_URL || "postgres://user:password@localhost:5432/database";
export const ARANGO_URL: string = process.env.ARANGO_URL || "http://localhost:8529";
export const ARANGO_DATABASE: string = process.env.ARANGO_DATABASE || "database";
export const ARANGO_USER: string = process.env.ARANGO_USER || "user";
export const ARANGO_PASSWORD: string = process.env.ARANGO_PASSWORD || "password";