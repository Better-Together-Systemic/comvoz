import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Upload de foto para o Storage
export async function uploadFoto(file, sessaoId, terapeutaId) {
  const ext = file.name.split('.').pop()
  const path = `${terapeutaId}/${sessaoId}.${ext}`
  const { data, error } = await supabase.storage
    .from('fotos-sessoes')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage
    .from('fotos-sessoes')
    .getPublicUrl(path)
  return urlData.publicUrl
}

// Buscar URL assinada da foto (acesso privado)
export async function getFotoUrl(path) {
  const { data, error } = await supabase.storage
    .from('fotos-sessoes')
    .createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}
