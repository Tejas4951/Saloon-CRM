import { isSupabaseConfigured, supabase } from '@/lib/supabase';

let cachedShopId: number | null = null;

export const createId = () => crypto.randomUUID();

export const isUuid = (value?: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

export async function getActiveShopId(): Promise<number> {
  if (cachedShopId) return cachedShopId;
  if (!isSupabaseConfigured || !supabase) return 1;

  try {
    const { data, error } = await supabase
      .from('shops')
      .select('id')
      .eq('is_available', true)
      .order('id')
      .limit(1)
      .single();

    if (error || !data) return 1;
    cachedShopId = Number(data.id);
    return cachedShopId;
  } catch (err) {
    return 1;
  }
}

export function toDatabaseTime(value: string): string {
  const trimmed = value.trim();
  const twelveHour = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!twelveHour) return trimmed.length === 5 ? `${trimmed}:00` : trimmed;

  let hour = Number(twelveHour[1]);
  const minute = twelveHour[2];
  const period = twelveHour[3].toUpperCase();
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
}

export function toDisplayTime(value?: string | null): string {
  if (!value) return '';
  const [hourText, minute = '00'] = value.split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) return value;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${minute} ${period}`;
}

export function reportPersistenceError(area: string, error: unknown) {
  const details = error && typeof error === 'object'
    ? JSON.stringify(error, Object.getOwnPropertyNames(error))
    : String(error);
  console.error(`[Supabase:${area}] ${details}`);
}
