(function (Voa) {
    'use strict';

    // Camada de UI: único módulo que conhece os ids do HTML.
    const $ = (id) => document.getElementById(id);

    const el = {
        hud: $('hud'),
        scoreVal: $('score-val'),
        bestVal: $('best-val'),
        mainMenu: $('main-menu'),
        charName: $('char-name'),
        charDesc: $('char-desc'),
        prevChar: $('prev-char'),
        nextChar: $('next-char'),
        startBtn: $('start-btn'),
        gameOver: $('game-over'),
        goPhrase: $('go-phrase'),
        finalScore: $('final-score'),
        finalBest: $('final-best'),
        retryBtn: $('retry-btn'),
        menuBtn: $('menu-btn'),
    };

    // Os botões ficam sobre a tela; o clique neles não deve virar "bater asas".
    function onButton(button, handler) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            handler();
        });
    }

    const ui = {
        on: {
            prevCharacter: (fn) => onButton(el.prevChar, fn),
            nextCharacter: (fn) => onButton(el.nextChar, fn),
            start: (fn) => onButton(el.startBtn, fn),
            retry: (fn) => onButton(el.retryBtn, fn),
            backToMenu: (fn) => onButton(el.menuBtn, fn),
        },

        // Topo do painel do menu, em px (usado para enquadrar o porco no mobile).
        menuTop() {
            return el.mainMenu.getBoundingClientRect().top;
        },

        setBest(value) {
            el.bestVal.innerText = value;
        },

        setScore(value) {
            el.scoreVal.innerText = value;
        },

        showCharacter({ name, desc }) {
            el.charName.innerText = name;
            el.charDesc.innerText = desc;
        },

        showMenu() {
            document.body.classList.add('menu-open');
            el.gameOver.style.display = 'none';
            el.hud.style.display = 'none';
            el.mainMenu.style.display = 'block';
        },

        showPlaying() {
            document.body.classList.remove('menu-open');
            document.activeElement?.blur();
            el.mainMenu.style.display = 'none';
            el.gameOver.style.display = 'none';
            el.hud.style.display = 'flex';
        },

        showGameOver({ phrase, score, best }) {
            el.goPhrase.innerText = phrase;
            el.finalScore.innerText = score;
            el.finalBest.innerText = best;
            el.gameOver.style.display = 'block';
        },
    };

    Voa.ui = ui;
})(window.Voa = window.Voa || {});
