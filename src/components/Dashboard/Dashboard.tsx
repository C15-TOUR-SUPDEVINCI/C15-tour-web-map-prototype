import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    Copy,
    Loader2,
    LogOut,
    Pin,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Itinerary } from '../../domain';
import { getErrorMessage } from '../../lib/errors';
import './Dashboard.css';
import logoImg from '../../assets/logo-tour95.png';

const PILL_COLORS = ['#bb487c', '#e07b4a', '#4a9ee0', '#6abf69', '#a05cc8', '#d4a843'];
const PINNED_IDS_KEY = 'c15-pinned-ids';
type SortKey = 'date' | 'name';

const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

export function Dashboard() {
    const navigate = useNavigate();
    const itineraries = useRouteStore((s) => s.itineraries);
    const loadAll = useRouteStore((s) => s.loadAll);
    const createNew = useRouteStore((s) => s.createNew);
    const openItinerary = useRouteStore((s) => s.openItinerary);
    const deleteItinerary = useRouteStore((s) => s.deleteItinerary);
    const isLoadingItineraries = useRouteStore((s) => s.isLoadingItineraries);
    const loadError = useRouteStore((s) => s.loadError);

    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isOpening, setIsOpening] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
        try {
            const parsed: unknown = JSON.parse(localStorage.getItem(PINNED_IDS_KEY) ?? '[]');
            return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
        } catch {
            return new Set();
        }
    });
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (!user?.id) return;
        void loadAll();
    }, [loadAll, user?.id]);

    useEffect(() => {
        localStorage.setItem(PINNED_IDS_KEY, JSON.stringify([...pinnedIds]));
    }, [pinnedIds]);

    const handleSortClick = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const filtered = useMemo(() => {
        let list = [...itineraries];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((itinerary) => itinerary.name.toLowerCase().includes(q));
        }

        list.sort((a, b) => {
            const cmp = sortKey === 'name'
                ? a.name.localeCompare(b.name)
                : new Date(a.startDate || a.lastModified).getTime()
                    - new Date(b.startDate || b.lastModified).getTime();
            return sortDir === 'asc' ? cmp : -cmp;
        });

        const pinned = list.filter((itinerary) => pinnedIds.has(itinerary.id));
        const unpinned = list.filter((itinerary) => !pinnedIds.has(itinerary.id));
        return [...pinned, ...unpinned];
    }, [itineraries, pinnedIds, search, sortDir, sortKey]);

    const handleDelete = async (itinerary: Itinerary) => {
        if (!confirm('Supprimer cet itineraire ?')) return;

        setIsDeleting(itinerary.id);
        try {
            await deleteItinerary(itinerary.id);
            setPinnedIds((prev) => {
                const next = new Set(prev);
                next.delete(itinerary.id);
                return next;
            });
        } catch (error: unknown) {
            alert(`Erreur suppression : ${getErrorMessage(error)}`);
        } finally {
            setIsDeleting(null);
        }
    };

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Date inconnue';

        const now = new Date();
        const isSameDay = date.toDateString() === now.toDateString();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        if (isSameDay) return "Aujourd'hui";
        if (date.toDateString() === tomorrow.toDateString()) return 'Demain';
        if (date.toDateString() === yesterday.toDateString()) return 'Hier';

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleOpen = (id: string) => {
        void (async () => {
            setIsOpening(id);
            try {
                await openItinerary(id);
                navigate(`/editor/${id}`);
            } catch (error: unknown) {
                alert(`Erreur chargement : ${getErrorMessage(error)}`);
            } finally {
                setIsOpening(null);
            }
        })();
    };

    const togglePin = (id: string) => {
        setPinnedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'U';

    return (
        <div className="db-root">
            <div className="db-map-bg" aria-hidden="true">
                <iframe
                    title="map-background"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-2.0,46.8,-0.8,47.6&layer=mapnik"
                    className="db-map-iframe"
                    tabIndex={-1}
                />
            </div>
            <div className="db-rose-overlay" aria-hidden="true" />

            <div className="db-layout">
                <nav className="db-navbar">
                    <div className="db-navbar-logo">
                        <img src={logoImg} alt="C15 Tour" />
                    </div>
                    <div className="db-navbar-actions">
                        <button
                            className="db-nav-btn"
                            onClick={() => void loadAll()}
                            disabled={isLoadingItineraries}
                            title="Actualiser les trajets depuis le serveur"
                        >
                            <RefreshCw size={14} className={isLoadingItineraries ? 'spin' : ''} />
                            <span>Synchroniser</span>
                        </button>
                        <button className="db-nav-btn" onClick={() => navigate('/signup')}>
                            <UserPlus size={14} /><span>Utilisateur</span>
                        </button>
                        <button className="db-nav-btn db-nav-btn--logout" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut size={14} /><span>Deconnexion</span>
                        </button>
                        {user?.email && (
                            <div className="db-user-pill" title={user.email}>
                                <span className="db-user-email">{user.email}</span>
                                <div className="db-user-avatar">{userInitials}</div>
                            </div>
                        )}
                    </div>
                </nav>

                <main className="db-main">
                    <div className="db-content">
                        <div className="db-toolbar">
                            <div className="db-search-wrap">
                                <Search size={15} className={`db-search-icon ${search ? 'db-search-icon--active' : ''}`} />
                                <input
                                    className="db-search"
                                    type="search"
                                    placeholder="Rechercher un trajet..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button className="db-search-clear" onClick={() => setSearch('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="db-sort-group">
                                <ArrowUpDown size={14} className="db-sort-icon" />
                                <span className="db-sort-label">Trier :</span>
                                {(['date', 'name'] as SortKey[]).map((key) => {
                                    const labels: Record<SortKey, string> = { date: 'Début', name: 'Nom' };
                                    const active = sortKey === key;
                                    return (
                                        <button
                                            key={key}
                                            className={`db-sort-btn${active ? ' db-sort-btn--active' : ''}`}
                                            onClick={() => handleSortClick(key)}
                                        >
                                            {labels[key]}
                                            {active && (sortDir === 'asc'
                                                ? <ArrowUp size={12} className="db-sort-arrow" />
                                                : <ArrowDown size={12} className="db-sort-arrow" />)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {isLoadingItineraries && (
                            <p className="db-empty">
                                <Loader2 size={16} className="spin" /> Chargement...
                            </p>
                        )}

                        {loadError && !isLoadingItineraries && (
                            <p className="db-empty">Erreur : {loadError}</p>
                        )}

                        {!isLoadingItineraries && !loadError && filtered.length === 0 && (
                            <p className="db-empty">Aucun trajet trouve.</p>
                        )}

                        {!loadError && filtered.map((itinerary, idx) => {
                            const color = PILL_COLORS[hashString(itinerary.id) % PILL_COLORS.length];
                            const isPinned = pinnedIds.has(itinerary.id);
                            const isRowOpening = isOpening === itinerary.id;
                            const isCopied = copiedId === itinerary.id;

                            const handleCopyShareCode = () => {
                                if (!itinerary.shareCode) return;
                                void navigator.clipboard.writeText(itinerary.shareCode).then(() => {
                                    setCopiedId(itinerary.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                });
                            };

                            return (
                                <div key={itinerary.id} className="db-row-wrapper" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div
                                        className="db-row"
                                    >
                                        <div className="db-edit-overlay">
                                            <span className="db-edit-text">+ Modifier</span>
                                        </div>

                                        <div
                                            className="db-row-main"
                                            onClick={() => handleOpen(itinerary.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') handleOpen(itinerary.id);
                                            }}
                                        >
                                            <span className="db-row-dot" style={{ background: color }} />
                                            <span className="db-row-name">{itinerary.name}</span>
                                            <span className="db-row-meta">{formatDate(itinerary.startDate || itinerary.lastModified)}</span>
                                            {isRowOpening && <Loader2 size={15} className="spin db-row-loader" />}
                                        </div>

                                        <div className="db-row-actions">
                                            <button
                                                className={`db-action-btn db-action-btn--pin${isPinned ? ' is-pinned' : ''}`}
                                                onClick={() => togglePin(itinerary.id)}
                                                title={isPinned ? 'Desepingler' : 'Epingler en haut'}
                                            >
                                                <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                className="db-action-btn db-action-btn--delete"
                                                onClick={() => {
                                                    void handleDelete(itinerary);
                                                }}
                                                title="Supprimer"
                                                disabled={isDeleting === itinerary.id}
                                            >
                                                {isDeleting === itinerary.id
                                                    ? <Loader2 size={16} className="spin" />
                                                    : <Trash2 size={16} />}
                                            </button>
                                            {/* Badge inline dans la carte — visible uniquement sur mobile */}
                                            {itinerary.shareCode && (
                                                <button
                                                    className={`db-share-badge db-share-badge--inline${isCopied ? ' db-share-badge--copied' : ''}`}
                                                    onClick={handleCopyShareCode}
                                                    title={isCopied ? 'Copié !' : 'Cliquer pour copier le code de partage'}
                                                >
                                                    {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                                    {itinerary.shareCode}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Badge externe — visible uniquement sur desktop (sibling du .db-row) */}
                                    {itinerary.shareCode && (
                                        <button
                                            className={`db-share-badge db-share-badge--external${isCopied ? ' db-share-badge--copied' : ''}`}
                                            onClick={handleCopyShareCode}
                                            title={isCopied ? 'Copié !' : 'Cliquer pour copier le code de partage'}
                                        >
                                            {isCopied
                                                ? <Check size={13} />
                                                : <Copy size={13} />}
                                            {itinerary.shareCode}
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            className="db-add-row"
                            onClick={() => {
                                createNew();
                                const { currentId } = useRouteStore.getState();
                                if (currentId) navigate(`/editor/${currentId}`);
                            }}
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>Nouveau trajet</span>
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
}
