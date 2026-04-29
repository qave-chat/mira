import { Config, Redacted } from "effect";

const DbDirectUrl = Config.redacted("DB_URL").pipe(
  Config.orElse(() => Config.redacted("DATABASE_URL")),
);

const DbPartsUrl = Config.all({
  host: Config.string("DB_HOST"),
  port: Config.int("DB_PORT").pipe(Config.withDefault(5432)),
  name: Config.string("DB_NAME"),
  username: Config.string("DB_USERNAME"),
  password: Config.redacted("DB_PASSWORD"),
}).pipe(
  Config.map((parts) => {
    const pwd = encodeURIComponent(Redacted.value(parts.password));
    const user = encodeURIComponent(parts.username);
    return Redacted.make(`postgres://${user}:${pwd}@${parts.host}:${parts.port}/${parts.name}`);
  }),
);

export const DbUrl = DbDirectUrl.pipe(Config.orElse(() => DbPartsUrl));

export const DbUrlOptional = Config.option(DbUrl);

export const DbSsl = Config.boolean("DB_SSL").pipe(Config.withDefault(false));

export const DbPgSsl = DbSsl.pipe(Config.map((on) => (on ? { rejectUnauthorized: false } : false)));
