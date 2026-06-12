/**
 * Babel plugin: adds data-sin-loc="relative/file.tsx:line" to every
 * lowercase JSX element in development builds.
 *
 * Usage in the target project's .babelrc.js (dev only):
 *   module.exports = {
 *     presets: ["next/babel"],
 *     plugins: process.env.NODE_ENV === "development"
 *       ? ["./lib/jsx-loc-plugin.mjs"]
 *       : [],
 *   }
 */
import path from "path"

export default function jsxLocPlugin({ types: t }: { types: any }) {
  return {
    name: "jsx-source-loc",
    visitor: {
      JSXOpeningElement(nodePath: any, state: any) {
        const name = nodePath.node.name
        if (!t.isJSXIdentifier(name) || !/^[a-z]/.test(name.name)) return
        const exists = nodePath.node.attributes.some(
          (a: any) => t.isJSXAttribute(a) && a.name.name === "data-sin-loc",
        )
        if (exists) return

        const loc = nodePath.node.loc
        const file = state.file.opts.filename
        if (!loc || !file) return

        const rel = path.relative(state.cwd ?? process.cwd(), file)
        nodePath.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-sin-loc"),
            t.stringLiteral(`${rel}:${loc.start.line}`),
          ),
        )
      },
    },
  }
}
