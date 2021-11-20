import { SignUpInputFields } from "../types/SignUpInputFields";

export const validateRegister = (options: SignUpInputFields) => {
  if (options.email.length <= 2)
    return [
      {
        field: "email",
        message: "Your email must be at least 3 characters long",
      },
    ];

  if (!options.email.includes("@"))
    return [
      {
        field: "email",
        message: "You must enter a valid email",
      },
    ];

  if (options.password.length <= 5)
    return [
      {
        field: "password",
        message: "Your password must be at least 6 characters long",
      },
    ];

  if (options.name.length <= 0)
    return [
      {
        field: "name",
        message: "You must include your name",
      },
    ];

  return [];
};
