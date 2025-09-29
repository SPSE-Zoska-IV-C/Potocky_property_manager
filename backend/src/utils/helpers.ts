import crypto from "crypto";

const util = {
  randomString: (size: number) =>
    crypto
      .randomBytes(size)
      .toString("base64url")
      .replace(/[_-]/g, "x")
      .substring(0, size),
  createPasswordHash: (password: string, salt = crypto.randomBytes(16)) =>
    crypto.pbkdf2Sync(password, salt, 999, 31, "sha512").toString("base64url") +
    salt.toString("base64url"),
  verifyPasswordWithHash: (password: string, hash: string) =>
    password &&
    hash &&
    crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(
        util.createPasswordHash(
          password,
          Buffer.from(
            hash.substring(Buffer.alloc(31).toString("base64url").length),
            "base64url"
          )
        )
      )
    ),
};

export default util;
