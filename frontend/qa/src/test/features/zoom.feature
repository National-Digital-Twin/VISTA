Feature: Zoom functionality on paralog

Background:
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu

  Scenario: Verify user can zoom in and out on the paralog map using zoom button
    Then  I should be able to zoom in and out on the map using zoom button

  Scenario: Verify user can zoom in and out on the paralog map
    Then  I should be able to zoom in and out on the map
