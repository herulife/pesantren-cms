import type { Campaign } from '@/lib/api';

export type FeaturedDonationDetail = {
  slug: string;
  title: string;
  campaignSearchTerm: string;
  target: number;
  whatsappUrl: string;
  contactLabel: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  posterImage: string;
  coverImage: string;
  summary: string;
  category: string;
  focus: string;
  progressAmount: number;
  points: string[];
  story: string[];
};

export const featuredOpenDonation: FeaturedDonationDetail = {
  slug: 'wakaf-cat-tembok',
  title: 'Wakaf Cat Tembok untuk Ruang Kelas Penghafal Al-Quran',
  campaignSearchTerm: 'wakaf cat tembok',
  target: 15000000,
  whatsappUrl: 'https://wa.me/6281932506078',
  contactLabel: '0819 3250 6078',
  bankName: 'BSI',
  accountNumber: '4381567120',
  accountHolder: 'Alma Parung Bogor',
  posterImage: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1700&q=80',
  coverImage: 'https://images.unsplash.com/photo-1744132242267-9aa633fd2f73?auto=format&fit=crop&w=1700&q=80',
  summary:
    'Kami membuka kesempatan amal jariyah untuk membantu pengecatan ruang kelas santri agar suasana belajar lebih bersih, nyaman, dan membangkitkan semangat menghafal Al-Quran.',
  category: 'Wakaf Renovasi Ringan',
  focus: 'Ruang Kelas Penghafal Al-Quran',
  progressAmount: 0,
  points: [
    'Setiap rupiah yang dititipkan ikut menghadirkan ruang belajar yang lebih pantas untuk para penghafal Al-Quran.',
    'Donasi difokuskan untuk pengecatan ruang kelas santri di Pondok Pesantren Al-Maa Parung Bogor.',
    'Target penggalangan dana ditetapkan sebesar Rp 15.000.000 agar pengerjaan bisa dilakukan dengan rapi dan menyeluruh.',
  ],
  story: [
    'Ruang kelas adalah tempat banyak ayat diulang, dihafal, dan dijaga setiap hari. Karena itu, suasana belajar yang bersih dan layak bukan hal kecil dalam perjalanan para santri.',
    'Program ini dibuka agar ruang belajar santri terasa lebih nyaman untuk murojaah, belajar diniyah, dan menjalani aktivitas pembinaan dengan semangat yang lebih baik.',
    'Kami mengajak para muhsinin untuk ikut mengambil bagian. InsyaAllah setiap bantuan yang masuk menjadi bagian dari jejak kebaikan yang terus hidup bersama ilmu yang dipelajari santri.',
  ],
};

export function slugifyDonationTitle(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[-\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDonationText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findFeaturedDonationCampaign(
  campaigns: Campaign[],
  featured: FeaturedDonationDetail = featuredOpenDonation
) {
  const searchTerms = [
    featured.campaignSearchTerm,
    featured.slug.replace(/-/g, ' '),
    featured.title,
  ]
    .map(normalizeDonationText)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  return (
    campaigns.find((campaign) => {
      const normalizedTitle = normalizeDonationText(campaign.title);
      const normalizedSlug = slugifyDonationTitle(campaign.title);

      return (
        normalizedSlug === featured.slug ||
        searchTerms.some((term) => normalizedTitle.includes(term))
      );
    }) ?? null
  );
}

export function buildCampaignDetailHref(campaign: Campaign) {
  return `/donations/${slugifyDonationTitle(campaign.title)}-${campaign.id}`;
}

export function parseCampaignIdFromSlug(slug: string) {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
}
