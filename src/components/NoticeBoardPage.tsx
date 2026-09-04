import React, { useState } from 'react';
import { Announcement, AnnouncementCategory, User } from '../types';
import { storage } from '../services/storage';
import { 
  Bell, 
  Pin, 
  Sparkles, 
  Search, 
  Plus, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  Check
} from 'lucide-react';

interface NoticeBoardPageProps {
  currentUser: User;
  onRefresh: () => void;
}

export const NoticeBoardPage: React.FC<NoticeBoardPageProps> = ({ currentUser, onRefresh }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => storage.getAnnouncements());
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('puja');
  const [formBadge, setFormBadge] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formAuthor, setFormAuthor] = useState(currentUser.fullName || 'Temple Committee');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const reloadData = () => {
    setAnnouncements(storage.getAnnouncements());
    onRefresh();
  };

  const handleOpenCreateModal = () => {
    setEditingAnn(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('puja');
    setFormBadge('');
    setFormIsPinned(false);
    setFormAuthor(currentUser.fullName || 'Temple Committee');
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleOpenEditModal = (ann: Announcement) => {
    setEditingAnn(ann);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormBadge(ann.badgeText || '');
    setFormIsPinned(ann.isPinned);
    setFormAuthor(ann.authorName);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Please enter an announcement title.');
      return;
    }
    if (!formContent.trim()) {
      setFormError('Please enter announcement content or guidelines.');
      return;
    }

    if (editingAnn) {
      storage.updateAnnouncement(editingAnn.id, {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        badgeText: formBadge.trim() || undefined,
        isPinned: formIsPinned,
        authorName: formAuthor.trim() || 'Temple Committee'
      });
      setFormSuccess('Announcement updated successfully!');
    } else {
      storage.addAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        badgeText: formBadge.trim() || undefined,
        isPinned: formIsPinned,
        authorName: formAuthor.trim() || 'Temple Committee',
        publishedDate: new Date().toISOString().split('T')[0]
      });
      setFormSuccess('Announcement posted successfully!');
    }

    setTimeout(() => {
      setShowModal(false);
      setFormSuccess('');
      reloadData();
    }, 1000);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete announcement "${title}"?`)) {
      storage.deleteAnnouncement(id);
      reloadData();
    }
  };

  const handleTogglePin = (id: string) => {
    storage.togglePinAnnouncement(id);
    reloadData();
  };

  const handleCopyNotice = (ann: Announcement) => {
    const text = `📢 *${ann.title}*\n${ann.badgeText ? `[${ann.badgeText}]\n` : ''}\n${ann.content}\n\n— Temple Of Fine Arts Penang (${ann.authorName})`;
    navigator.clipboard.writeText(text);
    setCopiedId(ann.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered List
  const filtered = announcements.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchContent = a.content.toLowerCase().includes(q);
      const matchAuthor = a.authorName.toLowerCase().includes(q);
      const matchBadge = a.badgeText?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor && !matchBadge) return false;
    }
    return true;
  });

  const pinnedList = filtered.filter(a => a.isPinned);
  const regularList = filtered.filter(a => !a.isPinned);

  const getCategoryMeta = (cat: AnnouncementCategory) => {
    switch (cat) {
      case 'festival':
        return { label: 'Festival', icon: '🪔', bg: 'bg-[#FEF3EB]', text: 'text-[#D97736]', border: 'border-[#FEE2C7]' };
      case 'puja':
        return { label: 'Puja & Satsang', icon: '🛕', bg: 'bg-[#EBF3ED]', text: 'text-[#1E5E3A]', border: 'border-[#CDE0D4]' };
      case 'seva':
        return { label: 'Seva & Prasadam', icon: '🤝', bg: 'bg-[#F0FDF4]', text: 'text-[#16A34A]', border: 'border-[#BBF7D0]' };
      case 'general':
      default:
        return { label: 'General Notice', icon: '📢', bg: 'bg-[#F4F7F4]', text: 'text-[#5D6B62]', border: 'border-[#E0E5DF]' };
    }
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr + 'T00:00:00');
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#1E5E3A] via-[#164E30] to-[#1E2621] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-emerald-200" />
              <span>TFA Penang Notice Board &amp; Circulars</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-temple tracking-tight">
              Announcements &amp; Guidelines
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              Official news, holy festival dates, sanctum guidelines, and weekly satsang schedules from the Temple Of Fine Arts Penang committee.
            </p>
          </div>

          {currentUser.role === 'admin' && (
            <button
              onClick={handleOpenCreateModal}
              className="self-start md:self-auto inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-[#1E5E3A] hover:bg-emerald-50 font-bold rounded-xl text-xs shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Post New Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E0E5DF] shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1E5E3A] text-white shadow-2xs'
                : 'bg-[#FAFAF7] text-[#5D6B62] hover:bg-[#F4F7F4] border border-[#E0E5DF]'
            }`}
          >
            All Notices ({announcements.length})
          </button>
          {(['festival', 'puja', 'seva', 'general'] as AnnouncementCategory[]).map(cat => {
            const meta = getCategoryMeta(cat);
            const count = announcements.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1 ${
                  selectedCategory === cat
                    ? 'bg-[#1E5E3A] text-white shadow-2xs'
                    : 'bg-[#FAFAF7] text-[#5D6B62] hover:bg-[#F4F7F4] border border-[#E0E5DF]'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5D6B62]" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] placeholder-[#8A968D] focus:bg-white focus:border-[#1E5E3A] outline-none"
          />
        </div>
      </div>

      {/* Pinned Circulars (if any) */}
      {pinnedList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#D97736] uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5 fill-[#D97736]" />
            <span>Pinned &amp; Key Circulars ({pinnedList.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedList.map(ann => {
              const meta = getCategoryMeta(ann.category);
              return (
                <div
                  key={ann.id}
                  className="bg-gradient-to-br from-[#FEF9EE] to-white rounded-2xl border-2 border-[#FDE7C7] p-5 shadow-xs flex flex-col justify-between relative group hover:border-[#FBD197] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3EB] text-[#D97736] border border-[#FEE2C7]">
                          <Pin className="w-2.5 h-2.5 fill-[#D97736]" />
                          <span>PINNED</span>
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text} border ${meta.border}`}>
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                        {ann.badgeText && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3ED] text-[#1E5E3A] border border-[#CDE0D4]">
                            {ann.badgeText}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopyNotice(ann)}
                          title="Copy notice text"
                          className="p-1 rounded-lg text-[#5D6B62] hover:bg-white/80 cursor-pointer"
                        >
                          {copiedId === ann.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                        </button>
                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleTogglePin(ann.id)}
                              title="Unpin"
                              className="p-1 rounded-lg text-[#D97736] hover:bg-white/80 cursor-pointer"
                            >
                              <Pin className="w-3.5 h-3.5 fill-[#D97736]" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(ann)}
                              title="Edit notice"
                              className="p-1 rounded-lg text-[#5D6B62] hover:bg-white/80 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(ann.id, ann.title)}
                              title="Delete notice"
                              className="p-1 rounded-lg text-red-500 hover:bg-white/80 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#1E2621] font-temple leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4A574E] mt-2 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#FEE2C7] flex items-center justify-between text-[11px] text-[#5D6B62]">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-[#D97736]" />
                      <span>{formatDisplayDate(ann.publishedDate)}</span>
                    </span>
                    <span className="font-medium text-[#1E2621]">
                      By {ann.authorName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Circulars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1E2621] uppercase tracking-wider font-temple flex items-center space-x-2">
            <span>Recent Circulars &amp; Notices</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FAFAF7] border border-[#E0E5DF] text-[#5D6B62]">
              {regularList.length}
            </span>
          </h2>
        </div>

        {regularList.length === 0 && pinnedList.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#E0E5DF] text-[#5D6B62] space-y-2">
            <span className="text-4xl">📭</span>
            <p className="text-sm font-bold text-[#1E2621]">No announcements found</p>
            <p className="text-xs text-[#5D6B62]">Try clearing your search query or switching categories.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regularList.map(ann => {
              const meta = getCategoryMeta(ann.category);
              return (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-2xs hover:border-[#CDE0D4] transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text} border ${meta.border}`}>
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                      {ann.badgeText && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3ED] text-[#1E5E3A] border border-[#CDE0D4]">
                          {ann.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto text-xs text-[#5D6B62]">
                      <span className="flex items-center space-x-1 text-[11px]">
                        <Calendar className="w-3 h-3 text-[#1E5E3A]" />
                        <span>{formatDisplayDate(ann.publishedDate)}</span>
                      </span>
                      <button
                        onClick={() => handleCopyNotice(ann)}
                        title="Copy notice text"
                        className="p-1 rounded-lg text-[#5D6B62] hover:bg-[#F4F7F4] cursor-pointer"
                      >
                        {copiedId === ann.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>

                      {currentUser.role === 'admin' && (
                        <div className="flex items-center space-x-1 pl-1 border-l border-[#E0E5DF]">
                          <button
                            onClick={() => handleTogglePin(ann.id)}
                            title="Pin to top"
                            className="p-1 rounded-lg text-[#5D6B62] hover:text-[#D97736] hover:bg-[#F4F7F4] cursor-pointer"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(ann)}
                            title="Edit notice"
                            className="p-1 rounded-lg text-[#5D6B62] hover:bg-[#F4F7F4] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ann.id, ann.title)}
                            title="Delete notice"
                            className="p-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1E2621] font-temple">
                      {ann.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4A574E] mt-1.5 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#5D6B62]">
                    <span>By <strong className="text-[#1E2621]">{ann.authorName}</strong></span>
                    {ann.validUntil && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        Valid until {formatDisplayDate(ann.validUntil)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Post / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E2621] text-base font-temple">
                    {editingAnn ? 'Edit Circular' : 'Post New Circular'}
                  </h3>
                  <p className="text-[11px] text-[#5D6B62]">
                    Publish official notices to all devotees on the portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-[#5D6B62] hover:bg-[#F4F7F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Circular Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Satsang Timings & Alankaram Guidelines"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] font-medium focus:bg-white focus:border-[#1E5E3A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AnnouncementCategory)}
                    className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] font-medium"
                  >
                    <option value="puja">🛕 Puja &amp; Satsang</option>
                    <option value="festival">🪔 Holy Festival</option>
                    <option value="seva">🤝 Seva &amp; Prasadam</option>
                    <option value="general">📢 General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Notice, Festival Seva"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Notice Content &amp; Instructions *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide clear timings, instructions, guidelines or festival details for devotees..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] focus:bg-white focus:border-[#1E5E3A] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                    Author / Issued By
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Temple Committee"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-bold text-[#1E2621] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E5E3A] focus:ring-[#1E5E3A]"
                    />
                    <span>📌 Pin to Top as Key Circular</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{editingAnn ? 'SAVE CHANGES' : 'PUBLISH NOTICE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
