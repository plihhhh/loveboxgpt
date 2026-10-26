"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPayload } from "@/lib/auth";
import { useRouter } from "next/navigation";
import FloatingElements from "@/app/components/FloatingElements";
import ScrollReveal from "@/app/components/ScrollReveal";

type DeviceStatus = {
  online: boolean;
  baterai: number;
  mode: number | null;
  tema: string;
  firmware: string;
  jumlahFoto?: number;
  indexFoto?: number;
  ssid?: string;
  ip?: string;
};

type Props = {
  user: AuthPayload;
};

const modes = [
  { id: 1, label: "Jam" },
  { id: 2, label: "Tanggal" },
  { id: 3, label: "Foto" },
  { id: 4, label: "Pesan" }
];

const themes = [
  { id: "pastel_love", label: "Pastel Love" },
  { id: "classic_dark", label: "Classic Dark" },
  { id: "sunset", label: "Sunset" },
  { id: "ocean", label: "Ocean" }
];

export default function DashboardClient({ user }: Props) {
  const router = useRouter();

  const [message, setMessage] = useState("Halo Suci! :)");
  const [messageColor, setMessageColor] = useState("#FF69B4");
  const [messageSize, setMessageSize] = useState(16);
  const [brightness, setBrightness] = useState(80);
  const [theme, setTheme] = useState("pastel_love");
  const [activeModes, setActiveModes] = useState<number[]>([1, 2, 4]);
  const [otaUrl, setOtaUrl] = useState("");
  const [toast, setToast] = useState("");

  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError("");
    setPhotoSuccess("");
    const file = event.target.files?.[0];
    if (!file) {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    // 5 MB limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError("Ukuran file terlalu besar. Maksimal 5 MB.");
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("File harus berupa gambar (image/*).");
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview("");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  }

  function optimizeCloudinaryUrl(url: string) {
    if (!url.includes("/image/upload/")) return url;
    if (url.includes("w_128,h_160")) return url;

    return url.replace(
      "/image/upload/",
      "/image/upload/w_128,h_160,c_fit,f_jpg,q_70/"
    );
  }

  async function uploadCurrentPhoto(): Promise<string> {
    if (!photoFile) {
      throw new Error("Silakan pilih foto terlebih dahulu.");
    }

    const formData = new FormData();
    formData.append("photo", photoFile);

    const uploadRes = await fetch("/api/upload-photo", {
      method: "POST",
      body: formData,
    });

    const uploadResult = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadResult.message || "Gagal mengunggah foto ke Cloudinary.");
    }

    const rawUrl = uploadResult.secure_url || uploadResult.url;
    return optimizeCloudinaryUrl(rawUrl);
  }

  async function handleUploadPhoto() {
    if (photoUrls.length >= 10) {
      setPhotoError("Maksimal 10 foto untuk slideshow.");
      alert("Maksimal 10 foto untuk slideshow.");
      return;
    }

    setUploading(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const optimizedUrl = await uploadCurrentPhoto();

      setPhotoUrls((prev) => {
        const next = [...prev, optimizedUrl];
        return next.slice(0, 10);
      });
      setPhotoSuccess("Foto berhasil diunggah dan ditambahkan ke album!");

      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendSinglePhoto(url: string) {
    setUploading(true);
    setPhotoError("");
    setPhotoSuccess("");

    try {
      const response = await fetch("/api/mqtt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "foto",
          data: { url },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim foto tunggal ke RoboLove.");
      }

      setToast("Foto tunggal berhasil dikirim ke RoboLove.");
      setPhotoSuccess("Foto tunggal berhasil dikirim ke RoboLove!");

      // Automatically add mode 3 (Foto) to active modes
      let nextActiveModes = [...activeModes];
      if (!nextActiveModes.includes(3)) {
        nextActiveModes = [...nextActiveModes, 3].sort((a, b) => a - b);
        setActiveModes(nextActiveModes);
        await sendCommand("mode", nextActiveModes);
      } else {
        setTimeout(() => {
          fetchStatus();
        }, 1000);
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendSlideshow() {
    if (photoUrls.length === 0) {
      setPhotoError("List slideshow masih kosong.");
      return;
    }

    setUploading(true);
    setPhotoError("");
    setPhotoSuccess("");

    const listToSend = photoUrls.slice(0, 10);
    console.log("Mengirim foto_list:", listToSend);

    try {
      const response = await fetch("/api/mqtt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "foto_list",
          data: listToSend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim slideshow foto ke RoboLove.");
      }

      setToast("Slideshow foto berhasil dikirim ke RoboLove.");
      setPhotoSuccess("Slideshow foto berhasil dikirim ke RoboLove!");

      // Automatically add mode 3 (Foto) to active modes
      let nextActiveModes = [...activeModes];
      if (!nextActiveModes.includes(3)) {
        nextActiveModes = [...nextActiveModes, 3].sort((a, b) => a - b);
        setActiveModes(nextActiveModes);
        await sendCommand("mode", nextActiveModes);
      } else {
        setTimeout(() => {
          fetchStatus();
        }, 1000);
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  const isAdmin = user.role === "admin";

  const roleLabel = useMemo(() => {
    return isAdmin ? "Admin" : "User";
  }, [isAdmin]);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const response = await fetch("/api/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Gagal mengambil status:", error);
      setStatus((prev) => prev || {
        online: false,
        baterai: 0,
        mode: null,
        tema: "-",
        firmware: "-"
      });
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function sendCommand(type: string, data: unknown) {
    setToast("");

    const response = await fetch("/api/mqtt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type, data })
    });

    const result = await response.json();

    if (!response.ok) {
      setToast(result.message || "Perintah gagal dikirim.");
      return false;
    }

    setToast("Perintah berhasil dikirim ke RoboLove.");

    // Auto-refresh status after 1 second
    setTimeout(() => {
      fetchStatus();
    }, 1000);

    return true;
  }

  function toggleMode(id: number) {
    setActiveModes((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((mode) => mode !== id);
        return next.length ? next : prev;
      }

      return [...prev, id].sort((a, b) => a - b);
    });
  }

  function getModeLabel(modeId: number | null) {
    if (modeId === null) return "-";
    const modeLabels: Record<number, string> = {
      1: "Jam",
      2: "Tanggal",
      3: "Foto",
      4: "Pesan",
      5: "Cuaca"
    };
    return modeLabels[modeId] || `Mode ${modeId}`;
  }

  function getThemeLabel(themeId: string) {
    if (themeId === "-") return "-";
    const matched = themes.find((t) => t.id === themeId);
    return matched ? matched.label : themeId;
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <main className="dashboard-page">
      {/* Decorative slow floating circles and icons */}
      <FloatingElements />
      <div className="dashboard-bg-one float-slow" />
      <div className="dashboard-bg-two float-medium" />

      <header className="dashboard-header">
        <ScrollReveal delay={60}>
          <div>
            <p className="eyebrow">RoboLove Control Room</p>
            <h1>Dashboard</h1>
            <p>
              Login sebagai <strong>{roleLabel}</strong>. Atur layar kecilnya dari sini.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <button className="ghost-btn" onClick={logout}>Logout</button>
        </ScrollReveal>
      </header>

      {toast && <div className="toast">{toast}</div>}

      <section className="dashboard-grid">
        {/* Card 1: status card */}
        <ScrollReveal delay={120}>
          <article className="control-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Status Alat</span>
                <h2>RoboLove Status</h2>
              </div>
              <div className="card-icon">⚡</div>
            </div>

            <div className="status-container">
              {status === null && loadingStatus ? (
                <div className="status-loading">
                  <span className="refresh-icon spinning">⏳</span> Sedang memuat status...
                </div>
              ) : (
                <>
                  <div className="status-row">
                    <span className="status-label">Koneksi</span>
                    <div className={`status-badge ${status?.online ? "online" : "offline"}`}>
                      <span className={`status-dot ${status?.online ? "online" : "offline"}`} />
                      <span>{status?.online ? "RoboLove Online" : "RoboLove Offline"}</span>
                    </div>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Baterai</span>
                    <span className="status-value battery-container">
                      <span className="battery-icon">
                        <span
                          className="battery-level"
                          style={{ width: `${status?.baterai ?? 0}%` }}
                        />
                      </span>
                      {status?.baterai ?? 0}%
                    </span>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Mode Aktif</span>
                    <span className="status-value">{getModeLabel(status?.mode ?? null)}</span>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Tema Aktif</span>
                    <span className="status-value">{getThemeLabel(status?.tema ?? "-")}</span>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Firmware</span>
                    <span className="status-value code-font">{status?.firmware ?? "-"}</span>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Jumlah Foto</span>
                    <span className="status-value">{status?.jumlahFoto ?? 0} foto</span>
                  </div>

                  <div className="status-row">
                    <span className="status-label">Slide Foto</span>
                    <span className="status-value">{status?.indexFoto ?? 0}</span>
                  </div>
                </>
              )}
            </div>

            <button
              className="ghost-btn refresh-btn"
              onClick={fetchStatus}
              disabled={loadingStatus}
            >
              <span className={`refresh-icon ${loadingStatus ? "spinning" : ""}`}>↻</span>
              Refresh Status
            </button>
          </article>
        </ScrollReveal>

        {/* Card 2: Pesan teks */}
        <ScrollReveal delay={180}>
          <article className="control-card wide-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Pesan layar</span>
                <h2>Kirim pesan ke TFT</h2>
              </div>
              <div className="card-icon">♡</div>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tulis pesan manis di sini..."
              rows={5}
            />

            <div className="inline-controls">
              <label>
                Warna teks
                <input
                  type="color"
                  value={messageColor}
                  onChange={(event) => setMessageColor(event.target.value)}
                />
              </label>

              <label>
                Ukuran
                <input
                  type="range"
                  min="12"
                  max="28"
                  value={messageSize}
                  onChange={(event) => setMessageSize(Number(event.target.value))}
                />
                <span>{messageSize}px</span>
              </label>
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                sendCommand("pesan", {
                  teks: message,
                  warna: messageColor,
                  ukuran: messageSize
                })
              }
            >
              Kirim Pesan
            </button>
          </article>
        </ScrollReveal>

        {/* Card 3: Upload foto */}
        <ScrollReveal delay={240}>
          <article className="control-card upload-photo-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Kirim foto ke layar RoboLove</span>
                <h2>Upload Foto</h2>
              </div>
              <div className="card-icon font-emoji">📸</div>
            </div>

            <div className="upload-container">
              {photoPreview ? (
                <div className="polaroid-preview-wrapper">
                  <div className="polaroid-preview">
                    <div className="polaroid-img-container">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Preview" className="polaroid-img" />
                    </div>
                    <p className="polaroid-caption">{photoFile ? photoFile.name : "foto.jpg"}</p>
                  </div>
                  <button
                    className="ghost-btn remove-photo-btn"
                    onClick={() => {
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoFile(null);
                      setPhotoPreview("");
                      setPhotoError("");
                      setPhotoSuccess("");
                    }}
                    disabled={uploading}
                  >
                    Hapus Foto
                  </button>
                </div>
              ) : (
                <label className="scrapbook-upload-zone">
                  <span className="upload-icon font-emoji">🖼️</span>
                  <span className="upload-text">Pilih foto dari galeri</span>
                  <span className="upload-subtext">JPG/PNG, Maks. 5 MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                </label>
              )}

              {photoError && <div className="error-box mt-3">{photoError}</div>}
              {photoSuccess && <div className="success-box mt-3">{photoSuccess}</div>}

              {/* If a new file is chosen, display upload to slideshow action */}
              {photoFile && (
                <button
                  className="primary-btn full-btn mt-3"
                  onClick={handleUploadPhoto}
                  disabled={uploading || photoUrls.length >= 10}
                >
                  {uploading ? (
                    <>
                      <span className="refresh-icon spinning mr-2">⏳</span>
                      Mengunggah...
                    </>
                  ) : (
                    `Unggah & Tambah ke Album (${photoUrls.length}/10)`
                  )}
                </button>
              )}

              {/* Slideshow Album List (Miniature Scrapbook Polaroids) */}
              <div className="slideshow-list-container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="wifi-info-kicker" style={{ margin: 0 }}>Daftar Slideshow ({photoUrls.length}/10)</span>
                  {photoUrls.length > 0 && (
                    <button
                      className="ghost-btn"
                      style={{ padding: "4px 10px", fontSize: "0.72rem", borderRadius: "10px" }}
                      onClick={() => {
                        setPhotoUrls([]);
                        setPhotoSuccess("Daftar slideshow dikosongkan.");
                      }}
                      disabled={uploading}
                    >
                      Kosongkan Semua
                    </button>
                  )}
                </div>

                {photoUrls.length > 0 ? (
                  <>
                    <div className="slideshow-grid">
                      {photoUrls.map((url, index) => (
                        <div
                          key={index}
                          className="mini-polaroid"
                          style={{ "--rot": `${(index % 3 - 1) * 3}deg` } as React.CSSProperties}
                        >
                          <div className="mini-polaroid-img-container">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Slide ${index + 1}`} className="mini-polaroid-img" />
                          </div>

                          {/* Send Single Photo Command Overlay (Top Left) */}
                          <button
                            className="mini-polaroid-send"
                            onClick={() => handleSendSinglePhoto(url)}
                            disabled={uploading}
                            title="Kirim sebagai foto tunggal langsung ke RoboLove"
                          >
                            ✈
                          </button>

                          {/* Delete Photo Overlay (Top Right) */}
                          <button
                            className="mini-polaroid-delete"
                            onClick={() => setPhotoUrls((prev) => prev.filter((_, idx) => idx !== index))}
                            disabled={uploading}
                            title="Hapus foto dari slideshow"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      className="primary-btn full-btn mt-3"
                      onClick={handleSendSlideshow}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <span className="refresh-icon spinning mr-2">⏳</span>
                          Mengirim Slideshow...
                        </>
                      ) : (
                        `Kirim Slideshow Ke RoboLove (${photoUrls.length} Foto)`
                      )}
                    </button>
                  </>
                ) : (
                  <p className="muted-text" style={{ fontSize: "0.85rem", fontStyle: "italic", margin: "12px 0 0" }}>
                    Belum ada foto slideshow. Pilih foto di atas lalu klik "Unggah & Tambah ke Album".
                  </p>
                )}
              </div>
            </div>
          </article>
        </ScrollReveal>

        {/* Card 4: Brightness */}
        <ScrollReveal delay={300}>
          <article className="control-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Brightness</span>
                <h2>Kecerahan</h2>
              </div>
              <div className="card-icon">☼</div>
            </div>

            <div className="big-number">{brightness}%</div>

            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={(event) => setBrightness(Number(event.target.value))}
            />

            <button
              className="primary-btn"
              onClick={() => sendCommand("brightness", brightness)}
            >
              Terapkan
            </button>
          </article>
        </ScrollReveal>

        {/* Card 5: Tema */}
        <ScrollReveal delay={360}>
          <article className="control-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Tema</span>
                <h2>Ganti suasana</h2>
              </div>
              <div className="card-icon">✦</div>
            </div>

            <div className="theme-list">
              {themes.map((item) => (
                <button
                  key={item.id}
                  className={theme === item.id ? "chip active-chip" : "chip"}
                  onClick={() => setTheme(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              className="primary-btn"
              onClick={() => sendCommand("theme", theme)}
            >
              Kirim Tema
            </button>
          </article>
        </ScrollReveal>

        {/* Card 6: Mode aktif */}
        <ScrollReveal delay={420}>
          <article className="control-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Mode</span>
                <h2>Mode aktif</h2>
              </div>
              <div className="card-icon">◌</div>
            </div>

            <div className="mode-list">
              {modes.map((item) => (
                <label className="check-row" key={item.id}>
                  <input
                    type="checkbox"
                    checked={activeModes.includes(item.id)}
                    onChange={() => toggleMode(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>

            <button
              className="primary-btn"
              onClick={() => sendCommand("mode", activeModes)}
            >
              Simpan Mode
            </button>
          </article>
        </ScrollReveal>

        {/* Card 7: WiFi reset */}
        <ScrollReveal delay={480}>
          <article className="control-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">WiFi</span>
                <h2>Reset koneksi</h2>
              </div>
              <div className="card-icon">⌁</div>
            </div>

            <p className="muted-text">
              Gunakan ini kalau RoboLove mau dipindah ke WiFi lain.
            </p>

            {status?.online && status?.ssid && (
              <div className="wifi-info-box">
                <span className="wifi-info-kicker">WiFi Sekarang</span>
                <div className="wifi-info-details">
                  <div className="wifi-info-row">
                    <span className="wifi-info-label font-emoji">📶 SSID:</span>
                    <span className="wifi-info-value">{status.ssid}</span>
                  </div>
                  {status.ip && (
                    <div className="wifi-info-row">
                      <span className="wifi-info-label font-emoji">🔗 IP:</span>
                      <span className="wifi-info-value code-font">{status.ip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className="danger-btn"
              onClick={() => sendCommand("wifi_reset", true)}
            >
              Reset WiFi ESP32
            </button>
          </article>
        </ScrollReveal>

        {/* Card 8: Admin OTA update */}
        {isAdmin && (
          <ScrollReveal delay={540} className="wide-card">
            <article className="control-card admin-card">
              <div className="card-heading">
                <div>
                  <span className="card-kicker">Admin only</span>
                  <h2>Update Firmware OTA</h2>
                </div>
                <div className="card-icon">⚙</div>
              </div>

              <p className="muted-text">
                Masukkan URL file firmware <code>.bin</code>. Fitur ini hanya tampil
                untuk admin.
              </p>

              <input
                value={otaUrl}
                onChange={(event) => setOtaUrl(event.target.value)}
                placeholder="https://domain.com/firmware.bin"
              />

              <button
                className="danger-btn"
                onClick={() => sendCommand("ota", otaUrl)}
                disabled={!otaUrl.trim()}
              >
                Jalankan OTA
              </button>
            </article>
          </ScrollReveal>
        )}
      </section>
    </main>
  );
}
