import './style.css';
import './reference.css';
import './voxel.css';
import './social.css';
import './styles/sprites.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/menu.css';
import {Session} from './session.js';
import {socialUI} from './social-ui.js';
import {hydrateIcons} from './icons.js';
import {AudioSystem} from './audio.js';
import {MusicPlayer, decorateFestival} from './music.js';
import {$, toast} from './dom.js';
import {Stage} from './stage.js';
import {Game} from './game.js';
import {bindControls} from './controls.js';

hydrateIcons();

let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {getItem: () => null, setItem: () => {}};
}

const session = new Session(storage, {url: import.meta.env.VITE_ONLINE_URL});
const audio = new AudioSystem(session.data.muted);
const music = new MusicPlayer(session.data.muted, () => audio.fahh());
decorateFestival();

const game = new Game({session, stage: new Stage($('world')), audio, music});
bindControls(game);

session.onChange = data => {
  game.save = data;
  game.refreshUI();
  game.social?.render();
};

game.start();
game.social = socialUI(session, {
  toast,
  onRoom: room => game.duelCtl.handleRoom(room),
  onLeave: () => {
    game.duel = null;
    game.home();
  },
});
session.init();
game.begin();
