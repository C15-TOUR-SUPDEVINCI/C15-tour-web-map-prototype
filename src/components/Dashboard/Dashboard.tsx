import { useEffect } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { Plus, Map, Calendar, Trash2, Edit3, Navigation, UserPlus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
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
    const logout = useAuthStore((state) => state.logout);

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

    return (
        <div className="dashboard-container">
            <nav className="dashboard-navbar">
                <div className="navbar-content">
                    <div className="navbar-left">
                        <img src={logoImg} alt="Tour 95!" className="navbar-logo" />
                    </div>
                    <div className="navbar-right">
                        <button 
                            className="nav-action-btn"
                            onClick={() => navigate('/signup')}
                            title="Gérer les utilisateurs"
                        >
                            <UserPlus size={20} />
                            <span>Utilisateurs</span>
                        </button>
                        <button 
                            className="nav-action-btn logout"
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            title="Se déconnecter"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="dashboard-wrapper">
                <header className="dashboard-header">
                    <div className="header-info">
                        <h1 className="dashboard-title">Mes Itinéraires</h1>
                        <p className="dashboard-description">Gérez vos trajets et points d'intérêt</p>
                    </div>
                </header>

                <div className="itinerary-list">
                    {itineraries.map((itinerary) => {
                        const waypointCount = itinerary.waypoints.length;
                        return (
                            <div 
                                key={itinerary.id} 
                                className="itinerary-row"
                                onClick={() => {
                                    openItinerary(itinerary.id);
                                    navigate(`/editor/${itinerary.id}`);
                                }}
                            >
                                <div className="row-icon">
                                    <Navigation size={20} />
                                </div>
                                
                                <div className="row-main">
                                    <h3 className="itinerary-name">{itinerary.name}</h3>
                                    <div className="itinerary-meta-row">
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

                                <div className="row-actions">
                                    <button 
                                        className="row-action-btn edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openItinerary(itinerary.id);
                                            navigate(`/editor/${itinerary.id}`);
                                        }}
                                        title="Modifier"
                                    >
                                        <Edit3 size={18} />
                                        <span>Modifier</span>
                                    </button>
                                    <button
                                        className="row-action-btn delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Voulez-vous vraiment supprimer cet itinéraire ?')) {
                                                deleteItinerary(itinerary.id);
                                            }
                                        }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <button
                        className="create-row"
                        onClick={() => {
                            createNew();
                            const { currentId } = useRouteStore.getState();
                            if (currentId) navigate(`/editor/${currentId}`);
                        }}
                    >
                        <div className="create-row-content">
                            <Plus size={24} />
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
