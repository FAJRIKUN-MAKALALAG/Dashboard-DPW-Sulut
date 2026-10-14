import { Member } from '../types';
import { SULUT_REGIONS } from '../data/sulutRegions';

export type GrowthPeriod = 'today' | '7days' | '30days' | 'month' | 'all';

export interface DailyGrowthPoint {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "11 Okt"
  dayName: string; // e.g. "Min"
  count: number;
  dpdBreakdown: Record<string, number>;
  recruitersBreakdown: Record<string, number>;
}

export interface RecruiterNode {
  nama: string;
  jabatan: string;
  dpd: string;
  count: number;
  members: Member[];
  territories: { dpd: string; dpc: string; dprt: string; count: number }[];
}

export interface DprtGrowthNode {
  name: string;
  count: number;
  recruiters: { nama: string; jabatan: string; count: number }[];
  members: Member[];
}

export interface DpcGrowthNode {
  name: string;
  count: number;
  recruiters: { nama: string; jabatan: string; count: number }[];
  dprts: DprtGrowthNode[];
}

export interface DpdGrowthNode {
  name: string;
  count: number;
  percentage: number;
  recruiters: { nama: string; jabatan: string; count: number }[];
  dpcs: DpcGrowthNode[];
}

export interface GrowthAnalytics {
  periodLabel: string;
  totalNew: number;
  todayCount: number;
  last7DaysCount: number;
  last30DaysCount: number;
  thisMonthCount: number;
  topDpd: { name: string; count: number } | null;
  topRecruiter: RecruiterNode | null;
  activeRecruitersCount: number;
  recruitersList: RecruiterNode[];
  dailyPoints: DailyGrowthPoint[];
  territorialTree: DpdGrowthNode[];
  filteredMembers: Member[];
}

