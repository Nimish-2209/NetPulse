"use client";

import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "../lib/api";

const sampleSites = ["google.com", "github.com", "example.com"];

export default function PublicUptimePage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function checkUptime(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setResult(null);

    try {
      const data = await apiRequest("/public/uptime-check", {
        method: "POST",
        body: { url }
      });

      setResult(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="public-page">
      <header className="public-nav">
        <Link className="public-brand" href="/">
          <span>NetPulse</span>
          <strong>Instant Uptime</strong>
        </Link>
        <nav>
          <Link className="secondary-button public-link" href="/app">
            Log in
          </Link>
          <Link className="primary-button public-link" href="/app?mode=register">
            Sign up
          </Link>
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-copy">
          <p className="eyebrow">Public website check</p>
          <h1>Is your site actually up?</h1>
          <p>
            Drop a URL and NetPulse will give you the short version: online or offline.
            No chart ceremony. No incident paperwork.
          </p>
        </div>

        <section className="public-checker" aria-label="Website uptime checker">
          <form className="public-check-form" onSubmit={checkUptime}>
            <label>
              Website
              <div className="public-input-row">
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="chatgpt.com"
                  required
                />
                <button className="primary-button" disabled={busy} type="submit">
                  {busy ? "Checking" : "Check"}
                </button>
              </div>
            </label>
          </form>

          <div className="sample-row" aria-label="Sample sites">
            {sampleSites.map((site) => (
              <button key={site} type="button" onClick={() => setUrl(site)}>
                {site}
              </button>
            ))}
          </div>

          <div className={`public-result ${result ? `result-${result.status}` : ""}`}>
            {result ? (
              <>
                <span className="result-label">{result.status}</span>
                <strong>{result.verdict}</strong>
                <small>
                  {result.statusCode ? `HTTP ${result.statusCode}` : result.errorMessage}
                  {` in ${result.latencyMs}ms`}
                </small>
              </>
            ) : (
              <>
                <span className="result-label">Ready</span>
                <strong>Enter a website and NetPulse will check if it answers.</strong>
                <small>{message || "Quick online/offline check. No charts, no drama."}</small>
              </>
            )}
          </div>
        </section>

        <aside className="public-signal" aria-label="NetPulse status visual">
          <div className="signal-header">
            <span>Live pulse</span>
            <strong>{result?.status || "standing by"}</strong>
          </div>
          <div className="signal-stack">
            <span className={result?.online ? "active" : ""}></span>
            <span className={result ? "active" : ""}></span>
            <span className={!result || result.online ? "active" : "danger"}></span>
            <span className={result?.online ? "active" : "danger"}></span>
          </div>
          <div className="signal-footer">
            <span>DNS</span>
            <span>HTTP</span>
            <span>Verdict</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
