import { useState, useEffect, useMemo } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Plus, Trash2, X,
    UserPlus, UploadCloud, Loader2, LogOut,
    Search, ArrowUpDown, ArrowDown, ArrowUp,
    Pin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { publishItinerary } from '../../services/api.service';
import type { Itinerary } from '../../domain';
import './Dashboard.css';
import logoImg from '../../assets/logo-tour95.png';

const PILL_COLORS = ['#bb487c', '#e07b4a', '#4a9ee0', '#6abf69', '#a05cc8', '#d4a843'];
type SortKey = 'date' | 'name' | 'steps';

// Fonction simple pour avoir un hash numérique à partir d'une string (pour fixer la couleur)
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
    
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const [isPublishing, setIsPublishing] = useState<string | null>(null);
    const [publishedIds, setPublishedIds] = useState<Set<string>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('c15-published-ids') ?? '[]') as string[]); }
        catch { return new Set(); }
    });
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem('c15-pinned-ids') ?? '[]') as string[]); }
        catch { return new Set(); }
    });
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => { loadAll(); }, [loadAll]);

    useEffect(() => {
        localStorage.setItem('c15-published-ids', JSON.stringify([...publishedIds]));
    }, [publishedIds]);

    useEffect(() => {
        localStorage.setItem('c15-pinned-ids', JSON.stringify([...pinnedIds]));
    }, [pinnedIds]);

    const handleSortClick = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const filtered = useMemo(() => {
        let list = [...itineraries];
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(it => it.name.toLowerCase().includes(q));
        }
        
        // Tri
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortKey === 'steps') cmp = a.waypoints.length - b.waypoints.length;
            else cmp = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
            return sortDir === 'asc' ? cmp : -cmp;
        });

        // Les épinglés vont toujours en haut
        const pinned = list.filter(it => pinnedIds.has(it.id));
        const unpinned = list.filter(it => !pinnedIds.has(it.id));
        return [...pinned, ...unpinned];
    }, [itineraries, search, sortKey, sortDir, pinnedIds]);

    const handlePublish = async (itinerary: Itinerary) => {
        if (!token) { alert('Vous devez être connecté pour publier.'); return; }
        setIsPublishing(itinerary.id);
        try {
            if (!user?.id) throw new Error('ID utilisateur manquant.');
            await publishItinerary(token, itinerary, user.id);
            setPublishedIds(prev => new Set([...prev, itinerary.id]));
        } catch (error: unknown) {
            alert(`❌ Erreur : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        } finally {
            setIsPublishing(null);
        }
    };

    const formatDate = (d: string) => {
        const date = new Date(d);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return "Hier";
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleOpen = (id: string) => { openItinerary(id); navigate(`/editor/${id}`); };

    const togglePin = (id: string) => {
        setPinnedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); } else { next.add(id); }
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
                {/* Navbar */}
                <nav className="db-navbar">
                    <div className="db-navbar-logo">
                        <img src={logoImg} alt="C15 Tour" />
                    </div>
                    <div className="db-navbar-actions">
                        <button className="db-nav-btn" onClick={() => navigate('/signup')}>
                            <UserPlus size={14} /><span>Utilisateur</span>
                        </button>
                        <button className="db-nav-btn db-nav-btn--logout" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut size={14} /><span>Déconnexion</span>
                        </button>
                        {user?.email && (
                            <div className="db-user-pill" title={user.email}>
                                <span className="db-user-email">{user.email}</span>
                                <div className="db-user-avatar">{userInitials}</div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Content zone */}
                <main className="db-main">
                    <div className="db-content">

                        {/* ── Toolbar (barre de recherche + tri) ── */}
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
                                {(['date', 'name', 'steps'] as SortKey[]).map((key) => {
                                    const labels: Record<SortKey, string> = { date: 'Date', name: 'Nom', steps: 'Étapes' };
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

                        {/* ── Itinéraires (cartes séparées) ── */}
                        {filtered.length === 0 && (
                            <p className="db-empty">Aucun trajet trouvé.</p>
                        )}

                        {filtered.map((itinerary, idx) => {
                            const count = itinerary.waypoints.length;
                            const color = PILL_COLORS[hashString(itinerary.id) % PILL_COLORS.length];
                            const isPinned = pinnedIds.has(itinerary.id);
                            const isPublished = publishedIds.has(itinerary.id);

                            return (
                                <div 
                                    key={itinerary.id} 
                                    className="db-row"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Overlay flou "Modifier" - Apparaît au hover sur toute la div .db-row */}
                                    <div className="db-edit-overlay">
                                        <span className="db-edit-text">+ Modifier</span>
                                    </div>

                                    {/* Zone principale cliquable */}
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
                                        <span className="db-row-meta">{count} {count > 1 ? 'étapes' : 'étape'}</span>
                                        <span className="db-row-meta">{formatDate(itinerary.lastModified)}</span>
                                        <span className={isPublished ? 'db-badge-synced' : 'db-badge-local'}>
                                            {isPublished ? 'Serveur' : 'Local'}
                                        </span>
                                    </div>

                                    {/* Zone boutons d'actions */}
                                    <div className="db-row-actions">
                                        {/* Épingle */}
                                        <button
                                            className={`db-action-btn db-action-btn--pin${isPinned ? ' is-pinned' : ''}`}
                                            onClick={() => togglePin(itinerary.id)}
                                            title={isPinned ? 'Désépingler' : 'Épingler en haut'}
                                        >
                                            <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
                                        </button>
                                        {/* Cloud */}
                                        <button
                                            className={`db-action-btn db-action-btn--publish${isPublished ? ' is-published' : ''}`}
                                            onClick={() => { if (!isPublished) handlePublish(itinerary); }}
                                            title={isPublished ? 'Déjà sur le serveur' : 'Envoyer sur le serveur'}
                                            disabled={isPublishing === itinerary.id || isPublished}
                                        >
                                            {isPublishing === itinerary.id
                                                ? <Loader2 size={16} className="spin" />
                                                : <UploadCloud size={16} />}
                                        </button>
                                        {/* Poubelle */}
                                        <button
                                            className="db-action-btn db-action-btn--delete"
                                            onClick={() => {
                                                if (confirm('Supprimer cet itinéraire ?')) deleteItinerary(itinerary.id);
                                            }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* ── Bouton Nouveau trajet — carte séparée ── */}
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
