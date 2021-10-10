// Global vars
let POINTS4LINE = [100, 70],
    LINEINDEX = 0;
    PICKSTHRESHOLD = 75,
    PICK = 0;

// clicked elements
class SingleAction {
    constructor(player, elem) {
        this.player = player;
        this.element = elem;
        this.init();
    }

    restore() {
        this.player.reset();
        $(this.element).css('display', 'table-row');
    }

    init() {
        $(this.element).css('display', 'none');
    }
}

class GlobalActions {
    constructor() {
        this.actions = [];
    }

    all() {
        return this.actions;
    }

    enqueue(player, elem) {
        const action = new SingleAction(player, elem);
        this.actions.push(action);
    }

    dequeue() {
        return this.actions.pop();
    }

    size() {
        return this.actions.length;
    }
}

const Actions = new GlobalActions();

class Player {
    constructor(idx, row) {
        this.data = row;
        this.positions = [];
        this.rank = idx;
        this.espnRank = 0;
        this.name = '';
        this.rate = 0;
        this.games = 0;
        this.note = '';
        this.total = 0;
        this.playoffSchedule = '';
        this.superGone = false;
        this.probablyGone = false;
        this.undervalued = false;
        this.undraftable = true;
        this.unsure = true;
        this.valid = true;
        this.primedForDeletion = false;
        this.isDeleted = false;
        
        this.init();
    }

    delete() {
        this.isDeleted = true;
    }

    getName() {
        for (let i = 0; i <= 4; i++) {
            if (this.data[i] !== '') {
                return this.data[i];
            }
        }

        return '';
    }

    getPositionGrid() {
        const grid = [];

        for (let i = 0; i <= 4; i++) {
            grid.push(this.data[i] !== '' ? 1 : 0);
        }

        return grid;
    }

    prime() {
        this.primedForDeletion = true;
    }

    reset() {
        this.primedForDeletion = false;
        this.isDeleted = false;
    }

    init() {
        this.name = this.getName();
        if (this.name === '') {
            this.valid = false;
            return;
        }
        this.positions = this.getPositionGrid();
        this.espnRank = this.data[10]
        this.rate = this.data[5];
        this.games = this.data[6];
        this.total = this.data[7];
        this.note = this.data[8];
        this.playoffSchedule = this.data[11] + ' / ' + this.data[12].replace('.', '-');
        this.superGone = this.data[9] === 'gg';
        this.probablyGone = this.data[9] === 'g';
        this.undervalued = this.data[9] === 'y';
        this.undraftable = this.data[9] === 'n';
        this.unsure = this.data[9] === 'u';
    }
}

class PlayersList {
    constructor() {
        this.players = [];
        this.table = $('#table');
    }

    addPlayer(playerIdx, playerRow) {
        this.players.push(new Player(playerIdx, playerRow));
    }

    all() {
        return this.players;
    }

    findByName(name) {
        for (let p of this.players) {
            if (p.name === name) {
                return p;
            }
        }
        return null;
    }

    getAllTableRows() {
        return this.table && this.table.children().first().children();
    }

    clearTableRowStyles(max = 40) {
        const rows = this.getAllTableRows();
        let total = max;

        for (let i = 1; i < rows.length; i++) {
            if (rowIsVisible(rows[i])) {
                $(rows[i]).css('box-shadow', 'none');

                if (--total === 0) {
                    return;
                }
            }
        }
    }

    findGroupings(max = 40, within = 15) {
        let grouped = false,
            groupNumber = 0,
            // none, yellow, blue, green, orange
            GROUPCOLOR = ['', '#ffeb3b', '#03a9f4', '#4dcd41', '#ef9a0e', "#ef9a0e"];

        this.clearTableRowStyles(max + 1);

        const rows = this.getAllTableRows();
        let total = max;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (rowIsVisible(row) && !rowIsLine(row)) {
                if (grouped === true) {
                    $(row).css('box-shadow', 'inset 2px 2px 12px ' + GROUPCOLOR[groupNumber]);
                    console.log('grouped is true: ', groupNumber, GROUPCOLOR, row);
                }

                // check if its close enough to neighbor to start up a group
                const curr = this.findByName($(row).children()[1].textContent),
                    siblingElement = findNextValidSibling(row);

                if (rowIsLine(siblingElement)) {
                    grouped = false;
                    continue;
                }

                let next = this.findByName($(siblingElement).children()[1].textContent);
                if (curr && next && curr.total - within <= next.total) {
                    if (grouped === false) {
                        grouped = true;
                        groupNumber++;
                        if (groupNumber == GROUPCOLOR.length) {
                            groupNumber = 1;
                        }
                    }

                    $(row).css('box-shadow', 'inset 2px 2px 10px ' + GROUPCOLOR[groupNumber]);
                } else {
                    grouped = false;
                }

                if (--total === 0) {
                    return;
                }
            }
        }
        
        // go through html elements in table to remove all box-shadows
        // go through html elements in table
        // if visible check if 
        // compare first to next visible

