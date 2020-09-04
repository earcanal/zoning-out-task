globalVariables(c('.'))

#' expfactory.zoningout: A package for processing zoning out task data.
#'
#' This package processes data generated from a reading task for use in mind-wandering
#' experiments. The package can analyse data the task which runs in a web browser, and
#' was designed to be used within The Experiment Factory framework.
#'
#' @section expfactory.zoningout functions:
#' ...
#' @references Sayette, M. A., Reichle, E. D., & Schooler, J. W. (2009). Lost in the sauce: The effects of alcohol on mind wandering.
#' Psychological Science, 20(6), 747–752.
#'
#' @docType package
#' @name expfactory.zoningout
NULL

#' Process Experiment Factory zoning out data files
#'
#' Process Experiment Factory zoning data files.
#' @param path Path to data files
#' @importFrom magrittr %>%
#' @importFrom dplyr do filter group_by mutate select ungroup
#' @importFrom expfactory process_expfactory_experiment
#' @importFrom rlang .data
#' @export
#' @return Data frame
process_zoning_out_files <- function(path) {
  paths <-list.files(path, pattern = "zoning-out-task-results.json",
                     full.names = TRUE, recursive = TRUE)
  df <- expand.grid(path=paths, stringsAsFactors = FALSE) %>%
    group_by(.data$path) %>%
    do(., zoning_out_results(.data$path)) %>%
    mutate(token=gsub(".*/(.*)_finished/.*$", '\\1', .data$path)) %>%
    ungroup() %>%
    select(.data$token, .data$q, .data$correct)
  return(df)
}

#' @param path Path to JSON zoning out file
#' @importFrom dplyr everything filter
#' @importFrom jsonlite fromJSON
#' @importFrom rlang .data
#' @importFrom tidyr pivot_longer
#' @return Data frame
zoning_out_results <- function(path) {
  correct <- c('false', 'true', 'false', 'true', 'true', 'true', 'true',
               'false', 'true', 'false')
  df <- process_expfactory_experiment(path) %>%
    filter(.data$trial_type == 'survey-multi-choice')
  answers <- fromJSON(df$responses) %>%
    as.data.frame() %>%
    pivot_longer(everything(), names_to = 'q', values_to = 'correct')
  answered <- correct[1:length(answers$correct)]
  answers$correct <- answers$correct == answered
  answers
}