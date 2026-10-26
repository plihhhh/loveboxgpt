import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary environment variables belum lengkap. Cek CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di .env.local."
    );
  }

  return { cloudName, apiKey, apiSecret };
}

export async function POST(request: Request) {
  try {
    console.log("UPLOAD PHOTO API DIPANGGIL");
    console.log("Cloud name:", process.env.CLOUDINARY_CLOUD_NAME ? "ADA" : "KOSONG");
    console.log("API key:", process.env.CLOUDINARY_API_KEY ? "ADA" : "KOSONG");
    console.log("API secret:", process.env.CLOUDINARY_API_SECRET ? "ADA" : "KOSONG");

    const user = getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Kamu belum login." },
        { status: 401 }
      );
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message: "File foto tidak ditemukan. Field harus bernama photo.",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, message: "File harus berupa gambar." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Ukuran foto maksimal 5 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "robolove",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result || !result.secure_url || !result.public_id) {
            reject(new Error("Upload Cloudinary gagal: result kosong"));
            return;
          }

          const optimizedUrl = result.secure_url.replace(
            "/image/upload/",
            "/image/upload/w_128,h_160,c_fit,f_jpg,q_70/"
          );

          resolve({
            secure_url: optimizedUrl,
            public_id: result.public_id,
          });
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      ok: true,
      url: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    });
  } catch (error) {
    console.error("UPLOAD_PHOTO_ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengunggah foto ke Cloudinary.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}