context('Zoning out')

test_that("process_expfactory_files() returns a data frame", {
  df <- process_expfactory_files('../fixtures/1')
  expect_is(df, "data.frame")
})

# test_that("bc_process_expfactory_file() parses data correctly", {
#   expect_equal(bc[[1,'rt']],14085)
# })