import { NextResponse } from "next/server";
import mqtt from "mqtt";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeviceStatus = {
  online: boolean;
  baterai: number;
  mode: number | null;
  tema: string;
  firmware: string;
};

const defaultStatus: DeviceStatus = {
  online: false,
  baterai: 0,
  mode: null,
  tema: "-",
  firmware: "-"
};

function getMqttConfig() {
  const host = process.env.MQTT_HOST;
  const port = Number(process.env.MQTT_PORT || 8883);
  const username = process.env.MQTT_USER;
  const password = process.env.MQTT_PASS;
  const topic = process.env.MQTT_TOPIC_STATUS || "lovebox/status";

  if (!host || !username || !password) {
    throw new Error("Environment MQTT belum lengkap.");
  }

  return { host, port, username, password, topic };
}

export async function GET() {
  const user = getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Kamu belum login." },
      { status: 401 }
    );
  }

  try {
    const { host, port, username, password, topic } = getMqttConfig();

    const statusData = await new Promise<DeviceStatus>((resolve, reject) => {
      const client = mqtt.connect(`mqtts://${host}:${port}`, {
        username,
        password,
        reconnectPeriod: 0,
        connectTimeout: 4000,
        clean: true
      });

      const timer = setTimeout(() => {
        client.end(true);
        // Timeout means we resolve with fallback values (and online: false)
        resolve(defaultStatus);
      }, 5000);

      client.on("connect", () => {
        client.subscribe(topic, { qos: 1 }, (err) => {
          if (err) {
            clearTimeout(timer);
            client.end(true);
            reject(err);
          }
        });
      });

      client.on("message", (t, message) => {
        if (t === topic) {
          clearTimeout(timer);
          client.end(true);
          try {
            const parsed = JSON.parse(message.toString());
            
            // Build verified response with graceful fallbacks
            const verifiedStatus: DeviceStatus = {
              online: typeof parsed.online === "boolean" ? parsed.online : defaultStatus.online,
              baterai: typeof parsed.baterai === "number" ? parsed.baterai : defaultStatus.baterai,
              mode: typeof parsed.mode === "number" ? parsed.mode : defaultStatus.mode,
              tema: typeof parsed.tema === "string" ? parsed.tema : defaultStatus.tema,
              firmware: typeof parsed.firmware === "string" ? parsed.firmware : defaultStatus.firmware
            };
            
            resolve(verifiedStatus);
          } catch {
            // Malformed JSON falls back safely
            resolve(defaultStatus);
          }
        }
      });

      client.on("error", (error) => {
        clearTimeout(timer);
        client.end(true);
        reject(error);
      });
    });

    return NextResponse.json(statusData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil status.";
    console.error("MQTT Status Fetch Error:", message);
    
    // In case of connect errors or general failure, return default status
    return NextResponse.json(defaultStatus);
  }
}