// Format date to YYYY-MM-DD in local time
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatDisplayDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${MONTH_NAMES[monthIdx] || ''}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export function computeGrowthAnalytics(
  members: Member[],
  period: GrowthPeriod = '30days',
  filterDpd?: string,
  pinnedDate?: string,
  filterRecruiter?: string
): GrowthAnalytics {
  const now = new Date();
  const todayISO = formatDateISO(now);

  const last7DaysDate = new Date(now);
  last7DaysDate.setDate(now.getDate() - 6);
  const last7DaysISO = formatDateISO(last7DaysDate);

  const last30DaysDate = new Date(now);
  last30DaysDate.setDate(now.getDate() - 29);
  const last30DaysISO = formatDateISO(last30DaysDate);

  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter members by period and filters
  let todayCount = 0;
  let last7DaysCount = 0;
  let last30DaysCount = 0;
  let thisMonthCount = 0;

  members.forEach((m) => {
    const d = m.tanggalBergabung || '';
    if (!d) return;

    if (d === todayISO) todayCount++;
    if (d >= last7DaysISO && d <= todayISO) last7DaysCount++;
    if (d >= last30DaysISO && d <= todayISO) last30DaysCount++;
    if (d.startsWith(thisMonthPrefix)) thisMonthCount++;
  });

  const targetMembers = members.filter((m) => {
    if (filterDpd && filterDpd !== 'ALL' && m.dpd !== filterDpd) {
      return false;
    }

    if (filterRecruiter && m.kaderPerekrutNama !== filterRecruiter) {
      return false;
    }

    const d = m.tanggalBergabung || '';
    if (!d) return false;

    // If specific date is pinned
    if (pinnedDate) {
      return d === pinnedDate;
    }

    if (period === 'today') {
      return d === todayISO;
    }
    if (period === '7days') {
      return d >= last7DaysISO && d <= todayISO;
    }
    if (period === '30days') {
      return d >= last30DaysISO && d <= todayISO;
    }
    if (period === 'month') {
      return d.startsWith(thisMonthPrefix);
    }
    // 'all'
    return true;
  });

  // Daily points buckets
  const dailyPointsMap = new Map<string, DailyGrowthPoint>();

  let numDays = 14;
  if (period === '7days') numDays = 7;
  else if (period === 'today') numDays = 1;
  else if (period === '30days') numDays = 30;
  else if (period === 'month') numDays = now.getDate();

  if (period !== 'all') {
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = formatDateISO(d);
      dailyPointsMap.set(iso, {
        date: iso,
        displayDate: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
        dayName: DAY_NAMES[d.getDay()],
        count: 0,
        dpdBreakdown: {},
        recruitersBreakdown: {},
      });
    }
  }

  targetMembers.forEach((m) => {
    const d = m.tanggalBergabung || '';
    if (!d) return;

    if (!dailyPointsMap.has(d)) {
      try {
        const parts = d.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dailyPointsMap.set(d, {
          date: d,
          displayDate: formatDisplayDate(d),
          dayName: DAY_NAMES[dateObj.getDay()] || '',
          count: 0,
          dpdBreakdown: {},
          recruitersBreakdown: {},
        });
      } catch {
        dailyPointsMap.set(d, {
          date: d,
          displayDate: d,
          dayName: '',
          count: 0,
          dpdBreakdown: {},
          recruitersBreakdown: {},
        });
      }
    }

    const point = dailyPointsMap.get(d)!;
    point.count += 1;
    point.dpdBreakdown[m.dpd] = (point.dpdBreakdown[m.dpd] || 0) + 1;
    if (m.kaderPerekrutNama) {
      point.recruitersBreakdown[m.kaderPerekrutNama] =
        (point.recruitersBreakdown[m.kaderPerekrutNama] || 0) + 1;
    }
  });

  const dailyPoints = Array.from(dailyPointsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Build Recruiter Leaderboard Nodes
  const recruiterMap = new Map<string, { jabatan: string; dpd: string; members: Member[] }>();

  targetMembers.forEach((m) => {
    const recName = m.kaderPerekrutNama || 'Kader Pengurus Wilayah';
    const recJabatan = m.kaderPerekrutJabatan || 'Pengurus DPW/DPD NasDem';
    const recDpd = m.kaderPerekrutDpd || m.dpd || 'Sulut';

    if (!recruiterMap.has(recName)) {
      recruiterMap.set(recName, {
        jabatan: recJabatan,
        dpd: recDpd,
        members: [],
      });
    }
    recruiterMap.get(recName)!.members.push(m);
  });

  const recruitersList: RecruiterNode[] = Array.from(recruiterMap.entries())
    .map(([nama, data]) => {
      // Calculate territory breakdown for this recruiter
      const territoryCountMap = new Map<string, number>();
      data.members.forEach((m) => {
        const key = `${m.dpd}__${m.dpc}__${m.dprt}`;
        territoryCountMap.set(key, (territoryCountMap.get(key) || 0) + 1);
      });

      const territories = Array.from(territoryCountMap.entries()).map(([key, count]) => {
        const [dpd, dpc, dprt] = key.split('__');
        return { dpd, dpc, dprt, count };
      }).sort((a, b) => b.count - a.count);

      return {
        nama,
        jabatan: data.jabatan,
        dpd: data.dpd,
        count: data.members.length,
        members: data.members,
        territories,
      };
    })
    .sort((a, b) => b.count - a.count);

  const topRecruiter = recruitersList.length > 0 ? recruitersList[0] : null;

  // Build hierarchical territorial tree: DPD -> DPC -> DPRt -> Members
  // AND track recruiters at each territorial level
  const dpdMap = new Map<string, Map<string, Map<string, Member[]>>>();

  targetMembers.forEach((m) => {
    const dpdName = m.dpd || 'Umum';
    const dpcName = m.dpc || 'Umum';
    const dprtName = m.dprt || 'Umum';

    if (!dpdMap.has(dpdName)) {
      dpdMap.set(dpdName, new Map());
    }
    const dpcMap = dpdMap.get(dpdName)!;

    if (!dpcMap.has(dpcName)) {
      dpcMap.set(dpcName, new Map());
    }
    const dprtMap = dpcMap.get(dpcName)!;

    if (!dprtMap.has(dprtName)) {
      dprtMap.set(dprtName, []);
    }
    dprtMap.get(dprtName)!.push(m);
  });

  const totalNew = targetMembers.length;

  const territorialTree: DpdGrowthNode[] = Array.from(dpdMap.entries())
    .map(([dpdName, dpcMap]) => {
      let dpdCount = 0;
      const dpdRecruitersMap = new Map<string, { jabatan: string; count: number }>();

      const dpcs: DpcGrowthNode[] = Array.from(dpcMap.entries())
        .map(([dpcName, dprtMap]) => {
          let dpcCount = 0;
          const dpcRecruitersMap = new Map<string, { jabatan: string; count: number }>();

          const dprts: DprtGrowthNode[] = Array.from(dprtMap.entries())
            .map(([dprtName, memberList]) => {
              dpcCount += memberList.length;

              const dprtRecruitersMap = new Map<string, { jabatan: string; count: number }>();
              memberList.forEach((m) => {
                const recName = m.kaderPerekrutNama || 'Kader Pengurus Wilayah';
                const recJabatan = m.kaderPerekrutJabatan || 'Pengurus NasDem';

                // Accumulate to DPRt
                const currDprt = dprtRecruitersMap.get(recName) || { jabatan: recJabatan, count: 0 };
                currDprt.count++;
                dprtRecruitersMap.set(recName, currDprt);

                // Accumulate to DPC
                const currDpc = dpcRecruitersMap.get(recName) || { jabatan: recJabatan, count: 0 };
                currDpc.count++;
                dpcRecruitersMap.set(recName, currDpc);

                // Accumulate to DPD
                const currDpd = dpdRecruitersMap.get(recName) || { jabatan: recJabatan, count: 0 };
                currDpd.count++;
                dpdRecruitersMap.set(recName, currDpd);
              });

              return {
                name: dprtName,
                count: memberList.length,
                recruiters: Array.from(dprtRecruitersMap.entries())
                  .map(([nama, r]) => ({ nama, jabatan: r.jabatan, count: r.count }))
                  .sort((a, b) => b.count - a.count),
                members: memberList,
              };
            })
            .sort((a, b) => b.count - a.count);

          dpdCount += dpcCount;
          return {
            name: dpcName,
            count: dpcCount,
            recruiters: Array.from(dpcRecruitersMap.entries())
              .map(([nama, r]) => ({ nama, jabatan: r.jabatan, count: r.count }))
              .sort((a, b) => b.count - a.count),
            dprts,
          };
        })
        .sort((a, b) => b.count - a.count);

      return {
        name: dpdName,
        count: dpdCount,
        percentage: totalNew > 0 ? Math.round((dpdCount / totalNew) * 100) : 0,
        recruiters: Array.from(dpdRecruitersMap.entries())
          .map(([nama, r]) => ({ nama, jabatan: r.jabatan, count: r.count }))
          .sort((a, b) => b.count - a.count),
        dpcs,
      };
    })
    .sort((a, b) => b.count - a.count);

  const topDpd = territorialTree.length > 0 ? { name: territorialTree[0].name, count: territorialTree[0].count } : null;

  let periodLabel = '30 Hari Terakhir';
  if (pinnedDate) periodLabel = `Tanggal ${formatDisplayDate(pinnedDate)}`;
  else if (period === 'today') periodLabel = 'Hari Ini';
  else if (period === '7days') periodLabel = '7 Hari Terakhir';
  else if (period === '30days') periodLabel = '30 Hari Terakhir';
  else if (period === 'month') periodLabel = 'Bulan Berjalan';
  else if (period === 'all') periodLabel = 'Semua Riwayat Registrasi';

  return {
    periodLabel,
    totalNew,
    todayCount,
    last7DaysCount,
    last30DaysCount,
    thisMonthCount,
    topDpd,
    topRecruiter,
    activeRecruitersCount: recruitersList.length,
    recruitersList,
    dailyPoints,
    territorialTree,
    filteredMembers: targetMembers,
  };
}