        // box-shadow: inset 2px 2px 8px #ef9a0e;
    }
}

// parses csv data
const parseData = (list, data) => {
    data.forEach((row, idx) => {
        list.addPlayer(idx + 1, row);
    });
};

const renderPositions = (player, td) => {
    for (let i = 0; i < player.positions.length; i++) {
        const content = player.positions[i] === 1 ? player.name : ' ';
        td += '<td>' + content + '</td>';
    }

    return td;
}

const addLine = (el) => {
    if (!el) {
        $('#table table').append('<tr class="round-divider"><td colspan=\"9\""></td></tr>');   
    } else {
        $(el).first().after(() => {
            const newElement = '<tr class="round-divider"><td colspan=\"9\""></td></tr>';
            return newElement;
        });
        const newLine = el.nextElementSibling;
        $(newLine).click(() => $(newLine).css('display', 'none'));
    }
}

const rowIsHeader = el => {
    return el && el.children.length > 1 && el.children[1].textContent === 'Name';
}

const rowIsVisibleLine = el => {
    return rowIsLine(el) && $(el).css('display') !== 'none';
}

const rowIsLine = el => {
    return el.className === 'round-divider';
}

const rowIsVisible = el => {
    return $(el).css('display') !== 'none';
}

const findPreviousValidSibling = el => {
    let focused = el;
    while (1) {
        const prevSib = focused.previousElementSibling;
        if (!rowIsHeader(prevSib)) {
            if (rowIsVisible(prevSib)) {
                return prevSib;
            }

            focused = prevSib;
        } else {
            return null;
        }
    }

    return null;
}

const findNextValidSibling = el => {
    let focused = el;
    while (focused) {
        const nextSib = focused.nextElementSibling;
        if (rowIsVisible(nextSib)) {
            return nextSib;
        }

        focused = nextSib;
    }

    return null;
}

// inserts line if expected point output is 100 and there is no line
const insertLineIfAppropriate = (el, list) => {
    const prev = findPreviousValidSibling(el);
    const next = findNextValidSibling(el);

    if (!prev || !next || rowIsLine(prev) || rowIsLine(next)) {
        return;
    }

    const prevPlayer = list.findByName(prev.children[1].textContent);
    const nextPlayer = list.findByName(next.children[1].textContent);

    if (prevPlayer.total - POINTS4LINE[LINEINDEX] > nextPlayer.total) {
        addLine(prev);
    }
};

const renderData = list => {
    const players = list.all();
    $('#table').append('<table />');
    $('#table table').append('<tr><td>#</td><td>Name</td><td>PG</td><td>SG</td><td>SF</td><td>PF</td><td>C</td><td>Total</td><td>Notes</td><td>PONS</td></tr>');

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const prev = i > 0 ? players[i - 1] : null;
        if (!player.valid) continue;

        if (prev && prev.total - 100 > player.total) {
            addLine();
        } else {
            if (prev && prev.total - 15.1 <= player.total) {
                grouped = true;
            }
        }

        let td = '';
        td += '<td>' + player.rank + '<span>(' + player.espnRank + ')</span></td>';
        td += '<td>' + player.name + '</td>';
        td = renderPositions(player, td);
        td += '<td>' + player.total + '</td>';
        td += '<td>' + player.note + '</td>';
        td += '<td>' + player.playoffSchedule + '</td>';
        const tdClass = player.undervalued ? 'undervalued' :
            player.undraftable ? 'undraftable' :
            player.unsure ? 'unsure' :
            player.probablyGone ? 'gone' :
            player.superGone ? 'supergone' : '';
        $('#table table').append(`<tr class="${tdClass}">` + td + '</tr>');
    }

    $('#table table tr').click(e => {
        const childWName = e.target.parentElement.children[1];
        if (!childWName) {
            $(e.target.parentElement).hide();
            return;
        }

        
        const player = list.findByName(childWName.textContent);
        if (!player) return;

        if (!player.primedForDeletion) {
            player.prime();
        } else {
            PICK++;
            if (PICK === PICKSTHRESHOLD && LINEINDEX !== POINTS4LINE.length - 1) LINEINDEX += 1;
            player.delete();
            Actions.enqueue(player, e.target.parentElement);
            insertLineIfAppropriate(e.target.parentElement, list);
            list.findGroupings();
        }
    });

    
    $('#table').css('display', 'flex');
    list.findGroupings();
};

$(document).ready(function() {
    const list = new PlayersList();

    $('#uploadfile').change(e => {
        const file = e.target.files.length ? e.target.files[0] : null;
        if (!file) alert('Invalid file');

        Papa.parse(file, {
            complete: function(results) {
                console.info('data parsing complete...');
                parseData(list, results.data);
                renderData(list);
            }
        });
    });

    $('#undo').click(() => {
        if (Actions.size()) {
            const toRestore = Actions.dequeue();
            toRestore.restore();
            PICK--;

            list.findGroupings();
        }
    });
});