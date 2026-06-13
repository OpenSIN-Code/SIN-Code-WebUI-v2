// SPDX-License-Identifier: MIT

import { NextResponse } from "next/server"
import { promisify } from "util"
import { execFile } from "child_process"

const execFileAsync = promisify(execFile)
let _root: string | null = null
// @turbopack-disable-next-line
function root(): string {
  if (!_root) _root = process.env.SIN_WORKSPACE_DIR ?? (/*turbopackIgnore: true*/ process.cwd())
  return _root
}

export async function GET() {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "--pretty=format:%H|%cI|%s", "-n", "50"],
      { cwd: root() },
    )
    const versions = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line, i, arr) => {
        const [id, createdAt, subject] = line.split("|")
        return {
          id,
          label: `Version ${arr.length - i}`,
          createdAt,
          subject: subject ?? "",
        }
      })
    return NextResponse.json({ versions })
  } catch {
    return NextResponse.json({ versions: [] })
  }
}
