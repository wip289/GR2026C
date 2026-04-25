import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const BUCKET = "gr2026c";

/**
 * Upload file ke Supabase Storage
 * @returns public URL file
 */
export async function uploadToSupabase(
  file: File,
  folder: "jobseeker" | "employer" | "brand",
  fileName: string
): Promise<string> {
  const path = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Upload gagal: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

