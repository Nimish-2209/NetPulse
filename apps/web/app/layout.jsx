import "../styles/globals.css";

export const metadata = {
  title: "NetPulse",
  description: "Network incident and uptime monitoring dashboard"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
