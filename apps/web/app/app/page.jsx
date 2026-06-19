import AppShell from "../../components/AppShell";

export default async function AppPage({ searchParams }) {
  const params = await searchParams;
  const initialAuthMode = params?.mode === "register" ? "register" : "login";

  return <AppShell initialAuthMode={initialAuthMode} />;
}
