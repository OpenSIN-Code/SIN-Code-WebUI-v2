import { LoginView } from '@/components/login-view'

export const metadata = { title: 'Sign in — SIN-Code' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <LoginView next={next} />
}
