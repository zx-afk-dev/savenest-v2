import type { NextApiRequest, NextApiResponse } from 'next';
import type { GlobalStatsApiResponse } from '@/types';
import { getGlobalStats } from '@/lib/store/globalQuota';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GlobalStatsApiResponse | { success: false; message: string }>,
) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const stats = await getGlobalStats();
    res.status(200).json({ success: true, data: stats });
  } catch {
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik.' });
  }
}
