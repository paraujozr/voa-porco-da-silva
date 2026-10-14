(function (Voa) {
    'use strict';

    // localStorage pode lançar exceção (modo privado, bloqueio de cookies etc.).
    function readNumber(key) {
        try {
            return Number(localStorage.getItem(key)) || 0;
        } catch (_) {
            return 0;
        }
    }

    function writeNumber(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (_) {
            // ignora: o recorde só não será persistido
        }
    }

    Voa.storage = {readNumber, writeNumber};
})(window.Voa = window.Voa || {});
