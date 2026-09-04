import { Announcement } from '../types';

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_portal_launch_2026',
    title: 'Auspicious Launch on Krishna Janmashtami (4th September 2026)',
    content: 'With the divine blessings of Swami Shantanand Saraswathi, the Temple Of Fine Arts Penang has launched the online Shiva Family Portal on Krishna Janmashtami. Devotees may now reserve sacred Vigrahas for weekly home prayers and register to host Sunday community satsang & prasadam seva.',
    category: 'festival',
    isPinned: true,
    authorName: 'TFA Penang Admin',
    publishedDate: '2026-09-04',
    badgeText: 'Launched Today',
    createdAt: '2026-09-04T00:00:00.000Z'
  },
  {
    id: 'ann_deity_return_timing',
    title: 'Important Sanctum Guideline: Deity Return Time Before 5:00 AM',
    content: 'All devotees blessed with hosting holy deities at home are kindly requested to return the Vigraha on the concluding Sunday before 5:00 AM. This allows our sanctum seva team and priest adequate time to perform sacred abhishekam, fresh alankaram, and floral preparation before the incoming family arrives.',
    category: 'puja',
    isPinned: true,
    authorName: 'Sanctum Seva Committee',
    publishedDate: '2026-09-04',
    badgeText: 'Sanctum Rule',
    createdAt: '2026-09-04T01:00:00.000Z'
  },
  {
    id: 'ann_sunday_satsang_schedule',
    title: 'Weekly Sunday Morning Satsang & Aradhana Timings',
    content: 'Join us every Sunday for divine community worship:\n• 10:30 AM: Shiva Abhishekam & Chanting\n• 11:15 AM: Guru Stotram & Devotional Bhajans\n• 12:00 PM: Maha Mangala Arati\n• 12:30 PM: Prasadam Feast served in the dining hall\n\nAll devotees and visiting families are warmly welcome to take part in the singing and seva.',
    category: 'puja',
    isPinned: false,
    authorName: 'TFA Penang Admin',
    publishedDate: '2026-09-01',
    badgeText: 'Weekly Seva',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'ann_prasadam_guidelines',
    title: 'Sunday Prasadam Offering Guidelines for Host Families',
    content: 'Families hosting Sunday prayers are blessed to prepare or sponsor satvic vegetarian prasadam (strictly without onions or garlic) for approximately 50 to 80 devotees. Please coordinate with the temple kitchen coordinator by the preceding Friday to confirm reheating and serving logistics.',
    category: 'seva',
    isPinned: false,
    authorName: 'Kitchen Seva Team',
    publishedDate: '2026-08-28',
    badgeText: 'Prasadam Seva',
    createdAt: '2026-08-28T09:00:00.000Z'
  },
  {
    id: 'ann_navaratri_preparations',
    title: 'Upcoming Navaratri Mahotsav & Kolu Alankaram',
    content: 'Devotees interested in volunteering for the grand Navaratri floral decorations, Kolu display arrangement, or offering cultural music and dance performances, please contact the temple office or your committee coordinators.',
    category: 'festival',
    isPinned: false,
    authorName: 'Cultural Committee',
    publishedDate: '2026-08-20',
    validUntil: '2026-10-15',
    badgeText: 'Upcoming Festival',
    createdAt: '2026-08-20T10:00:00.000Z'
  }
];
