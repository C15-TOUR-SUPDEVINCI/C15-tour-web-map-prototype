import { useState } from 'react';
import { useRouteStore } from '../../../store/useRouteStore';
import { Plus, Trash2, Edit2, Check, X, Folder } from 'lucide-react';
import './GroupManager.css';

export function GroupManager() {
    const groups = useRouteStore((state) => state.groups);
    const addGroup = useRouteStore((state) => state.addGroup);
    const removeGroup = useRouteStore((state) => state.removeGroup);
    const updateGroup = useRouteStore((state) => state.updateGroup);

    const [isAdding, setIsAdding] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAddGroup = () => {
        if (newGroupName.trim()) {
            addGroup(newGroupName.trim());
            setNewGroupName('');
            setIsAdding(false);
        }
    };

    const handleStartEdit = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    const handleSaveEdit = () => {
        if (editingId && editingName.trim()) {
            updateGroup(editingId, editingName.trim());
            setEditingId(null);
        }
    };

    return (
        <div className="group-manager">
            <div className="group-manager-header">
                <h3><Folder size={18} /> Gestion des Groupes</h3>
                <button
                    className="icon-button primary"
                    onClick={() => setIsAdding(true)}
                    title="Ajouter un groupe"
                >
                    <Plus size={18} />
                </button>
            </div>

            <div className="group-adding-button">
                <button
                    className="icon-button primary"
                    onClick={() => setIsAdding(true)}
                    title="Ajouter un groupe"
                >
                    <Plus size={18} />
                </button>
            </div>

            {isAdding && (
                <div className="group-edit-row">
                    <input
                        type="text"
                        className="group-input"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Nom du groupe..."
                        autoFocus
                    />
                    <button className="icon-button success" onClick={handleAddGroup}><Check size={16} /></button>
                    <button className="icon-button danger" onClick={() => setIsAdding(false)}><X size={16} /></button>
                </div>
            )}

            <div className="group-list">
                {groups.map((group) => (
                    <div key={group.id} className="group-item">
                        {editingId === group.id ? (
                            <div className="group-edit-row">
                                <input
                                    type="text"
                                    className="group-input"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    autoFocus
                                />
                                <button className="icon-button success" onClick={handleSaveEdit}><Check size={16} /></button>
                                <button className="icon-button danger" onClick={() => setEditingId(null)}><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <span className="group-name">{group.name}</span>
                                <div className="group-actions">
                                    <button
                                        className="icon-button"
                                        onClick={() => handleStartEdit(group.id, group.name)}
                                        title="Renommer"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    {group.id !== 'default-group' && (
                                        <button
                                            className="icon-button danger"
                                            onClick={() => removeGroup(group.id)}
                                            title="Supprimer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
