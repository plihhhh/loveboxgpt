"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import MouseGlow from "@/app/components/MouseGlow";
import FloatingElements from "@/app/components/FloatingElements";
import ScrollReveal from "@/app/components/ScrollReveal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login gagal.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="login-page">
      {/* Background Interactive Elements */}
      <MouseGlow />
      <FloatingElements />

      {/* Legacy background text/emojis, animated and kept soft */}
      <div className="login-decoration deco-one float-slow">♡</div>
      <div className="login-decoration deco-two float-medium">✦</div>
      <div className="login-decoration deco-three float-sway">✿</div>

      <section className="login-shell">
        <ScrollReveal delay={100} className="login-side">
          <p className="eyebrow">Welcome back</p>
          <h1>Masuk dulu sebelum ngatur RoboLove.</h1>
          <p>
            Halaman ini sengaja dibuat lembut dan nggak polos, biar tetap terasa
            seperti bagian dari hadiahnya, bukan cuma form biasa.
          </p>

          <div className="mini-note">
            <span>Catatan</span>
            <p>
              Admin punya akses update firmware. User tidak ditampilkan fitur OTA.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-header">
              <div className="form-icon">♡</div>
              <h2>Login</h2>
              <p>Masukkan username dan password.</p>
            </div>

            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin / suci"
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </label>

            {error && <p className="error-box">{error}</p>}

            <button className="primary-btn full-btn" disabled={loading}>
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </ScrollReveal>
      </section>
    </main>
  );
}
