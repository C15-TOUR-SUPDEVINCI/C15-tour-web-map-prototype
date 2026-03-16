import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import './ResetPassword.css';


export default function ResetPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    
    return (
        <div className="reset-password-container">
            <div className="reset-password-wrapper">
                {/* <header className="reset-password-header">
                    <div className="reset-password-logo-container">
                        <img src={logoImg} alt="Tour 95!" className="reset-password-logo" />
                    </div>
                </header> */}

                <div className="reset-password-card">
                    <div className="reset-password-card-header">
                        <h1 className="reset-password-title">Réinitialisation du mot de passe</h1>
                        <p className="reset-password-subtitle">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
                    </div>

                    <form
                        className="reset-password-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate('/login');
                        }}
                    >
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Button type="submit" className="login-button">
                            Envoyer le lien
                        </Button>
                    </form>

                    <div className="reset-password-footer">
                        <p>
                            <a href="/login" className="reset-password-link">
                                Retour à la connexion
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}