const input_text = document.getElementById("input_text");
const parse_btn = document.getElementById("parse_btn");
const parsed_text = document.getElementById("parsed_text");
const note_list = document.getElementById("note_list");
const input_mode_label = document.getElementById("input_mode");
const input_buffer_textbox = document.getElementById("input_buffer");

const normal_mode = 'normal';
const edit_mode = 'edit';
const command_mode = 'command';

const key_commands = {
  "normal": {
    "a": add_word_to_note,
    "e": start_edit_mode,
    "n": start_new_note,
    "p": parse_text,
    "Shift+;": start_command_mode,
  }
};

const commands = {}

let greek_text = [];
let input_mode = '';
let notes = [];
let active_note = null;
let current_key_combo = '';
let current_cmd_buffer = '';

/*
Note Object:

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

  if (note.index > 0) {
    const note_index = document.createElement('div');
    note_index.textContent = note.index;
    note_div.appendChild(note_index);
  }

  const note_words = document.createElement('div');
  note_words.textContent = note.words.join(" ");
  note_div.appendChild(note_words);

  const note_parsing = document.createElement('div');
  if (active === true) {
    const note_parsing_input = document.createElement('textarea');
    note_parsing_input.id = 'note_parsing_input';
    note_parsing_input.textContent = note.parsing;
    note_parsing.appendChild(note_parsing_input)
  } else {
    note_parsing.textContent = note.parsing;
  }
  note_div.appendChild(note_parsing);

  const note_note = document.createElement('div');
  if (active === true) {
    const note_note_input = document.createElement('textarea');
    note_note_input.id = 'note_note_input';
    note_note_input.textContent = note.parsing;
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

  if (input_mode === edit_mode) {
    if (key !== 'Esc') {
      return;
    }
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
  if (input_mode === edit_mode) {
    if (current_key_combo === 'Esc') {
      e.preventDefault();
      exit_edit_mode();
    }
    return;
  }

  e.preventDefault();

  if (input_mode === command_mode) {
    if (e.code === 'Enter') {
      exec_command(current_cmd_buffer);
      clear_cmd_buffer();
      return;
    } else if (current_key_combo === 'Backspace') {
      current_cmd_buffer = current_cmd_buffer.substring(0, current_cmd_buffer.length - 1);
    } else if (current_key_combo.length === 1) {
      current_cmd_buffer += current_key_combo;
    }

    display_cmd_buffer(":");
    return;
  }

  if (isNumeric(current_key_combo)) {
    current_cmd_buffer += current_key_combo;
    display_cmd_buffer();
    return;
  }

  if (key_commands[input_mode][current_key_combo]) {
    key_commands[input_mode][current_key_combo](current_cmd_buffer);
    clear_cmd_buffer();
  }
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

function start_new_note() {
  active_note.parsing = document.getElementById('note_parsing_input').value;
  active_note.note = document.getElementById('note_note_input').value;
  active_note.index = notes.length + 1;
  notes.push(active_note);
  active_note = new_note();
  render_notes();
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

function exit_edit_mode() {
  set_input_mode(normal_mode);
  clear_cmd_buffer();
  document.activeElement.blur();
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

main();
