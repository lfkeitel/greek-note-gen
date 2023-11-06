const input_text = document.getElementById("input_text");
const parse_btn = document.getElementById("parse_btn");
const parsed_text = document.getElementById("parsed_text");
const note_list = document.getElementById("note_list");
const input_mode_label = document.getElementById("input_mode");
const input_buffer_textbox = document.getElementById("input_buffer");
const download_link = document.getElementById("download_link");

const normal_mode = 'normal';
const edit_mode = 'edit';
const command_mode = 'command';

// Ctrl+Alt+Shift+
const key_commands = {
  "normal": {
    "a": add_word_to_note,
    "e": start_edit_mode,
    "n": start_new_note,
    "p": parse_text,
    "Shift+;": start_command_mode,
  },
  "edit": {
    "Ctrl+Shift+a": insert_word,
  }
};

const commands = {}

let greek_text = [];
let input_mode = '';
let notes = [
  {
    index: 1,
    words: ['something'],
    parsing: 'N-NSN',
    note: 'This is an awesome note'
  }
];
let active_note = null;
let current_key_combo = '';
let current_cmd_buffer = '';

/*
Note Object:

index: 0
words: []
parsing: ""
note: ""
*/

/** Initialization */

function main() {
  set_input_mode(normal_mode);
  parse_btn.addEventListener("click", parse_text);

  document.addEventListener('keyup', exec_key_up);
  document.addEventListener('keydown', process_key_down);

  active_note = new_note();
  render_notes();
}

function new_note() {
  return {
    index: 0,
    words: [],
    parsing: '',
    note: ''
  }
}

function parse_text() {
  const greek_punct = /[.,·;]/g;
  const input = input_text.value;
  greek_text = input.split(" ").map((word) => word.replaceAll(greek_punct, '').trim());
  display_parsed_text();
}

function display_parsed_text() {
  greek_text.forEach((word, idx) => {
    const e = document.createElement('div');
    e.classList.add('wordbox');

    const wordbox = document.createElement('span');
    wordbox.textContent = word;
    wordbox.classList.add('wordbox-word');

    const numberbox = document.createElement('span');
    numberbox.textContent = idx + 1;
    numberbox.classList.add('wordbox-num');

    e.appendChild(wordbox);
    e.appendChild(numberbox);

    parsed_text.appendChild(e);
  });
}

function add_note_to_dom(note, active = false) {
  const note_div = document.createElement('div');
  note_div.classList.add("note-item");

  if (active !== true) {
    const note_index = document.createElement('div');
    note_index.classList.add("note-item-index");
    note_index.textContent = note.index;
    note_div.appendChild(note_index);
  }

  const note_words = document.createElement('div');
  note_words.classList.add("note-item-words");
  if (note.words.length === 0) {
    const words_placeholder = document.createElement('span');
    words_placeholder.classList.add('placeholder');
    words_placeholder.textContent = 'Add words to this note';
    note_words.appendChild(words_placeholder);
  } else {
    note_words.textContent = note.words.join(" ");
  }
  note_div.appendChild(note_words);

  const note_parsing = document.createElement('div');
  note_parsing.classList.add("note-item-parsing");
  if (active === true) {
    const note_parsing_input = document.createElement('textarea');
    note_parsing_input.id = 'note_parsing_input';
    note_parsing_input.value = note.parsing;
    note_parsing_input.placeholder = "Parsing";
    note_parsing_input.spellcheck = false;
    note_parsing_input.addEventListener('change', e => {
      const input = e.target;
      let val = input.value.toUpperCase().replace(/P$/, 'p').replace(/S$/, 's')
      input.value = val;
    });
    note_parsing.appendChild(note_parsing_input)
  } else {
    note_parsing.textContent = note.parsing;
  }
  note_div.appendChild(note_parsing);

  const note_note = document.createElement('div');
  note_note.classList.add("note-item-note");
  if (active === true) {
    const note_note_input = document.createElement('textarea');
    note_note_input.id = 'note_note_input';
    note_note_input.value = note.note;
    note_note_input.placeholder = "Notes";
    note_note.appendChild(note_note_input)
  } else {
    note_note.textContent = note.note;
  }
  note_div.appendChild(note_note);

  note_list.appendChild(note_div);
}

function render_notes() {
  note_list.innerHTML = '';

  add_note_to_dom(active_note, true);
  notes.forEach(add_note_to_dom);
}

/** Keyboard Input */

