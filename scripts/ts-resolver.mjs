// Lets Node resolve extensionless relative imports to .ts files, so lib/*.ts can be tested without a build step.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err && err.code === "ERR_MODULE_NOT_FOUND" && (specifier.startsWith("./") || specifier.startsWith("../"))) {
      return nextResolve(specifier + ".ts", context);
    }
    throw err;
  }
}
