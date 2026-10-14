(function (Voa) {
    'use strict';

    const CHARACTERS = [
        {
            id: 'pedreiro',
            name: 'Zé da Obra',
            desc: 'Mestre de obras raiz. Capacete amarelo de engenheiro e colete refletivo!',
            skinColor: 0xff9ebb,
            shirtColor: 0xf97316, // Laranja refletivo
            hatType: 'hardhat',
            crashMsg: 'Caiu o reboco! Bateu direto no andaime!',
        },
        {
            id: 'futebol',
            name: 'Porco Craque 10',
            desc: 'Camisa 10 da Amarelinha e faixa "100% Jesus" na testa rumo ao Hexa!',
            skinColor: 0xffb3c6,
            shirtColor: 0xffdf00, // Amarelo Seleção
            hatType: 'headband',
            crashMsg: 'Foi falta, juiz! Parou na trave adversária!',
        },
        {
            id: 'praia',
            name: 'Rei do Mate & Queijo',
            desc: 'Chapéu de palha e óculos Juliet espelhado nas areias de Ipanema!',
            skinColor: 0xf48fb1,
            shirtColor: 0x38bdf8, // Azul praia
            hatType: 'strawhat',
            crashMsg: 'Derrubou o galão de mate na areia quente!',
        },
        {
            id: 'motoboy',
            name: 'Cachorro Louco Delivery',
            desc: 'Capacete fechado e bag vermelha de entrega nas costas. Buzina que passa!',
            skinColor: 0xffa6c1,
            shirtColor: 0x1e293b, // Jaqueta preta
            hatType: 'helmet_bag',
            crashMsg: 'Atrasou a entrega da pizza no corredor!',
        },
    ];

    Voa.CHARACTERS = CHARACTERS;
})(window.Voa = window.Voa || {});