/**
 * Generates the test scenario requested by user:
 * +100 new members in Kabupaten Minahasa Selatan
 * +50 new members in Kota Manado
 * AND each recruit is recruited by prominent local cadres!
 */
export function generateTestScenarioMembers(): Member[] {
  const now = new Date();
  const todayISO = formatDateISO(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayISO = formatDateISO(yesterday);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(now.getDate() - 2);
  const twoDaysAgoISO = formatDateISO(twoDaysAgo);

  const datesPool = [todayISO, todayISO, todayISO, yesterdayISO, yesterdayISO, twoDaysAgoISO];

  const minselRegion = SULUT_REGIONS.find((r) => r.id === 'minsel') || SULUT_REGIONS[4];
  const manadoRegion = SULUT_REGIONS.find((r) => r.id === 'manado') || SULUT_REGIONS[0];

  // Cadres in Minahasa Selatan who are actively recruiting
  const minselRecruiters = [
    {
      nama: 'Debby C. Sondakh, S.E.',
      jabatan: 'Bendahara DPD NasDem Kab. Minahasa Selatan',
      nik: '7171032511720003',
      dpd: minselRegion.name,
      share: 40, // Recruits 40 members
    },
    {
      nama: 'Mario Kawengian',
      jabatan: 'Ketua DPC NasDem Kec. Amurang',
      nik: '7105011208880004',
      dpd: minselRegion.name,
      share: 25, // Recruits 25 members
    },
    {
      nama: 'Christian Toloh',
      jabatan: 'Sekretaris DPC NasDem Kec. Tenga',
      nik: '7105021509850005',
      dpd: minselRegion.name,
      share: 20, // Recruits 20 members
    },
    {
      nama: 'Vanda Sumual',
      jabatan: 'Kader Penggerak Teritorial Minsel',
      nik: '7105032004920006',
      dpd: minselRegion.name,
      share: 15, // Recruits 15 members
    },
  ];

  // Cadres in Kota Manado who are actively recruiting
  const manadoRecruiters = [
    {
      nama: 'Drs. Albert H. Tombokan, M.Si',
      jabatan: 'Ketua DPD Partai NasDem Kota Manado',
      nik: '7171011504850001',
      dpd: manadoRegion.name,
      share: 25, // Recruits 25 members
    },
    {
      nama: 'Arthur Wenas',
      jabatan: 'Ketua DPC NasDem Kec. Wenang',
      nik: '7171021405900007',
      dpd: manadoRegion.name,
      share: 15, // Recruits 15 members
    },
    {
      nama: 'Glady Senduk',
      jabatan: 'Kader Penggerak Teritorial Kec. Malalayang',
      nik: '7171031806930008',
      dpd: manadoRegion.name,
      share: 10, // Recruits 10 members
    },
  ];

  const minselNames = [
    'Rian Rompas', 'Aldo Rantung', 'Novita Wowor', 'Jefry Lumempouw', 'Grace Sondakh',
    'Edwin Polii', 'Debby Mandey', 'Frangky Pongoh', 'Irene Tombokan', 'Billy Rondonuwu',
    'Jessica Liando', 'Samuel Tiwow', 'Lidya Moningka', 'Steven Turangan', 'Rina Lumowa',
    'Daniel Kolibu', 'Hanny Rumengan', 'Meyke Tamboto', 'Ronald Goni', 'Sintia Worotitjan',
    'Yohanis Mokalu', 'Ester Karundeng', 'Bambang Lumenta', 'Wulan Rattu', 'Jerry Pangkey',
    'Fitria Pelealu', 'Claudio Walangitan', 'Tirza Sondakh', 'Marchelino Suoth', 'Mega Poluan'
  ];

  const manadoNames = [
    'Hendra Makalew', 'Indah Supit', 'Kevin Palit', 'Leony Katuuk', 'Michael Umboh',
    'Natalia Sumampouw', 'Oswald Ticoalu', 'Putri Mandagi', 'Reinhard Walangitan', 'Sintje Wowor',
    'Tommy Nelwan', 'Vivi Kalalo', 'William Poluan', 'Yulita Manoppo', 'Zefanya Runtunuwu',
    'Gerry Lasut', 'Nathanael Sompie', 'Theresia Tangkuman', 'Robby Pangalila', 'Fifi Tambuwun'
  ];

  const results: Member[] = [];

  // 1. Generate 100 members in Minahasa Selatan
  let minselIndex = 0;
  minselRecruiters.forEach((recruiter) => {
    for (let j = 0; j < recruiter.share; j++) {
      minselIndex++;
      const subIndex = minselIndex % minselRegion.subdistricts.length;
      const sub = minselRegion.subdistricts[subIndex];
      const vilIndex = (minselIndex * 2) % sub.villages.length;
      const village = sub.villages[vilIndex] || sub.villages[0] || 'Pusat';

      const baseName = minselNames[minselIndex % minselNames.length];
      const namaLengkap = `${baseName} ${String.fromCharCode(65 + (minselIndex % 26))}.`;
      const nik = `7105${String(10 + (minselIndex % 80)).padStart(2, '0')}${String(100000 + minselIndex * 17).slice(-6)}${String(1000 + minselIndex).slice(-4)}`;
      const nomorEKTA = `ND-7105-2024-${String(5000 + minselIndex).padStart(4, '0')}`;
      const dateJoined = datesPool[minselIndex % datesPool.length];

      results.push({
        nik,
        nomorEKTA,
        namaLengkap,
        nomorHP: `081244${String(100000 + minselIndex).slice(-6)}`,
        dpd: minselRegion.name,
        dpc: sub.name,
        dprt: village,
        isPengurus: minselIndex % 10 === 0,
        tingkatKepengurusan: minselIndex % 10 === 0 ? 'DPRt' : 'Bukan Pengurus',
        jabatan: minselIndex % 10 === 0 ? 'Kader Pengurus DPRt' : 'Anggota Kader Simpatisan',
        status: 'Aktif',
        tanggalBergabung: dateJoined,
        catatanMutasi: `Direkrut langsung oleh ${recruiter.nama} (${recruiter.jabatan}) berbasis KTP wilayah.`,
        terakhirDiubah: `${dateJoined} 14:00`,
        diubahOleh: recruiter.nama,
        statusKtpVerified: true,
        jenisKelamin: minselIndex % 2 === 0 ? 'Laki-laki' : 'Perempuan',
        kaderPerekrutNama: recruiter.nama,
        kaderPerekrutJabatan: recruiter.jabatan,
        kaderPerekrutNik: recruiter.nik,
        kaderPerekrutDpd: recruiter.dpd,
      });
    }
  });

  // 2. Generate 50 members in Kota Manado
  let manadoIndex = 0;
  manadoRecruiters.forEach((recruiter) => {
    for (let j = 0; j < recruiter.share; j++) {
      manadoIndex++;
      const subIndex = manadoIndex % manadoRegion.subdistricts.length;
      const sub = manadoRegion.subdistricts[subIndex];
      const vilIndex = (manadoIndex * 3) % sub.villages.length;
      const village = sub.villages[vilIndex] || sub.villages[0] || 'Wenang';

      const baseName = manadoNames[manadoIndex % manadoNames.length];
      const namaLengkap = `${baseName} ${String.fromCharCode(65 + (manadoIndex % 26))}.`;
      const nik = `7171${String(10 + (manadoIndex % 80)).padStart(2, '0')}${String(200000 + manadoIndex * 19).slice(-6)}${String(2000 + manadoIndex).slice(-4)}`;
      const nomorEKTA = `ND-7171-2024-${String(6000 + manadoIndex).padStart(4, '0')}`;
      const dateJoined = datesPool[manadoIndex % datesPool.length];

      results.push({
        nik,
        nomorEKTA,
        namaLengkap,
        nomorHP: `081355${String(200000 + manadoIndex).slice(-6)}`,
        dpd: manadoRegion.name,
        dpc: sub.name,
        dprt: village,
        isPengurus: manadoIndex % 8 === 0,
        tingkatKepengurusan: manadoIndex % 8 === 0 ? 'DPRt' : 'Bukan Pengurus',
        jabatan: manadoIndex % 8 === 0 ? 'Kader Pengurus DPRt' : 'Anggota Kader Simpatisan',
        status: 'Aktif',
        tanggalBergabung: dateJoined,
        catatanMutasi: `Direkrut langsung oleh ${recruiter.nama} (${recruiter.jabatan}) berbasis KTP Kota Manado.`,
        terakhirDiubah: `${dateJoined} 11:30`,
        diubahOleh: recruiter.nama,
        statusKtpVerified: true,
        jenisKelamin: manadoIndex % 2 === 0 ? 'Laki-laki' : 'Perempuan',
        kaderPerekrutNama: recruiter.nama,
        kaderPerekrutJabatan: recruiter.jabatan,
        kaderPerekrutNik: recruiter.nik,
        kaderPerekrutDpd: recruiter.dpd,
      });
    }
  });

  return results;
}
