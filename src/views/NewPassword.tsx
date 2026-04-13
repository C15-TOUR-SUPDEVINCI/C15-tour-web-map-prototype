import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './NewPassword.css';
import logoImg from '../assets/logo-tour95.png';

export default function NewPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        navigate('/login');
    };

    return (
        <div className="new-password-container">
            <div className="new-password-wrapper">
                <header className="new-password-header">
                    <div className="new-password-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="new-password-logo" />
                    </div>
                </header>

                <div className="new-password-card">
                    <div className="new-password-card-header">
                        <h1 className="new-password-title">Nouveau mot de passe</h1>
                        <p className="new-password-subtitle">Choisissez un nouveau mot de passe pour votre compte.</p>
                    </div>

                    <form className="new-password-form" onSubmit={handleSubmit}>
                        <Input
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError('');
                            }}
                            required
                        />

                        <Input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value);
                                setError('');
                            }}
                            required
                        />

                        {error && <p className="new-password-error">{error}</p>}

                        <Button type="submit">
                            Enregistrer le mot de passe
                        </Button>
                    </form>

                    <div className="new-password-footer">
                        <p>
                            <a href="/login" className="new-password-link">
                                Retour à la connexion
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
