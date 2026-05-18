import { useState, useEffect } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Plus, Map, Calendar, Trash2, Edit3, Navigation, UserPlus, UploadCloud, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { publishItinerary } from '../../services/api.service';
import './Dashboard.css';
import logoImg from '../../assets/logo-tour95.png';
import vanIllustration from '../../assets/van-illustration.png';

export function Dashboard() {
    const navigate = useNavigate();
    const itineraries = useRouteStore((state) => state.itineraries);
    const loadAll = useRouteStore((state) => state.loadAll);
    const createNew = useRouteStore((state) => state.createNew);
    const openItinerary = useRouteStore((state) => state.openItinerary);
    const deleteItinerary = useRouteStore((state) => state.deleteItinerary);

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    
    const [isPublishing, setIsPublishing] = useState<string | null>(null);

    const handlePublish = async (itinerary: any) => {
        if (!token) {
            alert("Vous devez être connecté pour publier un itinéraire.");
            return;
        }

        setIsPublishing(itinerary.id);
        try {
            // L'API demande le userId (organizer), on utilise l'ID du user connecté récupéré lors du login
            if (!user?.id) {
                throw new Error("ID utilisateur manquant. Merci de vous déconnecter et de vous reconnecter pour rafraîchir votre profil.");
            }
            
            await publishItinerary(token, itinerary, user.id);
            alert("✅ Itinéraire publié avec succès !");
        } catch (error: any) {
            console.error("Erreur de publication", error);
            alert(`❌ Erreur lors de la publication : ${error.message}`);
        } finally {
            setIsPublishing(null);
        }
    };

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCardKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            openItinerary(id);
            navigate(`/editor/${id}`);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-wrapper">
                <header className="dashboard-header">
                    <div className="header-content">
                        <div className="dashboard-logo-container">
                            <img src={logoImg} alt="Tour 95!" className="dashboard-logo" />
                        </div>
                        <button 
                            className="admin-action-btn"
                            onClick={() => navigate('/signup')}
                            title="Créer un nouvel utilisateur"
                        >
                            <UserPlus size={18} />
                            <span>Utilisateurs</span>
                        </button>
                        <button 
                            className="admin-action-btn logout"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            title="Se déconnecter"
                        >
                            <LogOut size={18} />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </header>

                <div className="itinerary-grid">
                    {itineraries.map((itinerary) => {
                        const waypointCount = itinerary.waypoints.length;
                        return (
                            <div key={itinerary.id} className="itinerary-card">
                                <div className="card-header">
                                    <div className="card-icon">
                                        <Navigation size={20} />
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="card-action-btn publish"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePublish(itinerary);
                                            }}
                                            title="Publier sur le serveur"
                                            disabled={isPublishing === itinerary.id}
                                        >
                                            {isPublishing === itinerary.id ? (
                                                <Loader2 size={16} className="spin" />
                                            ) : (
                                                <UploadCloud size={16} />
                                            )}
                                        </button>
                                        <button
                                            className="card-action-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) {
                                                    deleteItinerary(itinerary.id);
                                                }
                                            }}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="card-body"
                                    onClick={() => {
                                        openItinerary(itinerary.id);
                                        navigate(`/editor/${itinerary.id}`);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => handleCardKeyDown(e, itinerary.id)}
                                >
                                    <h3 className="itinerary-name">{itinerary.name}</h3>

                                    <div className="itinerary-meta">
                                        <div className="meta-item">
                                            <Calendar size={14} />
                                            <span>{formatDate(itinerary.lastModified)}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Map size={14} />
                                            <span>{waypointCount} {waypointCount > 1 ? 'étapes' : 'étape'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="card-footer"
                                    onClick={() => {
                                        openItinerary(itinerary.id);
                                        navigate(`/editor/${itinerary.id}`);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => handleCardKeyDown(e, itinerary.id)}
                                >
                                    <button className="edit-link" tabIndex={-1}>
                                        <Edit3 size={16} />
                                        Modifier
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        className="create-card"
                        onClick={() => {
                            createNew();
                            const { currentId } = useRouteStore.getState();
                            if (currentId) navigate(`/editor/${currentId}`);
                        }}
                    >
                        <div className="create-card-content">
                            <Plus size={48} />
                            <span>Nouveau Trajet</span>
                        </div>
                    </button>
                </div>
            </div>
            <div className="dashboard-illustration-container">
                <img src={vanIllustration} alt="" className="van-illustration" />
            </div>
        </div>
    );
}
