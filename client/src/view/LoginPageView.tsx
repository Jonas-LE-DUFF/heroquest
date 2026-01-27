import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPageView.css";
import { Game } from "../POO/classes/Server/Game";
interface LoginPageProps {
	socket: any;
}

const LoginPage: React.FC<LoginPageProps> = ({ socket }) => {
	const navigate = useNavigate();
	const [playerName, setPlayerName] = useState("a");
	const [gameName, setGameName] = useState("a");
	const [role, setRole] = useState<"hero" | "game-master">("hero");

	const handleJoinGame = (e: React.SubmitEvent) => {
		e.preventDefault();

		if (!playerName.trim() || !gameName.trim()) {
			alert("Veuillez remplir tous les champs");
			return;
		}

		console.log("Joining game:", gameName, "as", playerName, "with role", role);
		// Émettre l'événement de connexion au serveur
		socket.emit("join-game", { gameName, playerName, role }, 
			(response: { success: boolean, error?: string }) => {
			if (!response.success) {
				alert(`Erreur: ${response.error}`);
			}
		});

		// Écouter la réponse du serveur
		socket.once(
			"join-success",
			(data: { playerId: string; game: Game }
			) => {

				navigate("/lobby", {
					state: {
						playerName: playerName,
						game: data.game,
					},
				});
			}
		);
	};

	return (
		<div className="login-page">
			<h1>HeroQuest Online</h1>
			<form onSubmit={handleJoinGame} className="login-form">
				<div className="form-group">
					<label>Votre nom :</label>
					<input
						type="text"
						value={playerName}
						onChange={(e) => setPlayerName(e.target.value)}
						placeholder="Ex: Jean"
						required
					/>
				</div>

				<div className="form-group">
					<label>Nom de la partie :</label>
					<input
						type="text"
						value={gameName}
						onChange={(e) => setGameName(e.target.value)}
						placeholder="Ex: partie-1"
						required
					/>
				</div>

				<div className="form-group">
					<label>Rôle :</label>
					<select
						value={role}
						onChange={(e) => setRole(e.target.value as "hero" | "game-master")}
					>
						<option value="hero">Héros</option>
						<option value="game-master">Maître du Jeu</option>
					</select>
				</div>

				<button type="submit" className="join-button">
					Rejoindre la partie
				</button>
			</form>

			<div className="game-info">
				<h3>Comment jouer ?</h3>
				<p>• Créez une partie avec un ID unique</p>
				<p>• Partagez l'ID avec vos amis</p>
				<p>• Un joueur doit être le Maître du Jeu</p>
			</div>
		</div>
	);
};

export default LoginPage;
