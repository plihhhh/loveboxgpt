import { NextResponse } from "next/server";
import mqtt from "mqtt";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type CommandBody = {
  type?: string;
  data?: unknown;
};

const allowedTypes = new Set([
  "mode",
  "pesan",
  "brightness",
  "theme",
  "wifi_reset",
  "ota",
  "foto",
  "foto_list",
]);

function getMqttConfig() {
  const host = process.env.MQTT_HOST;
  const port = Number(process.env.MQTT_PORT || 8883);
  const username = process.env.MQTT_USER;
  const password = process.env.MQTT_PASS;
  const topic = process.env.MQTT_TOPIC_CMD || "lovebox/command";

  if (!host || !username || !password) {
    throw new Error("Environment MQTT belum lengkap.");
  }

  return { host, port, username, password, topic };
}

function publishMqtt(payload: object) {
  const { host, port, username, password, topic } = getMqttConfig();

  return new Promise<void>((resolve, reject) => {
    const client = mqtt.connect(`mqtts://${host}:${port}`, {
      username,
      password,
      reconnectPeriod: 0,
      connectTimeout: 8000,
      clean: true,
    });

    const timer = setTimeout(() => {
      client.end(true);
      reject(new Error("Timeout saat menghubungkan MQTT."));
    }, 10000);

    client.on("connect", () => {
      client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
        clearTimeout(timer);
        client.end(true);

        if (error) reject(error);
        else resolve();
      });
    });

    client.on("error", (error) => {
      clearTimeout(timer);
      client.end(true);
      reject(error);
    });
  });
}

function isCloudinaryUrl(url: string) {
  return url.startsWith("https://res.cloudinary.com/");
}

export async function POST(request: Request) {
  const user = getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Kamu belum login." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as CommandBody | null;

  if (!body?.type || !allowedTypes.has(body.type)) {
    return NextResponse.json(
      { message: "Tipe perintah tidak valid." },
      { status: 400 }
    );
  }

  if (body.type === "ota" && user.role !== "admin") {
    return NextResponse.json(
      { message: "Update firmware hanya boleh dilakukan admin." },
      { status: 403 }
    );
  }

  if (body.type === "brightness") {
    const value = Number(body.data);

    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return NextResponse.json(
        { message: "Brightness harus 0 sampai 100." },
        { status: 400 }
      );
    }
  }

  if (body.type === "mode") {
    if (!Array.isArray(body.data) || body.data.length === 0) {
      return NextResponse.json(
        { message: "Minimal satu mode harus aktif." },
        { status: 400 }
      );
    }
  }

  if (body.type === "ota") {
    const url = String(body.data || "");

    if (!url.startsWith("http")) {
      return NextResponse.json(
        { message: "URL firmware harus valid." },
        { status: 400 }
      );
    }
  }

  let mqttType = body.type;
  let mqttData = body.data;

  // Foto tunggal
  if (body.type === "foto") {
    let fotoUrl = "";
    const data = body.data;

    if (typeof data === "string") {
      fotoUrl = data;
    } else if (data && typeof data === "object" && "url" in data) {
      fotoUrl = String((data as { url?: unknown }).url || "");
    }

    if (!fotoUrl || !isCloudinaryUrl(fotoUrl)) {
      return NextResponse.json(
        { message: "URL foto tidak valid (harus dari Cloudinary)." },
        { status: 400 }
      );
    }

    mqttData = { url: fotoUrl };
  }

  // Foto banyak / slideshow
  if (body.type === "foto_list") {
    if (!Array.isArray(body.data)) {
      return NextResponse.json(
        { message: "Data foto_list harus berupa array URL foto." },
        { status: 400 }
      );
    }

    const fotoUrls = body.data
      .map((item) => String(item || "").trim())
      .filter((url) => url.length > 0)
      .slice(0, 10);

    if (fotoUrls.length === 0) {
      return NextResponse.json(
        { message: "Minimal satu URL foto harus dikirim." },
        { status: 400 }
      );
    }

    const adaUrlTidakValid = fotoUrls.some((url) => !isCloudinaryUrl(url));

    if (adaUrlTidakValid) {
      return NextResponse.json(
        { message: "Semua URL foto harus dari Cloudinary." },
        { status: 400 }
      );
    }

    mqttType = "foto_list";
    mqttData = fotoUrls;
  }

  try {
    await publishMqtt({
      type: mqttType,
      data: mqttData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal mengirim MQTT.";

    return NextResponse.json({ message }, { status: 500 });
  }
}