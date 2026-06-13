/**
 * Purpose: React client for Better Auth.
 * Docs: client.doc.md
 */
// SPDX-License-Identifier: MIT

'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()
export const { signIn, signUp, signOut, useSession, resetPassword } = authClient
