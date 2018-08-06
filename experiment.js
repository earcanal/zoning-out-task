/* ************************************ */
/* Define helper functions */
/* ************************************ */
var getInstructFeedback = function() {
  return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text + '</p></div>'
}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds

// task specific variables
var last_page = 16
var pages = []
var furthest_page = 0
var timelimit = 15

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};

/* define static blocks */
var end_block = {
  type: 'poldrack-text',
  data: {
    exp_id: "zoning_out_task",
    trial_id: "end"
  },
  text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>',
  cont_key: [13],
  timing_response: 180000,
  timing_post_trial: 0
};

var feedback_instruct_text =
  'Welcome to the experiment. Press <strong>enter</strong> to begin.'
var feedback_instruct_block = {
  type: 'poldrack-text',
  data: {
    trial_id: "instruction"
  },
  cont_key: [13],
  text: getInstructFeedback,
  timing_post_trial: 0,
  timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
  type: 'poldrack-instructions',
  data: {
    trial_id: "instruction"
  },
  pages: [
    "<div class = centerbox><p class = block-text>After reading these instructions we want you to spend " + timelimit + 
    " minutes, reading some pages from Tolstoy's novel <em>War and Peace</em>.</p><p class = block-text> Read at your normal pace, using the <strong>Previous</strong> and <strong>Next</strong> buttons " +
    "if you need to re-read anything. The experiment will automatically ask questions about what you have read after " + timelimit + ' minutes.' + ' </p>' +
    '<p class=block-text>We suggest you sit in an upright, relaxed posture that feels comfortable.</p></div>'
  ],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 500
};

var instruction_node = {
  timeline: [feedback_instruct_block, instructions_block],
  /* This function defines stopping criteria */
  loop_function: function(data) {
    for (i = 0; i < data.length; i++) {
      if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
        rt = data[i].rt
        sumInstructTime = sumInstructTime + rt
      }
    }
    if (sumInstructTime <= instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
      return true
    } else if (sumInstructTime > instructTimeThresh * 1000) {
      feedback_instruct_text =
        'Done with instructions. Press <strong>enter</strong> to continue.'
      return false
    }
  }
}

// read all of the pages
for (i=0; i <= last_page; i++) {
  // FIXME: http://stackoverflow.com/questions/29315005/synchronous-xmlhttprequest-deprecated/43915786#43915786
  $.ajax({
      url : 'text/' + i + '.html',
      cache: false,
      async: false,
      success : function(result) {
          pages.push(result);
      }
  });
}

var pages_block = {
  type: 'reading',
  data: {
    trial_id: 'text_pages'
  },
  pages: pages,
  allow_keys: true,
  show_clickable_nav: true,
  timing_response: timelimit * 60000,
  timing_post_trial: 500,
  on_finish: function(data) {
    // select answerable questions based on what's been read
    furthest_page = data.furthest_page;
    for (var key in questions) {
      if (furthest_page > key) {
        q.push(questions[key])
      }
    }
  }
};

// Same pseudorandom order for all participants set using following R code
// set.seed(001)
// sample(1:10 >= 5)
// [1] FALSE  TRUE FALSE  TRUE  TRUE  TRUE  TRUE FALSE  TRUE FALSE
//
// Keys are page numbers which contain the answer to associated question
var questions = {
  0: 'Anna Pa&#769;vlovna said she had been suffering from headaches.',
  2: 'According to Anna Pa&#769;vlovna, England has refused to evacuate Malta.',
  4: 'Princess Mary Bolkonskaya is a relation of Anna Pa&#769;vlovna.',
  5: 'Princess Mary Bolkonskaya is known as the most fascinating woman in Petersburg',
  7: 'Pierre is stout and heavily built.',
  9: 'The Duc d&apos;Enghien was murdered.',
  10: 'Princess He&#769;le&#768;ne wore a white dress trimmed with moss and ivy.',
  12: 'Pierre is French.',
  13: 'Prince Andrew Bolko&#769;nski is going to war.',
  15: 'Prince Vasi&#769;ali can easily make requests of the Emporer.'
}
var q = [];

// Questions block has to be configured dynamically, _after_ we know how many pages were read
var questions_block = {
  type: 'survey-multi-choice',
  data: {
    trial_id: 'questions'
  },
  questions: function() { return q },
  options:   function() { var o = []; for (i = 0; i < q.length; i++) { o.push(['true','false']) } return o },
  required:  function() { var r = []; for (i = 0; i < q.length; i++) { r.push(true) }; return r }
}

// FYI: dynamic timelines (https://groups.google.com/forum/#!topic/jspsych/iyc5WQoMbQs)

// consent page
// SEE ALSO: poldrack_plugins/jspsych-consent.js
var check_consent = function(elem) {
  if ($('#consent_checkbox').is(':checked')) {
    return true;
  }
  else {
    alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
    return false;
  }
  return false;
};
var consent = {
  type:'html',
  url: "/static/experiments/zoning_out_task/text/consent.html",
  cont_btn: "start",
  check_fn: check_consent
};


/* create experiment definition array */
/* name MUST be of the form {{exp_id}}_experiment  */
var zoning_out_task_experiment = [];
zoning_out_task_experiment.push(instruction_node);
zoning_out_task_experiment.push(pages_block);
zoning_out_task_experiment.push(questions_block);
//zoning_out_task_experiment.push(post_task_block);
zoning_out_task_experiment.push(end_block);