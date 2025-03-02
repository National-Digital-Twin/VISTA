Feature: Zoom and pan functionality on paralog

Background:
    Given I login to the ndtp app with the user credentials
    And   I click the Paralog menu

   Scenario: Verify user can zoom in and out on the paralog map using zoom button
      When I zoom in and out using the zoom button
      Then I should be able to compare zoom in and out screenshots

  Scenario: Verify user can zoom in and out on the paralog map
      When I zoom in and out on the map
      Then I should be able to see the zoom difference in the screenshots

  Scenario: Verify user can pan around on the paralog map
      When I pan around the map
      Then I should be able to compare the screenshots before and after panning
