import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Config, Effect, Layer, Redacted } from "effect";
import { ErrorR2, R2 } from "./r2.contract";

const R2Bucket = Config.string("R2_BUCKET").pipe(
  Config.orElse(() =>
    Config.string("NODE_ENV").pipe(
      Config.withDefault("development"),
      Config.map((nodeEnv) => (nodeEnv === "production" ? "mira-upload" : "dev-mira-upload")),
    ),
  ),
);

const R2Config = Config.all({
  accountId: Config.string("R2_ACCOUNT_ID"),
  accessKeyId: Config.string("R2_ACCESS_KEY_ID"),
  secretAccessKey: Config.redacted("R2_SECRET_ACCESS_KEY"),
  bucket: R2Bucket,
});

const wrapR2 = <A>(operation: () => Promise<A>) =>
  Effect.tryPromise({
    try: operation,
    catch: (cause) =>
      new ErrorR2({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      }),
  });

export const R2Live = Layer.effect(
  R2,
  Effect.gen(function* () {
    const config = yield* R2Config;
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: Redacted.value(config.secretAccessKey),
      },
    });

    return R2.of({
      putObject: (input) =>
        wrapR2(() =>
          client.send(
            new PutObjectCommand({
              Bucket: config.bucket,
              Key: input.key,
              Body: input.body,
              ContentType: input.contentType,
            }),
          ),
        ).pipe(Effect.asVoid),
      signGetObject: (input) =>
        wrapR2(() =>
          getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: input.key }), {
            expiresIn: input.expiresInSeconds,
          }),
        ),
      deleteObject: (input) =>
        wrapR2(() =>
          client.send(
            new DeleteObjectCommand({
              Bucket: config.bucket,
              Key: input.key,
            }),
          ),
        ).pipe(Effect.asVoid),
    });
  }),
);
