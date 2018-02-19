/* Based on jspsych-text.js
 *
 * Display HTML text with navigation and timeout.
 *
 */

jsPsych.plugins.reading = (function() {

  var plugin = {};

  plugin.trial = function(display_element, trial) {

    trial.key_forward = trial.key_forward || 'rightarrow';
    trial.key_backward = trial.key_backward || 'leftarrow';
    trial.allow_backward = (typeof trial.allow_backward === 'undefined') ? true : trial.allow_backward;
    trial.allow_keys = (typeof trial.allow_keys === 'undefined') ? true : trial.allow_keys;
    trial.show_clickable_nav = (typeof trial.show_clickable_nav === 'undefined') ? false : trial.show_clickable_nav;

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    var current_page = 0;
    var furthest_page = current_page;

    var view_history = [];

    var start_time = (new Date()).getTime();

    var last_page_update_time = start_time;

    function show_current_page() {
      display_element.html(trial.pages[current_page]);

      if (trial.show_clickable_nav) {

        var nav_html = "<div class='jspsych-reading-nav'>";
        if (current_page != 0 && trial.allow_backward) {
          nav_html += "<button id='jspsych-reading-back' class='jspsych-btn'>&lt; Previous</button>";
        }
        nav_html += "<button id='jspsych-reading-next' class='jspsych-btn'>Next &gt;</button></div>"
        
        nav_html += "</div>"

        display_element.append(nav_html);

        if (current_page != 0 && trial.allow_backward) {
          $('#jspsych-reading-back').on('click', function() {
            clear_button_handlers();
            back();
          });
        }

        $('#jspsych-reading-next').on('click', function() {
          clear_button_handlers();
          next();
        });
      }
    }

    function clear_button_handlers() {
      $('#jspsych-reading-next').off('click');
      $('#jspsych-reading-back').off('click');
    }

    function next() {
      // FIXME: page count :)

      add_current_page_to_view_history()

      current_page++;


      // if done, finish up...
      if (current_page >= trial.pages.length) {
        end_trial();
      } else {
        furthest_page = current_page;
        show_current_page();
      }

    }

    function back() {

      add_current_page_to_view_history()

      current_page--;

      show_current_page();
    }

    function add_current_page_to_view_history() {

      var current_time = (new Date()).getTime();

      var page_view_time = current_time - last_page_update_time;

      view_history.push({
        page_index: current_page,
        viewing_time: page_view_time
      });

      last_page_update_time = current_time;
    }

    var after_response = function(info) {

      // have to reinitialize this instead of letting it persist to prevent accidental skips of pages by holding down keys too long
      keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
      // check if key is forwards or backwards and update page
      if (info.key === trial.key_backward || info.key === jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.key_backward)) {
        if (current_page !== 0 && trial.allow_backward) {
          back();
        }
      }

      if (info.key === trial.key_forward || info.key === jsPsych.pluginAPI.convertKeyCharacterToKeyCode(trial.key_forward)) {
        next();
      }
    };

    function end_trial() {
      clearTimeout(t1);
      display_element.html(''); // clear the display

      if (trial.allow_keys) {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
      }

      // FIXME: this is always the maximum (rather than actual) duration
      var block_duration = trial.timing_response

      var trialdata = {
        "text": trial.text,
        "rt": (new Date()).getTime() - start_time,
        "block_duration": block_duration,
        "timing_post_trial": trial.timing_post_trial,
        "furthest_page": furthest_page,
        "view_history": JSON.stringify(view_history)
      }

      jsPsych.finishTrial(trialdata);
    };

    show_current_page();

    if (trial.allow_keys) {
      var keyboard_listener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: [trial.key_forward, trial.key_backward],
        rt_method: 'date',
        persist: false
      });
    }
  
  // end trial if time limit is set
    if (trial.timing_response > 0) {
      var t1 = setTimeout(function() {
        end_trial();
      }, trial.timing_response);
    }
  };

  return plugin;
})();