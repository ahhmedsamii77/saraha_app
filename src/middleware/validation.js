export function validation(schema) {
  return (req, res, next) => {
    let validationErrors = [];
    for (const key of Object.keys(schema)) {
      const data = schema[key].validate(req[key], { abortEarly: false });
      if (data?.error) {
        validationErrors.push(data?.error?.details);
      }
    }
    if (validationErrors.length) {
      throw new Error("", { cause: 400 }).message = validationErrors;
    }
    return next();
  }
}