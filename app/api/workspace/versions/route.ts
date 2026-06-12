import { NextResponse } from "next/server"
import { promisify } from "util"
import { execFile } from "child_process"

const execFileAsync = promisify(execFile)
const ROOT = process.env.SIN_WORKSPACE_DIR ?? process.cwd()

export async function GET() {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "--pretty=format:%H|%cI|%s", "-n", "50"],
      { cwd: ROOT },
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