function process_key_down(e) {
  let key = String.fromCharCode(e.keyCode).toLowerCase();

  switch (e.keyCode) {
    case 27:
      key = 'Esc';
      break;
    case 8:
      key = 'Backspace';
      break;
  }

  if (input_mode === edit_mode && !e.ctrlKey) {
    if (key !== 'Esc') {
      return;
    }
  }

  // Shift + Arrow
  if (e.shiftKey && e.keyCode >= 37 && e.keyCode <= 40) {
    return true;
  }

  // Ctrl + v, c, x, a
  if (e.ctrlKey && (e.key === 'v' || e.key === 'a' || e.key === 'c' || e.key === 'x')) {
    return true;
  }

  e.preventDefault();

  let mod_keys = '';
  if (e.ctrlKey) { mod_keys += 'Ctrl+'; }
  if (e.altKey) { mod_keys += 'Alt+'; }
  if (e.shiftKey) { mod_keys += 'Shift+'; }

  current_key_combo = mod_keys + key;
  return false;
}

function exec_key_up(e) {
  if (current_key_combo === 'Esc') {
    e.preventDefault();
    start_normal_mode();
    current_key_combo = '';
    return true;
  }

  if (input_mode === edit_mode) {
    if (!current_key_combo.includes('Ctrl+')) {
      current_key_combo = '';
      return true;
    }
  }

  e.preventDefault();

  if (input_mode === command_mode) {
    if (e.code === 'Enter') {
      exec_command(current_cmd_buffer);
      clear_cmd_buffer();
      current_key_combo = '';
      return;
    } else if (current_key_combo === 'Backspace') {
      current_cmd_buffer = current_cmd_buffer.substring(0, current_cmd_buffer.length - 1);
    } else if (current_key_combo.length === 1) {
      current_cmd_buffer += current_key_combo;
    }

    display_cmd_buffer(":");
    current_key_combo = '';
    return;
  }

  if (isNumeric(current_key_combo)) {
    current_cmd_buffer += current_key_combo;
    display_cmd_buffer();
    current_key_combo = '';
    return;
  }

  if (key_commands[input_mode][current_key_combo]) {
    key_commands[input_mode][current_key_combo](current_cmd_buffer);
    clear_cmd_buffer();
  }
  current_key_combo = '';
}

function display_cmd_buffer(prefix = '') {
  input_buffer_textbox.textContent = prefix + current_cmd_buffer;
}

function set_input_mode(mode) {
  input_mode = mode;
  input_mode_label.textContent = input_mode;
}

/** Commands */

function exec_command(line) {
  const args = line.split(" ");
  const cmd = args[0];
  const cmd_args = args.slice(1);

  if (commands[cmd]) {
    commands[cmd](cmd_args);
    return;
  }

  default_command(args);
}

function default_command(args) {
  debug_log(args);
  set_input_mode(normal_mode);
}

/** Key Commands */

function add_word_to_note(word_index) {
  word_index--;
  active_note.words.push(greek_text[word_index]);
  render_notes();
}

function save_active_note() {
  active_note.parsing = document.getElementById('note_parsing_input').value;
  active_note.note = document.getElementById('note_note_input').value;
  active_note.index = notes.length + 1;
}

function start_new_note() {
  save_active_note();

  if (active_note.note.trim() === '') {
    return;
  }

  notes.push(active_note);
  active_note = new_note();
  render_notes();
  generate_download();
}

function start_command_mode() {
  set_input_mode(command_mode);
  clear_cmd_buffer();
}

function start_edit_mode() {
  set_input_mode(edit_mode);
  clear_cmd_buffer();
  document.getElementById("note_parsing_input").focus();
}

function start_normal_mode() {
  save_active_note();
  clear_cmd_buffer();
  set_input_mode(normal_mode);
  document.activeElement.blur();
}

function insert_word() {
  let word_index = prompt('Which word to insert?').trim();
  word_index--;
  save_active_note();
  active_note.note = active_note.note.trim() + ' ' + greek_text[word_index];
  render_notes();
  document.getElementById("note_note_input").focus();
}

function generate_download() {
  const data = JSON.stringify(notes);
  const a = create_download_link("notes.json", data);
  download_link.innerHTML = '';
  download_link.appendChild(a);
}

/** Helper functions */

function clear_cmd_buffer() {
  current_cmd_buffer = '';
  display_cmd_buffer();
}

function isNumeric(num) {
  return !isNaN(num)
}

function debug_log(v) {
  console.dir(v);
}

function create_download_link(filename, dataValue) {
  window.URL = window.webkitURL || window.URL;
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

  var a = document.createElement('a');
  a.download = `${filename}.md`

  if (BlobBuilder == undefined) {
    var bb = new Blob([dataValue], { 'type': 'text/markdown' });
    a.href = window.URL.createObjectURL(bb);
  } else {
    var bb = new BlobBuilder();
    bb.append(dataValue);
    a.href = window.URL.createObjectURL(bb.getBlob('text/markdown'));
  }

  a.textContent = 'Download ready';

  a.dataset.downloadurl = ['text/markdown', a.download, a.href].join(':');
  a.draggable = true; // Don't really need, but good practice.
  a.classList.add('dragout');

  a.onclick = function(e) {
    if ('disabled' in this.dataset) {
      return false;
    }
  };

  return a;
};

main();
