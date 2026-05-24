const DOMAIN = "@eduglyph.app";

export const usernameToEmail = (username) => {
  const sanitized = username
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
  return sanitized + DOMAIN;
};

export const emailToUsername = (email) => {
  return email.replace(DOMAIN, "");
};
