class Blackjack {
    constructor() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameOver = false;
        this.balance = 1000;
        this.currentBet = 0;
        this.animationSpeed = 800;
        this.dealingOffset = 300;
        
        this.startGame = this.startGame.bind(this);
        this.hit = this.hit.bind(this);
        this.stand = this.stand.bind(this);
        this.double = this.double.bind(this);
        
        this.initializeButtons();
        this.updateBalance();
        this.canDouble = false;
    }

    initializeButtons() {
        const dealButton = document.getElementById('deal-button');
        const hitButton = document.getElementById('hit-button');
        const standButton = document.getElementById('stand-button');
        const doubleButton = document.getElementById('double-button');
        
        dealButton.replaceWith(dealButton.cloneNode(true));
        hitButton.replaceWith(hitButton.cloneNode(true));
        standButton.replaceWith(standButton.cloneNode(true));
        doubleButton.replaceWith(doubleButton.cloneNode(true));
        
        document.getElementById('deal-button').addEventListener('click', this.startGame);
        document.getElementById('hit-button').addEventListener('click', this.hit);
        document.getElementById('stand-button').addEventListener('click', this.stand);
        document.getElementById('double-button').addEventListener('click', this.double);
    }

    updateBalance() {
        document.getElementById('balance').textContent = this.balance;
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({ suit, value });
            }
        }
        console.log('Nouveau deck créé, nombre de cartes:', this.deck.length);
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        console.log('Deck mélangé, nombre de cartes:', this.deck.length);
    }

    async startGame() {
        console.log('Démarrage d\'une nouvelle partie');
        const betInput = document.getElementById('bet-amount');
        const betAmount = parseInt(betInput.value);

        if (isNaN(betAmount) || betAmount < 1) {
            this.showMessage('Veuillez entrer une mise valide', 'error');
            return;
        }

        if (betAmount > this.balance) {
            this.showMessage('Solde insuffisant', 'error');
            return;
        }

        // Réinitialiser l'état du jeu
        this.gameOver = false;
        this.currentBet = betAmount;
        this.balance -= this.currentBet;
        this.updateBalance();
        this.playerHand = [];
        this.dealerHand = [];

        // Créer un nouveau deck et le mélanger
        this.createDeck();
        this.shuffleDeck();
        console.log('Nombre de cartes dans le deck après mélange:', this.deck.length);
        
        // Réinitialiser l'affichage
        document.getElementById('message').className = 'message';
        const dealerCards = document.getElementById('dealer-cards');
        const playerCards = document.getElementById('player-cards');
        dealerCards.innerHTML = '';
        playerCards.innerHTML = '';
        
        // Désactiver les boutons pendant la distribution
        this.setButtonsState(true);
        document.getElementById('bet-amount').disabled = true;
        
        // Distribuer les cartes
        await this.dealInitialCards();
        
        // Activer les boutons appropriés si pas de Blackjack
        if (!this.gameOver) {
            document.getElementById('hit-button').disabled = false;
            document.getElementById('stand-button').disabled = false;
            document.getElementById('deal-button').disabled = true;
            this.canDouble = true;
            document.getElementById('double-button').disabled = this.currentBet > this.balance;
        }
    }

    async dealInitialCards() {
        const dealerCards = document.getElementById('dealer-cards');
        const playerCards = document.getElementById('player-cards');
        
        dealerCards.innerHTML = '';
        playerCards.innerHTML = '';

        // Première carte du joueur
        const playerCard1 = this.deck.pop();
        this.playerHand.push(playerCard1);
        await this.animateCardDeal(playerCard1, playerCards, false);
        this.updateScores(); // Mise à jour du score après la première carte
        await new Promise(resolve => setTimeout(resolve, this.dealingOffset));

        // Première carte du croupier (cachée)
        const dealerCard1 = this.deck.pop();
        this.dealerHand.push(dealerCard1);
        await this.animateCardDeal(dealerCard1, dealerCards, true);
        this.updateScores();
        await new Promise(resolve => setTimeout(resolve, this.dealingOffset));

        // Deuxième carte du joueur
        const playerCard2 = this.deck.pop();
        this.playerHand.push(playerCard2);
        await this.animateCardDeal(playerCard2, playerCards, false);
        this.updateScores();
        await new Promise(resolve => setTimeout(resolve, this.dealingOffset));

        // Deuxième carte du croupier
        const dealerCard2 = this.deck.pop();
        this.dealerHand.push(dealerCard2);
        await this.animateCardDeal(dealerCard2, dealerCards, false);
        this.updateScores();

        await this.checkForBlackjack();
    }

    async checkForBlackjack() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        const playerHasBlackjack = playerScore === 21 && this.playerHand.length === 2;
        const dealerHasBlackjack = dealerScore === 21 && this.dealerHand.length === 2;

        if (playerHasBlackjack || dealerHasBlackjack) {
            // Retourner la carte cachée du croupier
            const firstDealerCard = document.querySelector('#dealer-cards .card.flipped');
            if (firstDealerCard) {
                firstDealerCard.classList.add('flipping');
                await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
                firstDealerCard.classList.remove('flipped', 'flipping');
                this.updateScores(); // Mise à jour du score après le retournement
            }

            if (playerHasBlackjack && dealerHasBlackjack) {
                await this.endGame('Égalité ! Blackjack pour les deux !', 'draw');
            } else if (playerHasBlackjack) {
                const blackjackPayout = this.currentBet * 2.5;
                this.balance += blackjackPayout;
                await this.endGame(`Blackjack ! Vous gagnez ${blackjackPayout.toFixed(2)}€ !`, 'success');
            } else if (dealerHasBlackjack) {
                await this.endGame('Le croupier a un Blackjack !', 'error');
            }

            return true;
        }
        return false;
    }

    createCardElement(card, isHidden = false) {
        if (!card) {
            console.error('Card is undefined:', card);
            return document.createElement('div');
        }

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.suit === '♥' || card.suit === '♦' ? 'red' : 'black'}`;
        
        const front = document.createElement('div');
        front.className = 'front';
        front.textContent = `${card.suit}${card.value}`;
        
        const back = document.createElement('div');
        back.className = 'back';
        back.textContent = '🂠';
        
        cardDiv.appendChild(front);
        cardDiv.appendChild(back);
        
        if (isHidden) {
            setTimeout(() => {
                cardDiv.classList.add('flipped');
            }, 50);
        }
        
        return cardDiv;
    }

    async animateCardDeal(card, container, isHidden) {
        const cardElement = this.createCardElement(card, isHidden);
        
        cardElement.style.opacity = '0';
        container.appendChild(cardElement);
        
        cardElement.offsetHeight;
        
        cardElement.classList.add('dealing');
        
        return new Promise(resolve => {
            setTimeout(() => {
                cardElement.classList.remove('dealing');
                cardElement.style.opacity = '1';
                resolve();
            }, this.animationSpeed);
        });
    }

    async hit() {
        if (this.gameOver) return;
        
        this.canDouble = false;
        document.getElementById('double-button').disabled = true;

        const card = this.deck.pop();
        this.playerHand.push(card);
        await this.animateCardDeal(card, document.getElementById('player-cards'), false);
        this.updateScores(); // Mise à jour immédiate du score

        const playerScore = this.calculateScore(this.playerHand);
        if (playerScore > 21) {
            await this.endGame('Le croupier gagne! Vous avez dépassé 21.', 'error');
        }
    }

    async stand() {
        if (this.gameOver) return;
        
        this.setButtonsState(true);
        
        // Retourner la première carte du croupier
        const firstDealerCard = document.querySelector('#dealer-cards .card.flipped');
        if (firstDealerCard) {
            firstDealerCard.classList.add('flipping');
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
            firstDealerCard.classList.remove('flipped', 'flipping');
            this.updateScores(); // Mise à jour du score après le retournement
        }

        // Le croupier tire des cartes si nécessaire
        while (this.calculateScore(this.dealerHand) < 17) {
            const card = this.deck.pop();
            this.dealerHand.push(card);
            await this.animateCardDeal(card, document.getElementById('dealer-cards'), false);
            this.updateScores();
            await new Promise(resolve => setTimeout(resolve, this.animationSpeed));
        }

        this.determineWinner();
    }

    determineWinner() {
        const dealerScore = this.calculateScore(this.dealerHand);
        const playerScore = this.calculateScore(this.playerHand);
        
        let message;
        let type;
        
        if (dealerScore > 21) {
            message = `Vous gagnez! Le croupier a dépassé 21 (${dealerScore})`;
            type = 'success';
        } else if (dealerScore > playerScore) {
            message = `Le croupier gagne! ${dealerScore} contre ${playerScore}`;
            type = 'error';
        } else if (dealerScore < playerScore) {
            message = `Vous gagnez! ${playerScore} contre ${dealerScore}`;
            type = 'success';
        } else {
            message = `Égalité! ${playerScore} partout`;
            type = 'draw';
        }
        
        this.endGame(message, type);
    }

    setButtonsState(disabled) {
        document.getElementById('hit-button').disabled = disabled;
        document.getElementById('stand-button').disabled = disabled;
        document.getElementById('double-button').disabled = disabled;
        document.getElementById('deal-button').disabled = disabled;
    }

    updateScores() {
        const dealerScoreElement = document.getElementById('dealer-score');
        const playerScoreElement = document.getElementById('player-score');

        // Score du croupier
        if (this.gameOver || !document.querySelector('#dealer-cards .card.flipped')) {
            // Si le jeu est terminé OU si la première carte n'est plus retournée
            dealerScoreElement.textContent = this.calculateScore(this.dealerHand);
        } else {
            // Ne montrer que le score des cartes visibles du croupier
            const visibleCards = this.dealerHand.slice(1);
            dealerScoreElement.textContent = this.calculateScore(visibleCards);
        }
        
        // Score du joueur
        playerScoreElement.textContent = this.calculateScore(this.playerHand);
    }

    async double() {
        if (this.gameOver || !this.canDouble) return;

        if (this.balance < this.currentBet) {
            this.showMessage('Solde insuffisant pour doubler', 'error');
            return;
        }

        this.balance -= this.currentBet;
        this.currentBet *= 2;
        this.updateBalance();

        this.setButtonsState(true);

        const card = this.deck.pop();
        this.playerHand.push(card);
        await this.animateCardDeal(card, document.getElementById('player-cards'), false);
        this.updateScores(); // Mise à jour immédiate du score

        const playerScore = this.calculateScore(this.playerHand);
        if (playerScore > 21) {
            await this.endGame('Le croupier gagne! Vous avez dépassé 21.', 'error');
        } else {
            await this.stand();
        }
    }

    async endGame(message, type) {
        this.gameOver = true;
        this.canDouble = false;
        this.showMessage(message, type);
        
        if (!message.includes('Blackjack')) {
            if (message.includes('Vous gagnez')) {
                this.balance += this.currentBet * 2;
            } else if (message.includes('Égalité')) {
                this.balance += this.currentBet;
            }
        }
        
        this.updateBalance();
        this.resetButtons();
        this.currentBet = 0;
    }

    getCardHTML(card) {
        const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
        return `<div class="card" style="color: ${color}">${card.suit}${card.value}</div>`;
    }

    updateDisplay(onlyDealerCards = false) {
        const dealerCards = document.getElementById('dealer-cards');
        const playerCards = document.getElementById('player-cards');
        
        const createCardElement = (card, isDealer, isHidden = false, animate = true) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.suit === '' || card.suit === '♦' ? 'red' : 'black'}`;
            
            const front = document.createElement('div');
            front.className = 'front';
            front.textContent = `${card.suit}${card.value}`;
            
            const back = document.createElement('div');
            back.className = 'back';
            back.textContent = '🂠';
            
            cardDiv.appendChild(front);
            cardDiv.appendChild(back);
            
            if (isHidden) {
                cardDiv.classList.add('flipped');
            } else if (animate) {
                cardDiv.classList.add('dealing');
                setTimeout(() => {
                    cardDiv.classList.remove('dealing');
                }, 500);
            }
            
            return cardDiv;
        };

        if (onlyDealerCards) {
            dealerCards.innerHTML = '';
            this.dealerHand.forEach((card, index) => {
                const isNewCard = index >= this.dealerHand.length - (this.dealerHand.length - 2);
                dealerCards.appendChild(createCardElement(card, true, false, isNewCard));
            });
        } else {
            dealerCards.innerHTML = '';
            playerCards.innerHTML = '';
            
            this.dealerHand.forEach((card, index) => {
                const isHidden = !this.gameOver && index === 0;
                dealerCards.appendChild(createCardElement(card, true, isHidden, true));
            });
            
            this.playerHand.forEach(card => {
                playerCards.appendChild(createCardElement(card, false, false, true));
            });
        }
        
        if (this.gameOver) {
            document.getElementById('dealer-score').textContent = this.calculateScore(this.dealerHand);
            const firstCard = dealerCards.querySelector('.card.flipped');
            if (firstCard) {
                firstCard.classList.add('flipping');
                setTimeout(() => {
                    firstCard.classList.remove('flipped');
                    firstCard.classList.remove('flipping');
                }, 600);
            }
        } else {
            document.getElementById('dealer-score').textContent = '?';
        }
        document.getElementById('player-score').textContent = this.calculateScore(this.playerHand);
    }

    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.value === 'A') {
                aces++;
            } else if (card.value === 'J' || card.value === 'Q' || card.value === 'K') {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        while (aces > 0) {
            if (score + 11 <= 21) {
                score += 11;
            } else {
                score += 1;
            }
            aces--;
        }
        
        return score;
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = message;
        messageElement.className = 'message';
        if (type) {
            messageElement.classList.add(type);
            messageElement.classList.add('visible');
        }
    }

    hasBlackjack(hand) {
        return this.calculateScore(hand) === 21 && hand.length === 2;
    }

    resetButtons() {
        document.getElementById('hit-button').disabled = true;
        document.getElementById('stand-button').disabled = true;
        document.getElementById('double-button').disabled = true;
        document.getElementById('deal-button').disabled = false;
        document.getElementById('bet-amount').disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé');
    window.game = new Blackjack();
});